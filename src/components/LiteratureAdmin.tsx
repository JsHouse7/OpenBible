'use client'

import { useState, useEffect } from 'react'
import { Book, RefreshCw, AlertCircle, Eye, Trash2, Download } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'
import { useAuth } from '@/components/AuthProvider'
import { ParseOptions } from '@/lib/literatureParser'
import { LiteratureService } from '@/lib/literatureService'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/Button'
import { ImportWizard } from '@/components/literature/ImportWizard'

interface ExistingWork {
  id: string
  title: string
  author: string
  difficulty: string
  wordCount: number
  chapters: number
  description: string
  year: number
  ownerUserId?: string | null
}

interface LiteratureAdminProps {
  onWorkAdded?: () => void
}

export function LiteratureAdmin({ onWorkAdded }: LiteratureAdminProps = {}) {
  const { session, user } = useAuth()
  const [parseOptions, setParseOptions] = useState<ParseOptions>({
    chapterDetection: 'auto',
    removeFootnotes: true,
    preserveFormatting: true,
  })
  const [existingWorks, setExistingWorks] = useState<ExistingWork[]>([])
  const [existingWorksLoading, setExistingWorksLoading] = useState(true)
  const [existingWorksError, setExistingWorksError] = useState<string | null>(null)

  const loadExistingWorks = async () => {
    try {
      setExistingWorksError(null)
      setExistingWorksLoading(true)
      const index = await LiteratureService.getLiteratureIndex()
      setExistingWorks(
        index.works.map((work) => ({
          id: work.id,
          title: work.title,
          author: work.author,
          difficulty: work.difficulty || 'intermediate',
          wordCount: work.wordCount || 0,
          chapters: work.chapterCount || 0,
          description: work.description || '',
          year: work.year ?? 0,
          ownerUserId: work.ownerUserId,
        }))
      )
    } catch (error) {
      setExistingWorksError(
        error instanceof Error ? error.message : 'Could not load works.'
      )
      setExistingWorks([])
    } finally {
      setExistingWorksLoading(false)
    }
  }

  useEffect(() => {
    loadExistingWorks()
  }, [])

  const handleDeleteWork = async (workId: string) => {
    if (!confirm('Delete this work permanently?')) return
    try {
      await LiteratureService.deleteLiteratureWork(workId)
      await loadExistingWorks()
      onWorkAdded?.()
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Delete failed')
    }
  }

  const canManage = (work: ExistingWork) =>
    Boolean(user?.id && work.ownerUserId && work.ownerUserId === user.id)

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Literature Administration</h1>
        <p className="text-muted-foreground">
          Import books from files or web pages, review chapters, and manage your library.
        </p>
      </div>

      <Tabs defaultValue="upload" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">Import</TabsTrigger>
          <TabsTrigger value="manage">Manage Works</TabsTrigger>
        </TabsList>

        <TabsContent value="upload">
          <ImportWizard
            sessionToken={session?.access_token}
            parseOptions={parseOptions}
            onParseOptionsChange={setParseOptions}
            onSaved={() => {
              loadExistingWorks()
              onWorkAdded?.()
            }}
          />
        </TabsContent>

        <TabsContent value="manage">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Book className="h-5 w-5" />
                    Your library
                  </CardTitle>
                  <CardDescription>Export, open, or delete works you own</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => LiteratureService.exportLiteratureWorks()}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Export all
                  </Button>
                  <Button variant="outline" size="sm" onClick={loadExistingWorks}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {existingWorksLoading ? (
                <p className="text-center py-8 text-muted-foreground">Loading...</p>
              ) : existingWorksError ? (
                <div className="rounded-lg border border-destructive/50 p-4 flex gap-2 text-destructive">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <p>{existingWorksError}</p>
                </div>
              ) : existingWorks.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No works yet.</p>
              ) : (
                <div className="space-y-3">
                  {existingWorks.map((work) => (
                    <div
                      key={work.id}
                      className="flex items-center justify-between p-4 border rounded-lg gap-4"
                    >
                      <div className="min-w-0">
                        <h3 className="font-medium truncate">{work.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {work.author} · {work.chapters} ch · {work.wordCount.toLocaleString()} words
                        </p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => LiteratureService.downloadWorkAsJson(work.id)}
                        >
                          JSON
                        </Button>
                        <Link
                          href={`/literature/${work.id}`}
                          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        {canManage(work) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteWork(work.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
