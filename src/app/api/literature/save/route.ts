import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function POST(request: NextRequest) {
  try {
    const { filename, content } = await request.json()
    
    if (!filename || !content) {
      return NextResponse.json(
        { error: 'Filename and content are required' },
        { status: 400 }
      )
    }

    // Ensure the literature directory exists
    const literatureDir = join(process.cwd(), 'public', 'literature')
    if (!existsSync(literatureDir)) {
      await mkdir(literatureDir, { recursive: true })
    }

    // Write the file
    const filePath = join(literatureDir, filename)
    await writeFile(filePath, content, 'utf8')

    return NextResponse.json(
      { message: 'File saved successfully', filename },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error saving file:', error)
    return NextResponse.json(
      { error: 'Failed to save file' },
      { status: 500 }
    )
  }
}