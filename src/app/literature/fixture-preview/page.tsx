import { notFound } from 'next/navigation'
import fs from 'fs'
import path from 'path'
import FixturePreview from './preview-client'

export const dynamic = 'force-dynamic'

export default function LiteratureFixturePreviewPage() {
  if (process.env.NODE_ENV === 'production') notFound()

  const file = path.join(process.cwd(), 'tests/fixtures/literature-reader-fixture.json')
  if (!fs.existsSync(file)) notFound()
  const works = JSON.parse(fs.readFileSync(file, 'utf8'))
  return <FixturePreview works={works} />
}
