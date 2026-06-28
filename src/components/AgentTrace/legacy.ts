import type { AgentStepNode } from '../ChainOfThought/types'
import type { AgentTraceNode } from './types'

export function mapLegacyAgentStepNode(node: AgentStepNode): AgentTraceNode {
  if (node.type === 'tool_call' && node.toolCall) {
    return {
      id: node.id,
      kind: 'tool',
      title: node.label,
      status: node.status === 'active' ? 'active' : 'complete',
      startedAt: node.startTime,
      duration: node.duration,
      toolName: node.toolCall.name,
      state: node.toolCall.status === 'failed'
        ? 'output-error'
        : node.toolCall.status === 'complete'
          ? 'output-available'
          : 'input-available',
      input: node.toolCall.arguments,
      output: node.toolCall.output ?? node.toolCall.results,
      errorText: node.toolCall.status === 'failed' ? String(node.toolCall.output ?? '工具执行失败') : undefined,
      metadata: {
        filePath: node.toolCall.filePath,
        command: node.toolCall.command,
        results: node.toolCall.results,
      },
    }
  }

  if (node.type === 'image') {
    return {
      id: node.id,
      kind: 'artifact',
      title: node.label,
      status: 'complete',
      startedAt: node.startTime,
      duration: node.duration,
      artifactType: 'image',
      url: node.imageUrl,
      caption: node.imageCaption,
    }
  }

  return {
    id: node.id,
    kind: 'reasoning',
    title: node.label,
    status: node.status,
    startedAt: node.startTime,
    duration: node.duration,
    summary: node.content,
    visibility: 'summary',
  }
}
