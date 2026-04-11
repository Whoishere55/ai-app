import { Tool, ToolContext, ToolResult } from './registry'
import { getOpenAIClient } from '../openai'

export const summarizeTool: Tool = {
  name: 'summarize',
  description: 'Summarize the current conversation thread',
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
          content: 'You are a helpful assistant. Summarize the following conversation concisely.',
        },
        {
          role: 'user',
          content: conversationText,
        },
      ],
    })

    return {
      toolName: 'summarize',
      result: response.choices[0]?.message?.content || 'No summary generated',
    }
  },
}
