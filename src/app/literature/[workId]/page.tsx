'use client'

import { useRouter, useParams } from 'next/navigation'
import { LiteratureReader } from '@/components/LiteratureReader'

export default function LiteratureReaderPage() {
  const router = useRouter()
  const params = useParams()
  const workId = typeof params.workId === 'string' ? params.workId : ''

  if (!workId) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-muted-foreground">Missing work.</p>
      </div>
    )
  }

  return <LiteratureReader workId={workId} onClose={() => router.push('/literature')} />
}
