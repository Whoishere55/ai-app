import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import '@/lib/tools/index'
import { toolRegistry } from '@/lib/tools/registry'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { toolName } = await req.json()
  if (!toolName) {
    return NextResponse.json({ error: 'toolName is required' }, { status: 400 })
  }

  const messages = await prisma.message.findMany({
    where: { threadId: id },
    orderBy: { createdAt: 'asc' },
  })

  const result = await toolRegistry.run(toolName, {
    threadId: id,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  })

  return NextResponse.json(result)
}

export async function GET() {
  // Ensure tools are registered
  await import('@/lib/tools/index')
  const tools = toolRegistry.list().map((t) => ({ name: t.name, description: t.description }))
  return NextResponse.json(tools)
}
