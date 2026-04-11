'use client'

import { useState, useEffect } from 'react'

interface Tool {
  name: string
  description: string
}

interface Props {
  threadId: string
  onResult: (result: { toolName: string; result: string }) => void
}

export default function ToolBar({ threadId, onResult }: Props) {
  const [tools, setTools] = useState<Tool[]>([])
  const [running, setRunning] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/threads/${threadId}/tools`)
      .then((r) => r.json())
      .then(setTools)
  }, [threadId])

  const runTool = async (toolName: string) => {
    setRunning(toolName)
    try {
      const res = await fetch(`/api/threads/${threadId}/tools`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolName }),
      })
      const data = await res.json()
      if (data.error) {
        onResult({ toolName, result: `Error: ${data.error}` })
      } else {
        onResult({ toolName: data.toolName, result: data.result })
      }
    } finally {
      setRunning(null)
    }
  }

  if (tools.length === 0) return null

  return (
    <div className="flex gap-2">
      {tools.map((tool) => (
        <button
          key={tool.name}
          onClick={() => runTool(tool.name)}
          disabled={running !== null}
          title={tool.description}
          className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 disabled:opacity-50 rounded-lg transition-colors"
        >
          {running === tool.name ? '...' : tool.name === 'summarize' ? '📝 Summarize' : '✅ Action Items'}
        </button>
      ))}
    </div>
  )
}
