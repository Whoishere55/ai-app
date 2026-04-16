import { getMostRecentConversation, extractMessages, buildPreview, parseZipBuffer } from '../lib/chatgpt-importer'
import AdmZip from 'adm-zip'

const mockConversations = [
  {
    id: 'conv1',
    title: 'Old conversation',
    create_time: 1000000,
    update_time: 1000000,
    mapping: {
      'node1': {
        message: {
          id: 'msg1',
          author: { role: 'user' },
          content: { content_type: 'text', parts: ['Hello world'] },
          create_time: 1000000,
          update_time: null,
        },
        parent: null,
        children: [],
      },
    },
  },
  {
    id: 'conv2',
    title: 'Recent conversation',
    create_time: 2000000,
    update_time: 2000000,
    mapping: {
      'node2': {
        message: {
          id: 'msg2',
          author: { role: 'user' },
          content: { content_type: 'text', parts: ['Hi there'] },
          create_time: 2000000,
          update_time: null,
        },
        parent: null,
        children: ['node3'],
      },
      'node3': {
        message: {
          id: 'msg3',
          author: { role: 'assistant' },
          content: { content_type: 'text', parts: ['Hello! How can I help?'] },
          create_time: 2000001,
          update_time: null,
        },
        parent: 'node2',
        children: [],
      },
    },
  },
]

describe('getMostRecentConversation', () => {
  it('returns the conversation with the highest update_time', () => {
    const result = getMostRecentConversation(mockConversations as any)
    expect(result.id).toBe('conv2')
  })

  it('throws when given an empty array', () => {
    expect(() => getMostRecentConversation([])).toThrow('No conversations found')
  })
})

describe('extractMessages', () => {
  it('extracts messages in order with correct roles', () => {
    const msgs = extractMessages(mockConversations[1] as any)
    expect(msgs).toHaveLength(2)
    expect(msgs[0].role).toBe('user')
    expect(msgs[0].content).toBe('Hi there')
    expect(msgs[1].role).toBe('assistant')
    expect(msgs[1].content).toBe('Hello! How can I help?')
  })

  it('skips empty messages', () => {
    const conv = {
      ...mockConversations[0],
      mapping: {
        empty: {
          message: {
            id: 'empty',
            author: { role: 'user' },
            content: { content_type: 'text', parts: [''] },
            create_time: null,
            update_time: null,
          },
          parent: null,
          children: [],
        },
      },
    }
    const msgs = extractMessages(conv as any)
    expect(msgs).toHaveLength(0)
  })
})

describe('buildPreview', () => {
  it('builds a preview with correct messageCount and title', () => {
    const preview = buildPreview(mockConversations[1] as any)
    expect(preview.title).toBe('Recent conversation')
    expect(preview.messageCount).toBe(2)
    expect(preview.conversationId).toBe('conv2')
  })
})

describe('parseZipBuffer', () => {
  it('extracts conversations.json from a ZIP buffer', () => {
    const zip = new AdmZip()
    zip.addFile('conversations.json', Buffer.from(JSON.stringify(mockConversations)))
    const buffer = zip.toBuffer()
    const result = parseZipBuffer(buffer)
    expect(result).toHaveLength(2)
    expect(result[0].id).toBe('conv1')
  })

  it('throws if conversations.json is missing', () => {
    const zip = new AdmZip()
    zip.addFile('other.json', Buffer.from('{}'))
    const buffer = zip.toBuffer()
    expect(() => parseZipBuffer(buffer)).toThrow('conversations.json not found')
  })

  it('throws if conversations.json is not an array', () => {
    const zip = new AdmZip()
    zip.addFile('conversations.json', Buffer.from('{"not": "an array"}'))
    const buffer = zip.toBuffer()
    expect(() => parseZipBuffer(buffer)).toThrow('must be a JSON array')
  })
})
