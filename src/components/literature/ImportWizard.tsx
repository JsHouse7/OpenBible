'use client'

import { useState } from 'react'
import {
  AlertCircle,
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
  Globe,
  Merge,
  Pencil,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { LiteratureParser, LiteratureWork, ParseOptions } from '@/lib/literatureParser'
import { LiteratureService } from '@/lib/literatureService'
import { isLikelyScannedPdf } from '@/lib/literatureContentUtils'

type WizardStep = 'upload' | 'metadata' | 'chapters'

interface ImportWizardProps {
  sessionToken?: string
  parseOptions: ParseOptions
  onParseOptionsChange: (opts: ParseOptions) => void
  onSaved: () => void
}

export function ImportWizard({
  parseOptions,
  onParseOptionsChange,
  onSaved,
}: ImportWizardProps) {
  const [step, setStep] = useState<WizardStep>('upload')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [sourceUrl, setSourceUrl] = useState('')
  const [status, setStatus] = useState<'idle' | 'parsing' | 'saving' | 'error' | 'success'>('idle')
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState('')
  const [previewWork, setPreviewWork] = useState<LiteratureWork | null>(null)
  const [metadata, setMetadata] = useState({
    title: '',
    author: '',
    year: '',
    difficulty: 'intermediate' as 'beginner' | 'intermediate' | 'advanced',
    description: '',
  })
  const [selectedChapters, setSelectedChapters] = useState<number[]>([])
  const [editingTitleIdx, setEditingTitleIdx] = useState<number | null>(null)
  const [editingTitle, setEditingTitle] = useState('')

  const reset = () => {
    setStep('upload')
    setSelectedFile(null)
    setSourceUrl('')
    setStatus('idle')
    setProgress(0)
    setMessage('')
    setPreviewWork(null)
    setMetadata({ title: '', author: '', year: '', difficulty: 'intermediate', description: '' })
    setSelectedChapters([])
  }

  const parseSource = async (file?: File, url?: string) => {
    setStatus('parsing')
    setProgress(10)
    setMessage('Reading source...')

    try {
      let parsed: LiteratureWork

      if (file) {
        const ext = file.name.split('.').pop()?.toLowerCase()
        setProgress(30)
        setMessage(`Parsing ${ext?.toUpperCase()} file...`)

        switch (ext) {
          case 'txt': {
            const text = await file.text()
            parsed = await LiteratureParser.parseText(text, parseOptions)
            break
          }
          case 'pdf': {
            const { text, pageCount } = await LiteratureService.extractPdfText(file)
            if (isLikelyScannedPdf(text, pageCount)) {
              throw new Error(
                'This PDF appears to be scanned (image-only). OCR is required before import. Try a text-based PDF or paste the text manually.'
              )
            }
            parsed = await LiteratureParser.parseText(text, parseOptions, 'pdf')
            break
          }
          case 'docx': {
            const { text } = await LiteratureService.extractDocxText(file)
            parsed = await LiteratureParser.parseText(text, parseOptions, 'docx')
            break
          }
          case 'epub':
            parsed = await LiteratureParser.parseEpub(file, parseOptions)
            break
          case 'json': {
            const works = await LiteratureService.importLiteratureWorks(file)
            if (works.length === 0) throw new Error('No valid works found in JSON file.')
            parsed = works[0]
            break
          }
          case 'html':
          case 'htm':
          case 'xhtml': {
            const raw = await file.text()
            const html = await LiteratureService.sanitizeHtmlLiterature(raw)
            parsed = await LiteratureParser.parseHtml(html, parseOptions)
            break
          }
          default:
            throw new Error(`Unsupported format: .${ext}`)
        }
      } else if (url) {
        setMessage('Fetching web page...')
        const { html } = await LiteratureService.fetchHtmlFromUrl(url)
        setProgress(50)
        parsed = await LiteratureParser.parseHtml(html, parseOptions)
      } else {
        throw new Error('Select a file or enter a URL.')
      }

      setProgress(90)
      const nameFromFile = file?.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ') ?? ''
      setMetadata({
        title: metadata.title || parsed.title || nameFromFile,
        author: metadata.author || parsed.author,
        year: metadata.year || (parsed.year?.toString() ?? ''),
        difficulty: parsed.difficulty,
        description: metadata.description || parsed.description,
      })
      setPreviewWork(parsed)
      setStatus('idle')
      setProgress(100)
      setMessage(`Found ${parsed.chapters.length} chapters`)
      setStep('metadata')
    } catch (err) {
      setStatus('error')
      setProgress(0)
      setMessage(err instanceof Error ? err.message : 'Parse failed')
    }
  }

  const applyMetadata = (): LiteratureWork | null => {
    if (!previewWork) return null
    const year = metadata.year ? parseInt(metadata.year, 10) : previewWork.year
    return LiteratureParser.recalculateWorkMetadata({
      ...previewWork,
      title: metadata.title.trim() || previewWork.title,
      author: metadata.author.trim() || previewWork.author,
      year: Number.isFinite(year) ? year : previewWork.year,
      difficulty: metadata.difficulty,
      description: metadata.description.trim() || previewWork.description,
    })
  }

  const handleSave = async () => {
    const work = applyMetadata()
    if (!work) return

    setStatus('saving')
    setMessage('Saving to library...')
    try {
      await LiteratureService.saveLiteratureWork(work)
      setStatus('success')
      setMessage(`"${work.title}" saved successfully!`)
      onSaved()
      setTimeout(reset, 2000)
    } catch (err) {
      setStatus('error')
      setMessage(err instanceof Error ? err.message : 'Save failed')
    }
  }

  const toggleChapterSelect = (idx: number) => {
    setSelectedChapters((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    )
  }

  const handleMergeSelected = () => {
    if (!previewWork || selectedChapters.length < 2) return
    const merged = LiteratureParser.mergeChapters(previewWork.chapters, selectedChapters)
    setPreviewWork(LiteratureParser.recalculateWorkMetadata({ ...previewWork, chapters: merged }))
    setSelectedChapters([])
  }

  const handleDeleteChapter = (idx: number) => {
    if (!previewWork) return
    const chapters = LiteratureParser.deleteChapter(previewWork.chapters, idx)
    setPreviewWork(LiteratureParser.recalculateWorkMetadata({ ...previewWork, chapters }))
    setSelectedChapters([])
  }

  const handleRenameChapter = (idx: number) => {
    if (!previewWork || !editingTitle.trim()) return
    const chapters = LiteratureParser.renameChapter(previewWork.chapters, idx, editingTitle.trim())
    setPreviewWork({ ...previewWork, chapters })
    setEditingTitleIdx(null)
    setEditingTitle('')
  }

  const handleSplitChapter = (idx: number) => {
    if (!previewWork) return
    const ch = previewWork.chapters[idx]
    const plain = ch.plainText || ch.content
    const midpoint = Math.floor(plain.length / 2)
    const chapters = LiteratureParser.splitChapterAt(previewWork.chapters, idx, midpoint)
    setPreviewWork(LiteratureParser.recalculateWorkMetadata({ ...previewWork, chapters }))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {(['upload', 'metadata', 'chapters'] as WizardStep[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            {i > 0 && <ChevronRight className="h-4 w-4" />}
            <span className={step === s ? 'text-primary font-medium' : ''}>
              {s === 'upload' ? '1. Upload' : s === 'metadata' ? '2. Metadata' : '3. Chapters'}
            </span>
          </div>
        ))}
      </div>

      {status !== 'idle' && message && (
        <div
          className={`rounded-lg p-3 flex items-start gap-2 text-sm ${
            status === 'error'
              ? 'bg-destructive/10 text-destructive'
              : status === 'success'
                ? 'bg-green-500/10 text-green-700 dark:text-green-400'
                : 'bg-muted'
          }`}
        >
          {status === 'error' && <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />}
          {status === 'success' && <Check className="h-4 w-4 shrink-0 mt-0.5" />}
          <span>{message}</span>
        </div>
      )}

      {(status === 'parsing' || status === 'saving') && (
        <Progress value={progress} className="h-2" />
      )}

      {step === 'upload' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Drop a file
              </CardTitle>
              <CardDescription>
                TXT, PDF, DOCX, EPUB, HTML, XHTML, or JSON
              </CardDescription>
            </CardHeader>
            <CardContent>
              <label className="border-2 border-dashed border-muted-foreground/25 rounded-xl p-8 flex flex-col items-center gap-3 cursor-pointer hover:border-primary/50 transition-colors">
                <input
                  type="file"
                  className="hidden"
                  accept=".txt,.epub,.html,.htm,.pdf,.docx,.xhtml,.json"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) {
                      setSelectedFile(f)
                      setSourceUrl('')
                    }
                  }}
                />
                <FileText className="h-12 w-12 text-muted-foreground" />
                <span className="font-medium">Click or drag a file here</span>
                {selectedFile && (
                  <Badge variant="outline">
                    {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </Badge>
                )}
              </label>
              {selectedFile && (
                <Button
                  className="w-full mt-4"
                  onClick={() => parseSource(selectedFile)}
                  disabled={status === 'parsing'}
                >
                  Parse file
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Import from URL
              </CardTitle>
              <CardDescription>Public web pages (Project Gutenberg, etc.)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                type="url"
                placeholder="https://example.org/book/chapter.html"
                value={sourceUrl}
                onChange={(e) => {
                  setSourceUrl(e.target.value)
                  setSelectedFile(null)
                }}
              />
              <Button
                className="w-full"
                variant="secondary"
                onClick={() => parseSource(undefined, sourceUrl.trim())}
                disabled={!sourceUrl.trim() || status === 'parsing'}
              >
                Fetch &amp; parse
              </Button>
              <p className="text-xs text-muted-foreground">
                If the site blocks bots, save the page as HTML and upload the file instead.
              </p>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Parser options</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Chapter detection</Label>
                <Select
                  value={parseOptions.chapterDetection}
                  onValueChange={(v: ParseOptions['chapterDetection']) =>
                    onParseOptionsChange({ ...parseOptions, chapterDetection: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Automatic</SelectItem>
                    <SelectItem value="headers">Headers</SelectItem>
                    <SelectItem value="pageBreaks">Page breaks</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <Label>Remove footnotes</Label>
                <Switch
                  checked={parseOptions.removeFootnotes ?? true}
                  onCheckedChange={(c) =>
                    onParseOptionsChange({ ...parseOptions, removeFootnotes: c })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Preserve formatting</Label>
                <Switch
                  checked={parseOptions.preserveFormatting ?? true}
                  onCheckedChange={(c) =>
                    onParseOptionsChange({ ...parseOptions, preserveFormatting: c })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {step === 'metadata' && previewWork && (
        <Card>
          <CardHeader>
            <CardTitle>Review metadata</CardTitle>
            <CardDescription>
              Auto-detected values are shown below — edit anything that looks wrong.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={metadata.title}
                  onChange={(e) => setMetadata((m) => ({ ...m, title: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Author</Label>
                <Input
                  value={metadata.author}
                  onChange={(e) => setMetadata((m) => ({ ...m, author: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Year</Label>
                <Input
                  type="number"
                  value={metadata.year}
                  onChange={(e) => setMetadata((m) => ({ ...m, year: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Difficulty</Label>
                <Select
                  value={metadata.difficulty}
                  onValueChange={(v: 'beginner' | 'intermediate' | 'advanced') =>
                    setMetadata((m) => ({ ...m, difficulty: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={metadata.description}
                onChange={(e) => setMetadata((m) => ({ ...m, description: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('upload')}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <Button onClick={() => setStep('chapters')}>
                Review chapters
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'chapters' && previewWork && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle>Chapter review</CardTitle>
                <CardDescription>
                  {previewWork.chapters.length} chapters ·{' '}
                  {previewWork.metadata?.wordCount?.toLocaleString()} words
                </CardDescription>
              </div>
              {selectedChapters.length >= 2 && (
                <Button size="sm" variant="secondary" onClick={handleMergeSelected}>
                  <Merge className="h-4 w-4 mr-1" />
                  Merge {selectedChapters.length} chapters
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[50vh] overflow-y-auto">
            {previewWork.chapters.map((ch, idx) => (
              <div
                key={ch.id}
                className={`flex items-center gap-2 p-3 rounded-lg border ${
                  selectedChapters.includes(idx) ? 'border-primary bg-primary/5' : 'border-border'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedChapters.includes(idx)}
                  onChange={() => toggleChapterSelect(idx)}
                  className="shrink-0"
                />
                <div className="flex-1 min-w-0">
                  {editingTitleIdx === idx ? (
                    <div className="flex gap-1">
                      <Input
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        className="h-8"
                      />
                      <Button size="sm" onClick={() => handleRenameChapter(idx)}>
                        Save
                      </Button>
                    </div>
                  ) : (
                    <p className="font-medium text-sm truncate">{ch.title}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {ch.wordCount.toLocaleString()} words
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setEditingTitleIdx(idx)
                    setEditingTitle(ch.title)
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleSplitChapter(idx)}>
                  <span className="text-xs font-bold">½</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteChapter(idx)}
                  disabled={previewWork.chapters.length <= 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
          <div className="px-6 pb-6 flex gap-2">
            <Button variant="outline" onClick={() => setStep('metadata')}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <Button className="flex-1" onClick={handleSave} disabled={status === 'saving'}>
              Save to library
            </Button>
            <Button variant="ghost" size="icon" onClick={reset}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
