'use client'

import { useState, useRef } from 'react'
import { Upload, FileText, Book, Settings, Download, Trash2, Eye, Plus, Check, X, AlertCircle, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { LiteratureParser, LiteratureWork, ParseOptions } from '@/lib/literatureParser'
import { LiteratureService } from '@/lib/literatureService'

interface UploadStatus {
  status: 'idle' | 'uploading' | 'parsing' | 'success' | 'error'
  progress: number
  message: string
  work?: LiteratureWork
}

interface ExistingWork {
  id: string
  title: string
  author: string
  difficulty: string
  wordCount: number
  chapters: number
  lastModified: string
}

interface LiteratureAdminProps {
  onWorkAdded?: () => void
}

export function LiteratureAdmin({ onWorkAdded }: LiteratureAdminProps = {}) {
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({
    status: 'idle',
    progress: 0,
    message: ''
  })
  const [parseOptions, setParseOptions] = useState<ParseOptions>({
    chapterDetection: 'auto',
    removeFootnotes: true,
    preserveFormatting: false
  })
  const [workMetadata, setWorkMetadata] = useState<{
    title: string
    author: string
    year: string
    difficulty: 'beginner' | 'intermediate' | 'advanced'
    description: string
  }>({
    title: '',
    author: '',
    year: '',
    difficulty: 'intermediate',
    description: ''
  })
  const [existingWorks, setExistingWorks] = useState<ExistingWork[]>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewWork, setPreviewWork] = useState<LiteratureWork | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setUploadStatus({ status: 'idle', progress: 0, message: '' })
      
      // Auto-fill metadata from filename
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '')
      setWorkMetadata(prev => ({
        ...prev,
        title: prev.title || nameWithoutExt.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      }))
    }
  }

  const handleParseFile = async () => {
    if (!selectedFile) return

    setUploadStatus({ status: 'parsing', progress: 20, message: 'Reading file...' })

    try {
      let parsedWork: LiteratureWork
      const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase()

      setUploadStatus({ status: 'parsing', progress: 40, message: 'Parsing content...' })

      switch (fileExtension) {
        case 'txt':
          const textContent = await selectedFile.text()
          parsedWork = await LiteratureParser.parseText(textContent, parseOptions)
          break
        case 'epub':
          parsedWork = await LiteratureParser.parseEpub(selectedFile)
          break
        case 'html':
        case 'htm':
          const htmlContent = await selectedFile.text()
          parsedWork = await LiteratureParser.parseHtml(htmlContent)
          break
        default:
          throw new Error(`Unsupported file format: ${fileExtension}`)
      }

      setUploadStatus({ status: 'parsing', progress: 70, message: 'Processing chapters...' })

      // Apply user metadata overrides
      const finalWork: LiteratureWork = {
        ...parsedWork,
        title: workMetadata.title || parsedWork.title,
        author: workMetadata.author || parsedWork.author,
        year: workMetadata.year ? parseInt(workMetadata.year) : parsedWork.year,
        difficulty: workMetadata.difficulty,
        description: workMetadata.description || parsedWork.description
      }

      setPreviewWork(finalWork)
      setUploadStatus({ 
        status: 'success', 
        progress: 100, 
        message: `Successfully parsed "${finalWork.title}" with ${finalWork.chapters.length} chapters`,
        work: finalWork
      })
    } catch (error) {
      setUploadStatus({
        status: 'error',
        progress: 0,
        message: `Error parsing file: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
    }
  }

  const handleSaveWork = async () => {
    if (!previewWork) return

    setUploadStatus({ status: 'uploading', progress: 80, message: 'Saving literature work...' })

    try {
      console.log('Saving work:', JSON.stringify(previewWork, null, 2));
      // Save using LiteratureService
      await LiteratureService.saveLiteratureWork(previewWork)

      // Update existing works list
      const newWork: ExistingWork = {
        id: previewWork.id,
        title: previewWork.title,
        author: previewWork.author,
        difficulty: previewWork.difficulty,
        wordCount: previewWork.metadata?.wordCount || 0,
        chapters: previewWork.chapters.length,
        lastModified: new Date().toISOString()
      }
      setExistingWorks(prev => [...prev, newWork])

      setUploadStatus({
        status: 'success',
        progress: 100,
        message: `"${previewWork.title}" has been saved successfully!`
      })

      // Call the callback to notify parent component
      onWorkAdded?.()

      // Reset form
      setTimeout(() => {
        setSelectedFile(null)
        setPreviewWork(null)
        setWorkMetadata({ title: '', author: '', year: '', difficulty: 'intermediate', description: '' })
        setUploadStatus({ status: 'idle', progress: 0, message: '' })
        if (fileInputRef.current) fileInputRef.current.value = ''
      }, 2000)
    } catch (error) {
      setUploadStatus({
        status: 'error',
        progress: 0,
        message: `Error saving work: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
    }
  }

  const handleDeleteWork = (workId: string) => {
    setExistingWorks(prev => prev.filter(work => work.id !== workId))
  }

  const handleRefreshLibrary = () => {
    // Force refresh the library by calling the callback
    onWorkAdded?.()
  }

  const resetUpload = () => {
    setSelectedFile(null)
    setPreviewWork(null)
    setUploadStatus({ status: 'idle', progress: 0, message: '' })
    setWorkMetadata({ title: '', author: '', year: '', difficulty: 'intermediate', description: '' })
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Literature Administration</h1>
        <p className="text-muted-foreground">
          Upload and manage literature works. Supports TXT, EPUB, and HTML formats.
        </p>
      </div>

      <Tabs defaultValue="upload" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload">Upload New Work</TabsTrigger>
          <TabsTrigger value="manage">Manage Works</TabsTrigger>
          <TabsTrigger value="settings">Parser Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upload Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  File Upload
                </CardTitle>
                <CardDescription>
                  Select a literature file to parse and add to the library
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt,.epub,.html,.htm"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="h-12 w-12 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Click to upload file</p>
                        <p className="text-sm text-muted-foreground">
                          Supports TXT, EPUB, HTML formats
                        </p>
                      </div>
                    </div>
                  </label>
                </div>

                {selectedFile && (
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span className="text-sm font-medium">{selectedFile.name}</span>
                      <Badge variant="outline">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </Badge>
                    </div>
                    <Button variant="ghost" size="sm" onClick={resetUpload}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {uploadStatus.status !== 'idle' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>{uploadStatus.message}</span>
                      {uploadStatus.status === 'success' && <Check className="h-4 w-4 text-green-500" />}
                      {uploadStatus.status === 'error' && <AlertCircle className="h-4 w-4 text-red-500" />}
                    </div>
                    <Progress value={uploadStatus.progress} className="h-2" />
                  </div>
                )}

                <div className="flex gap-2">
                  <Button 
                    onClick={handleParseFile} 
                    disabled={!selectedFile || uploadStatus.status === 'parsing'}
                    className="flex-1"
                  >
                    {uploadStatus.status === 'parsing' ? 'Parsing...' : 'Parse File'}
                  </Button>
                  {previewWork && (
                    <Button onClick={handleSaveWork} variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Save Work
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Metadata Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Work Metadata
                </CardTitle>
                <CardDescription>
                  Override or supplement the automatically detected metadata
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={workMetadata.title}
                      onChange={(e) => setWorkMetadata(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Work title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="author">Author</Label>
                    <Input
                      id="author"
                      value={workMetadata.author}
                      onChange={(e) => setWorkMetadata(prev => ({ ...prev, author: e.target.value }))}
                      placeholder="Author name"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="year">Publication Year</Label>
                    <Input
                      id="year"
                      type="number"
                      value={workMetadata.year}
                      onChange={(e) => setWorkMetadata(prev => ({ ...prev, year: e.target.value }))}
                      placeholder="e.g., 1517"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="difficulty">Difficulty Level</Label>
                    <Select
                      value={workMetadata.difficulty}
                      onValueChange={(value: 'beginner' | 'intermediate' | 'advanced') => 
                        setWorkMetadata(prev => ({ ...prev, difficulty: value }))
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
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={workMetadata.description}
                    onChange={(e) => setWorkMetadata(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of the work"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview Section */}
          {previewWork && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Preview: {previewWork.title}
                </CardTitle>
                <CardDescription>
                  Review the parsed work before saving
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">{previewWork.chapters.length}</div>
                    <div className="text-sm text-muted-foreground">Chapters</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">
                      {previewWork.metadata?.wordCount?.toLocaleString() || 'N/A'}
                    </div>
                    <div className="text-sm text-muted-foreground">Words</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">
                      {previewWork.metadata?.estimatedReadingTime || 'N/A'}m
                    </div>
                    <div className="text-sm text-muted-foreground">Reading Time</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Chapters:</h4>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {previewWork.chapters.map((chapter) => (
                      <div key={chapter.id} className="flex justify-between items-center p-2 bg-muted rounded text-sm">
                        <span>{chapter.title}</span>
                        <Badge variant="outline">{chapter.wordCount} words</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="manage" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Book className="h-5 w-5" />
                    Existing Literature Works
                  </CardTitle>
                  <CardDescription>
                    Manage your uploaded literature collection
                  </CardDescription>
                </div>
                <Button 
                  onClick={handleRefreshLibrary}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh Library
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {existingWorks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Book className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No literature works uploaded yet.</p>
                  <p className="text-sm">Use the Upload tab to add your first work.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {existingWorks.map((work) => (
                    <div key={work.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-medium">{work.title}</h3>
                        <p className="text-sm text-muted-foreground">by {work.author}</p>
                        <div className="flex gap-4 mt-2">
                          <Badge variant="outline">{work.difficulty}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {work.chapters} chapters • {work.wordCount.toLocaleString()} words
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDeleteWork(work.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Parser Configuration</CardTitle>
              <CardDescription>
                Configure how literature files are parsed and processed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Chapter Detection Method</Label>
                  <Select
                    value={parseOptions.chapterDetection}
                    onValueChange={(value: 'auto' | 'manual' | 'pageBreaks' | 'headers') => 
                      setParseOptions(prev => ({ ...prev, chapterDetection: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Automatic (Recommended)</SelectItem>
                      <SelectItem value="headers">Header-based</SelectItem>
                      <SelectItem value="pageBreaks">Page Breaks</SelectItem>
                      <SelectItem value="manual">Manual Markers</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Automatic detection looks for common chapter patterns like "Chapter 1", "PART I", etc.
                  </p>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Remove Footnotes</Label>
                      <p className="text-xs text-muted-foreground">
                        Automatically remove footnote markers like [1], (2), etc.
                      </p>
                    </div>
                    <Switch
                      checked={parseOptions.removeFootnotes}
                      onCheckedChange={(checked) => 
                        setParseOptions(prev => ({ ...prev, removeFootnotes: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Preserve Formatting</Label>
                      <p className="text-xs text-muted-foreground">
                        Keep original text formatting and spacing
                      </p>
                    </div>
                    <Switch
                      checked={parseOptions.preserveFormatting}
                      onCheckedChange={(checked) => 
                        setParseOptions(prev => ({ ...prev, preserveFormatting: checked }))
                      }
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}