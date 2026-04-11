'use client'

import { useState, useEffect } from 'react'
import ThreadList from './ThreadList'
import ChatPanel from './ChatPanel'

export interface Thread {
  id: string
  title: string
  updatedAt: string
  source: string
  _count: { messages: number }
}

export default function ChatLayout() {
  const [threads, setThreads] = useState<Thread[]>([])
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchThreads = async () => {
    try {
      const res = await fetch('/api/threads')
      const data = await res.json()
      setThreads(data)
      if (data.length > 0 && !selectedThreadId) {
        setSelectedThreadId(data[0].id)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchThreads()
  }, [])

  const createThread = async () => {
    const res = await fetch('/api/threads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'New Chat' }),
    })
    const thread = await res.json()
    setThreads((prev) => [thread, ...prev])
    setSelectedThreadId(thread.id)
  }

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      <ThreadList
        threads={threads}
        selectedThreadId={selectedThreadId}
        onSelectThread={setSelectedThreadId}
        onNewThread={createThread}
        loading={loading}
      />
      <div className="flex-1">
        {selectedThreadId ? (
          <ChatPanel threadId={selectedThreadId} onMessageSent={fetchThreads} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <p className="text-xl mb-4">Welcome to AI Chat</p>
              <p className="text-sm">Select a thread or create a new one to start chatting.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
