import { toolRegistry } from './registry'
import { summarizeTool } from './summarize'
import { extractActionItemsTool } from './extractActionItems'

toolRegistry.register(summarizeTool)
toolRegistry.register(extractActionItemsTool)

export { toolRegistry }
