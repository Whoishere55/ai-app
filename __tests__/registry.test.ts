import { ToolRegistry, ToolContext } from '../lib/tools/registry'

describe('ToolRegistry', () => {
  let registry: ToolRegistry

  beforeEach(() => {
    registry = new ToolRegistry()
  })

  it('registers and retrieves a tool', () => {
    const tool = {
      name: 'test',
      description: 'A test tool',
      handler: async (ctx: ToolContext) => ({ toolName: 'test', result: 'ok' }),
    }
    registry.register(tool)
    expect(registry.get('test')).toBe(tool)
  })

  it('lists all registered tools', () => {
    registry.register({ name: 'a', description: 'tool a', handler: async () => ({ toolName: 'a', result: '' }) })
    registry.register({ name: 'b', description: 'tool b', handler: async () => ({ toolName: 'b', result: '' }) })
    expect(registry.list()).toHaveLength(2)
  })

  it('returns error result when tool not found', async () => {
    const result = await registry.run('nonexistent', { threadId: '1', messages: [] })
    expect(result.error).toMatch(/not found/)
  })

  it('runs a tool and returns result', async () => {
    registry.register({
      name: 'echo',
      description: 'Echoes context',
      handler: async (ctx: ToolContext) => ({ toolName: 'echo', result: ctx.threadId }),
    })
    const result = await registry.run('echo', { threadId: 'my-thread', messages: [] })
    expect(result.result).toBe('my-thread')
    expect(result.error).toBeUndefined()
  })

  it('catches handler errors gracefully', async () => {
    registry.register({
      name: 'broken',
      description: 'Throws',
      handler: async () => { throw new Error('boom') },
    })
    const result = await registry.run('broken', { threadId: '1', messages: [] })
    expect(result.error).toBe('boom')
  })
})
