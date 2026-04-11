'use client'

import Link from 'next/link'
import { Thread } from './ChatLayout'
import { formatDistanceToNow } from 'date-fns'

interface Props {
  threads: Thread[]
  selectedThreadId: string | null
  onSelectThread: (id: string) => void
  onNewThread: () => void
  loading: boolean
}

export default function ThreadList({ threads, selectedThreadId, onSelectThread, onNewThread, loading }: Props) {
  return (
    <div className="w-64 bg-gray-800 flex flex-col border-r border-gray-700">
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <h1 className="font-bold text-lg">AI Chat</h1>
        <Link href="/import" className="text-xs text-blue-400 hover:text-blue-300">
          Import
        </Link>
      </div>
      <button
        onClick={onNewThread}
        className="m-3 py-2 px-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors"
      >
        + New Chat
      </button>
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-gray-400 text-sm">Loading...</div>
        ) : threads.length === 0 ? (
          <div className="p-4 text-gray-400 text-sm">No conversations yet.</div>
        ) : (
          threads.map((thread) => (
            <button
              key={thread.id}
              onClick={() => onSelectThread(thread.id)}
              className={`w-full text-left px-4 py-3 hover:bg-gray-700 transition-colors border-b border-gray-700/50 ${
                selectedThreadId === thread.id ? 'bg-gray-700' : ''
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium truncate flex-1">{thread.title}</span>
                {thread.source === 'chatgpt_import' && (
                  <span className="text-xs bg-green-800 text-green-200 px-1 rounded shrink-0">GPT</span>
                )}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {thread._count.messages} messages ·{' '}
                {formatDistanceToNow(new Date(thread.updatedAt), { addSuffix: true })}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
