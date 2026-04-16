import AdmZip from 'adm-zip'

export interface ChatGPTMessage {
  id: string
  author: { role: string }
  content: { content_type: string; parts: string[] }
  create_time: number | null
  update_time: number | null
}

export interface ChatGPTConversation {
  id: string
  title: string
  create_time: number
  update_time: number
  mapping: Record<string, { message: ChatGPTMessage | null; parent: string | null; children: string[] }>
}

export interface ParsedMessage {
  role: string
  content: string
  createdAt: Date
}

export interface ImportPreview {
  conversationId: string
  title: string
  messageCount: number
  updatedAt: Date
  messages: ParsedMessage[]
}

export function parseZipBuffer(buffer: Buffer): ChatGPTConversation[] {
  const zip = new AdmZip(buffer)
  const entry = zip.getEntry('conversations.json')
  if (!entry) {
    throw new Error('conversations.json not found in the ZIP file')
  }
  const content = entry.getData().toString('utf-8')
  const data = JSON.parse(content)
  if (!Array.isArray(data)) {
    throw new Error('conversations.json must be a JSON array')
  }
  return data as ChatGPTConversation[]
}

export function getMostRecentConversation(conversations: ChatGPTConversation[]): ChatGPTConversation {
  if (conversations.length === 0) {
    throw new Error('No conversations found in export')
  }
  return conversations.reduce((a, b) => (a.update_time > b.update_time ? a : b))
}

export function extractMessages(conversation: ChatGPTConversation): ParsedMessage[] {
  const mapping = conversation.mapping
  const messages: ParsedMessage[] = []

  // Traverse tree in order using parent-child relationships
  const roots = Object.values(mapping).filter((n) => !n.parent || !mapping[n.parent])

  function traverse(nodeId: string) {
    const node = mapping[nodeId]
    if (!node) return
    const msg = node.message
    if (
      msg &&
      msg.author &&
      ['user', 'assistant', 'system'].includes(msg.author.role) &&
      msg.content?.content_type === 'text' &&
      msg.content?.parts?.length > 0
    ) {
      const textContent = msg.content.parts.filter((p) => typeof p === 'string').join('')
      if (textContent.trim()) {
        messages.push({
          role: msg.author.role,
          content: textContent,
          createdAt: msg.create_time ? new Date(msg.create_time * 1000) : new Date(),
        })
      }
    }
    for (const childId of node.children || []) {
      traverse(childId)
    }
  }

  for (const node of roots) {
    const nodeId = Object.keys(mapping).find((k) => mapping[k] === node)
    if (nodeId) traverse(nodeId)
  }

  return messages
}

export function buildPreview(conversation: ChatGPTConversation): ImportPreview {
  const messages = extractMessages(conversation)
  return {
    conversationId: conversation.id,
    title: conversation.title || 'Imported ChatGPT Conversation',
    messageCount: messages.length,
    updatedAt: new Date(conversation.update_time * 1000),
    messages,
  }
}
