import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getOpenAIClient } from '@/lib/openai'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const messages = await prisma.message.findMany({
    where: { threadId: id },
    orderBy: { createdAt: 'asc' },
  })
  return NextResponse.json(messages)
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { content } = await req.json()
  if (!content?.trim()) {
    return NextResponse.json({ error: 'Content is required' }, { status: 400 })
  }

  // Save user message
  await prisma.message.create({
    data: { threadId: id, role: 'user', content },
  })

  // Get all messages for context
  const allMessages = await prisma.message.findMany({
    where: { threadId: id },
    orderBy: { createdAt: 'asc' },
  })

  // Call LLM
  const client = getOpenAIClient()
  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    messages: allMessages.map((m) => ({ role: m.role as 'user' | 'assistant' | 'system', content: m.content })),
  })

  const assistantContent = completion.choices[0]?.message?.content || ''

  // Save assistant message
  const assistantMessage = await prisma.message.create({
    data: { threadId: id, role: 'assistant', content: assistantContent },
  })

  // Update thread updatedAt
  await prisma.thread.update({
    where: { id },
    data: { updatedAt: new Date() },
  })

  return NextResponse.json(assistantMessage, { status: 201 })
}
