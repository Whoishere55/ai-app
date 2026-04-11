export interface ToolContext {
  threadId: string
  messages: Array<{ role: string; content: string }>
}

export interface ToolResult {
  toolName: string
  result: string
  error?: string
}

export type ToolHandler = (ctx: ToolContext) => Promise<ToolResult>

export interface Tool {
  name: string
  description: string
  handler: ToolHandler
}

export class ToolRegistry {
  private tools = new Map<string, Tool>()

  register(tool: Tool): void {
    this.tools.set(tool.name, tool)
  }

  get(name: string): Tool | undefined {
    return this.tools.get(name)
  }

  list(): Tool[] {
    return Array.from(this.tools.values())
  }

  async run(name: string, ctx: ToolContext): Promise<ToolResult> {
    const tool = this.tools.get(name)
    if (!tool) {
      return { toolName: name, result: '', error: `Tool "${name}" not found` }
    }
    try {
      return await tool.handler(ctx)
    } catch (err) {
      return {
        toolName: name,
        result: '',
        error: err instanceof Error ? err.message : 'Unknown error',
      }
    }
  }
}

export const toolRegistry = new ToolRegistry()
