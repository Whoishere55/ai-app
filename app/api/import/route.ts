import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseZipBuffer, getMostRecentConversation, buildPreview, extractMessages } from '@/lib/chatgpt-importer'

const MAX_UPLOAD_SIZE = 10 * 1024 * 1024 // 10MB

export async function POST(req: Request) {
  const contentLength = req.headers.get('content-length')
  if (contentLength && parseInt(contentLength) > MAX_UPLOAD_SIZE) {
    return NextResponse.json({ error: 'File too large. Maximum size is 10MB.' }, { status: 413 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const dryRun = formData.get('dryRun') === 'true'

  if (!file) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
  }

  if (!file.name.endsWith('.zip')) {
    return NextResponse.json({ error: 'File must be a ZIP archive' }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())

  if (buffer.length > MAX_UPLOAD_SIZE) {
    return NextResponse.json({ error: 'File too large. Maximum size is 10MB.' }, { status: 413 })
  }

  let conversations
  try {
    conversations = parseZipBuffer(buffer)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to parse ZIP file' },
      { status: 400 }
    )
  }

  let mostRecent
  try {
    mostRecent = getMostRecentConversation(conversations)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to find most recent conversation' },
      { status: 400 }
    )
  }

  const preview = buildPreview(mostRecent)

  if (dryRun) {
    return NextResponse.json({
      dryRun: true,
      preview: {
        title: preview.title,
        messageCount: preview.messageCount,
        updatedAt: preview.updatedAt,
        firstMessages: preview.messages.slice(0, 3).map((m) => ({
          role: m.role,
          content: m.content.slice(0, 200),
        })),
      },
    })
  }

  // Actually import
  const messages = extractMessages(mostRecent)

  const thread = await prisma.thread.create({
    data: {
      title: preview.title,
      source: 'chatgpt_import',
      updatedAt: preview.updatedAt,
      messages: {
        create: messages.map((m) => ({
          role: m.role,
          content: m.content,
          createdAt: m.createdAt,
        })),
      },
    },
  })

  return NextResponse.json({ threadId: thread.id, title: thread.title, messageCount: messages.length }, { status: 201 })
}
