import { Tool, ToolContext, ToolResult } from './registry'
import { getOpenAIClient } from '../openai'

export const extractActionItemsTool: Tool = {
  name: 'extractActionItems',
  description: 'Extract action items and tasks from the current conversation',
  handler: async (ctx: ToolContext): Promise<ToolResult> => {
    const client = getOpenAIClient()
    const conversationText = ctx.messages
      .map((m) => `${m.role}: ${m.content}`)
      .join('\n')

    const response = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'Extract all action items, tasks, and to-dos from the conversation. Format as a numbered list. If there are none, say "No action items found."',
        },
        {
          role: 'user',
          content: conversationText,
        },
      ],
    })

    return {
      toolName: 'extractActionItems',
      result: response.choices[0]?.message?.content || 'No action items found',
    }
  },
}
