'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import ToolBar from './ToolBar'

interface Message {
  id: string
  role: string
  content: string
  createdAt: string
}

interface Props {
  threadId: string
  onMessageSent: () => void
}

export default function ChatPanel({ threadId, onMessageSent }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [toolResult, setToolResult] = useState<{ toolName: string; result: string } | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const fetchMessages = useCallback(async () => {
    const res = await fetch(`/api/threads/${threadId}/messages`)
    const data = await res.json()
    setMessages(data)
  }, [threadId])

  useEffect(() => {
    setToolResult(null)
    fetchMessages()
  }, [threadId, fetchMessages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || sending) return
    const content = input.trim()
    setInput('')
    setSending(true)
    setToolResult(null)
    try {
      await fetch(`/api/threads/${threadId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      await fetchMessages()
      onMessageSent()
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-gray-800">
        <span className="text-sm text-gray-400">Thread</span>
        <ToolBar threadId={threadId} onResult={setToolResult} />
      </div>

      {toolResult && (
        <div className="mx-4 mt-3 p-3 bg-gray-800 border border-gray-600 rounded-lg text-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="font-medium text-blue-400 capitalize">{toolResult.toolName}</span>
            <button onClick={() => setToolResult(null)} className="text-gray-500 hover:text-gray-300 text-xs">
              ✕
            </button>
          </div>
          <p className="text-gray-300 whitespace-pre-wrap">{toolResult.result}</p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-10">No messages yet. Start the conversation!</div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-sm'
                  : msg.role === 'assistant'
                  ? 'bg-gray-700 text-gray-100 rounded-bl-sm'
                  : 'bg-yellow-900 text-yellow-100'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="bg-gray-700 rounded-2xl rounded-bl-sm px-4 py-3 text-sm text-gray-400">
              Thinking...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-4 border-t border-gray-700 bg-gray-800">
        <div className="flex gap-3 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message AI... (Enter to send, Shift+Enter for newline)"
            rows={1}
            className="flex-1 bg-gray-700 text-white rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
            style={{ maxHeight: '120px' }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || sending}
            className="px-4 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-xl text-sm font-medium transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
