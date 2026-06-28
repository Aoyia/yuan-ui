import type { AgentTraceEvent, AgentTraceNode, ToolTraceNode } from './types'

export interface AgentTraceState {
  nodes: AgentTraceNode[]
  content: string
  isStreaming: boolean
  duration?: number
  startedAt?: number
}

export function createAgentTraceState(): AgentTraceState {
  return {
    nodes: [],
    content: '',
    isStreaming: false,
  }
}

function secondsBetween(startedAt: number, endedAt: number) {
  return Math.ceil((endedAt - startedAt) / 1000)
}

function closeActiveNodes(nodes: AgentTraceNode[], now: number): AgentTraceNode[] {
  return nodes.map((node) => {
    if (node.status !== 'active') {
      return node
    }

    return {
      ...node,
      status: 'complete',
      endedAt: now,
      duration: secondsBetween(node.startedAt, now),
    }
  })
}

export function reduceAgentTraceEvent(
  state: AgentTraceState,
  event: AgentTraceEvent,
  now = Date.now(),
): AgentTraceState {
  if (event.type === 'reset') {
    return createAgentTraceState()
  }

  const startedAt = state.startedAt ?? now

  if (event.type === 'finish') {
    return {
      ...state,
      nodes: closeActiveNodes(state.nodes, now),
      isStreaming: false,
      duration: secondsBetween(startedAt, now),
    }
  }

  if (event.type === 'reasoning-delta') {
    const activeReasoning = state.nodes.findLast(
      node => node.kind === 'reasoning' && node.status === 'active',
    )

    if (activeReasoning?.kind === 'reasoning') {
      return {
        ...state,
        isStreaming: true,
        startedAt,
        nodes: state.nodes.map(node =>
          node.id === activeReasoning.id
            ? { ...node, summary: node.summary + event.delta }
            : node,
        ),
      }
    }

    return {
      ...state,
      isStreaming: true,
      startedAt,
      nodes: [
        ...state.nodes,
        {
          id: event.id ?? `reasoning-${state.nodes.length + 1}`,
          kind: 'reasoning',
          title: event.title ?? '分析问题',
          status: 'active',
          startedAt: now,
          summary: event.delta,
          visibility: 'summary',
        },
      ],
    }
  }

  if (event.type === 'tool-input-start') {
    const node: ToolTraceNode = {
      id: event.id,
      kind: 'tool',
      title: event.title ?? event.toolName,
      status: 'active',
      startedAt: now,
      toolName: event.toolName,
      state: event.input === undefined ? 'input-streaming' : 'input-available',
      input: event.input,
    }

    return {
      ...state,
      isStreaming: true,
      startedAt,
      nodes: [...closeActiveNodes(state.nodes, now), node],
    }
  }

  if (event.type === 'tool-input-delta') {
    return {
      ...state,
      isStreaming: true,
      startedAt,
      nodes: state.nodes.map((node) => {
        if (node.id !== event.id || node.kind !== 'tool') {
          return node
        }

        const currentInput = node.input ?? ''
        let nextInput: unknown
        if (typeof currentInput === 'string' && typeof event.inputDelta === 'string') {
          nextInput = currentInput + event.inputDelta
        } else {
          nextInput = event.inputDelta
        }

        return {
          ...node,
          state: 'input-streaming',
          input: nextInput,
        }
      }),
    }
  }

  if (event.type === 'tool-output') {
    return {
      ...state,
      isStreaming: true,
      startedAt,
      nodes: state.nodes.map((node) => {
        if (node.id !== event.id || node.kind !== 'tool') {
          return node
        }

        return {
          ...node,
          status: event.errorText ? 'error' : 'complete',
          state: event.errorText ? 'output-error' : 'output-available',
          output: event.output,
          errorText: event.errorText,
          endedAt: now,
          duration: secondsBetween(node.startedAt, now),
        }
      }),
    }
  }

  if (event.type === 'artifact') {
    return {
      ...state,
      isStreaming: true,
      startedAt,
      nodes: [
        ...closeActiveNodes(state.nodes, now),
        {
          id: event.id ?? `artifact-${state.nodes.length + 1}`,
          kind: 'artifact',
          artifactType: event.artifactType,
          title: event.title,
          status: 'complete',
          startedAt: now,
          endedAt: now,
          duration: 0,
          url: event.url,
          caption: event.caption,
        },
      ],
    }
  }

  if (event.type === 'text-delta') {
    return {
      ...state,
      isStreaming: true,
      startedAt,
      content: state.content + event.delta,
    }
  }

  return state
}
