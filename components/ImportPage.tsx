'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Preview {
  title: string
  messageCount: number
  updatedAt: string
  firstMessages: Array<{ role: string; content: string }>
}

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<Preview | null>(null)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState<{ threadId: string; title: string; messageCount: number } | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null
    setFile(f)
    setPreview(null)
    setError('')
    setSuccess(null)
  }

  const runPreview = async () => {
    if (!file) return
    setError('')
    setImporting(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('dryRun', 'true')
      const res = await fetch('/api/import', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Preview failed')
      } else {
        setPreview(data.preview)
      }
    } finally {
      setImporting(false)
    }
  }

  const confirmImport = async () => {
    if (!file) return
    setError('')
    setImporting(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('dryRun', 'false')
      const res = await fetch('/api/import', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Import failed')
      } else {
        setSuccess(data)
        setPreview(null)
        setFile(null)
      }
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/" className="text-gray-400 hover:text-white text-sm">
            ← Back to Chat
          </Link>
          <h1 className="text-2xl font-bold">Import ChatGPT Conversation</h1>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 mb-6">
          <h2 className="font-semibold mb-3">How to get your ChatGPT export</h2>
          <ol className="text-sm text-gray-300 space-y-2 list-decimal list-inside">
            <li>Go to ChatGPT → Settings → Data Controls</li>
            <li>Click &quot;Export data&quot; and confirm</li>
            <li>Wait for the email from OpenAI (usually a few minutes)</li>
            <li>Download the ZIP file from the email link</li>
            <li>Upload it here — we only import your most recent conversation</li>
          </ol>
        </div>

        {success ? (
          <div className="bg-green-900 border border-green-600 rounded-xl p-6">
            <h2 className="font-semibold text-green-300 mb-2">Import Successful!</h2>
            <p className="text-sm text-gray-300">
              Imported &quot;<strong>{success.title}</strong>&quot; with {success.messageCount} messages.
            </p>
            <Link
              href="/"
              className="mt-4 inline-block px-4 py-2 bg-green-700 hover:bg-green-600 rounded-lg text-sm font-medium transition-colors"
            >
              Go to Chat →
            </Link>
          </div>
        ) : (
          <>
            <div className="bg-gray-800 rounded-xl p-6 mb-4">
              <label className="block text-sm font-medium mb-3">Upload your ChatGPT export ZIP</label>
              <input
                type="file"
                accept=".zip"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-700 file:text-white hover:file:bg-gray-600 cursor-pointer"
              />
              {file && (
                <p className="text-xs text-gray-400 mt-2">
                  Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>

            {error && (
              <div className="bg-red-900 border border-red-600 rounded-xl p-4 mb-4 text-sm text-red-300">
                {error}
              </div>
            )}

            {!preview && (
              <button
                onClick={runPreview}
                disabled={!file || importing}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-xl font-medium transition-colors"
              >
                {importing ? 'Analyzing...' : 'Preview Import'}
              </button>
            )}

            {preview && (
              <div className="bg-gray-800 rounded-xl p-6 mb-4">
                <h2 className="font-semibold mb-3 text-green-400">Preview: Most Recent Conversation</h2>
                <div className="space-y-2 text-sm mb-4">
                  <div>
                    <span className="text-gray-400">Title:</span>{' '}
                    <span className="font-medium">{preview.title}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Messages:</span>{' '}
                    <span className="font-medium">{preview.messageCount}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Last updated:</span>{' '}
                    <span className="font-medium">{new Date(preview.updatedAt).toLocaleString()}</span>
                  </div>
                </div>

                {preview.firstMessages.length > 0 && (
                  <div className="border-t border-gray-700 pt-4 mt-4">
                    <p className="text-xs text-gray-400 mb-3">First {preview.firstMessages.length} messages:</p>
                    <div className="space-y-2">
                      {preview.firstMessages.map((m, i) => (
                        <div key={i} className="text-sm">
                          <span className="text-blue-400 font-medium capitalize">{m.role}:</span>{' '}
                          <span className="text-gray-300">{m.content}{m.content.length >= 200 ? '...' : ''}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={confirmImport}
                    disabled={importing}
                    className="flex-1 py-2 bg-green-700 hover:bg-green-600 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
                  >
                    {importing ? 'Importing...' : 'Confirm Import'}
                  </button>
                  <button
                    onClick={() => setPreview(null)}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
