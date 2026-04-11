import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const threads = await prisma.thread.findMany({
    orderBy: { updatedAt: 'desc' },
    include: { _count: { select: { messages: true } } },
  })
  return NextResponse.json(threads)
}

export async function POST(req: Request) {
  const { title } = await req.json()
  const thread = await prisma.thread.create({
    data: { title: title || 'New Chat' },
  })
  return NextResponse.json(thread, { status: 201 })
}
