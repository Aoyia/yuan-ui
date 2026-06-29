import type { AgentTraceEvent, AgentTraceNode, ToolTraceNode, GroupTraceNode } from './types'

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

// 渐进式收缩：把指定 parentId 下的、已完成的同级 Group 设为折叠状态
function collapseFinishedSiblings(nodes: AgentTraceNode[], parentId: string | undefined, activeId: string): AgentTraceNode[] {
  return nodes.map((node) => {
    if (node.kind === 'group' && node.parentId === parentId && node.id !== activeId) {
      if (node.status === 'complete' || node.status === 'error' || node.status === 'cancelled') {
        return { ...node, isCollapsed: true }
      }
    }
    return node
  })
}

// 展开链条：确保当前活跃节点的所有祖先 Group 均处于展开状态，不被隐藏
function expandAncestors(nodes: AgentTraceNode[], parentId: string | undefined): AgentTraceNode[] {
  if (!parentId) return nodes
  let currentParentId: string | undefined = parentId
  let nextNodes = [...nodes]
  
  // 防止循环引用限制最多往上找 10 层
  let depth = 0
  while (currentParentId && depth < 10) {
    const pId: string = currentParentId // 建立局部 const 变量以解决闭包类型收窄问题
    const parentNode = nextNodes.find(n => n.id === pId)
    if (parentNode && parentNode.kind === 'group') {
      nextNodes = nextNodes.map(n => 
        n.id === pId && n.kind === 'group' 
          ? { ...n, isCollapsed: false } 
          : n
      )
      currentParentId = parentNode.parentId
      depth++
    } else {
      break
    }
  }
  return nextNodes
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
      // 结束后，关闭所有的 active 节点
      nodes: closeActiveNodes(state.nodes, now),
      isStreaming: false,
      duration: secondsBetween(startedAt, now),
    }
  }

  // 1. 推理节点流式 delta
  if (event.type === 'reasoning-delta') {
    const activeReasoning = state.nodes.findLast(
      node => node.kind === 'reasoning' && node.status === 'active' && node.parentId === event.parentId,
    )

    if (activeReasoning?.kind === 'reasoning') {
      return {
        ...state,
        isStreaming: true,
        startedAt,
        nodes: state.nodes.map(node =>
          node.id === activeReasoning.id && node.kind === 'reasoning'
            ? { ...node, summary: node.summary + event.delta }
            : node,
        ),
      }
    }

    const newId = event.id ?? `reasoning-${state.nodes.length + 1}`
    let nextNodes: AgentTraceNode[] = [
      ...closeActiveNodes(state.nodes, now),
      {
        id: newId,
        kind: 'reasoning',
        title: event.title ?? '分析问题',
        status: 'active',
        startedAt: now,
        summary: event.delta,
        visibility: 'summary',
        parentId: event.parentId,
      },
    ]

    nextNodes = collapseFinishedSiblings(nextNodes, event.parentId, newId)
    nextNodes = expandAncestors(nextNodes, event.parentId)

    return {
      ...state,
      isStreaming: true,
      startedAt,
      nodes: nextNodes,
    }
  }

  // 2. 工具节点开启
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
      parentId: event.parentId,
    }

    let nextNodes = [...closeActiveNodes(state.nodes, now), node]
    nextNodes = collapseFinishedSiblings(nextNodes, event.parentId, event.id)
    nextNodes = expandAncestors(nextNodes, event.parentId)

    return {
      ...state,
      isStreaming: true,
      startedAt,
      nodes: nextNodes,
    }
  }

  // 3. 工具输入 delta 流
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

  // 4. 审批事件处理
  if (event.type === 'tool-approval-request') {
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
          state: 'approval-requested',
        }
      }),
    }
  }

  if (event.type === 'tool-approval-response') {
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
          status: event.approved ? 'active' : 'complete',
          state: event.approved ? 'approval-responded' : 'output-denied',
          errorText: event.approved ? undefined : (event.reason ?? '用户拒绝执行'),
          endedAt: event.approved ? undefined : now,
          duration: event.approved ? undefined : secondsBetween(node.startedAt, now),
        }
      }),
    }
  }

  // 5. 工具输出
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

  // 6. 产物生成
  if (event.type === 'artifact') {
    let nextNodes: AgentTraceNode[] = [
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
        parentId: event.parentId,
      },
    ]

    nextNodes = collapseFinishedSiblings(nextNodes, event.parentId, event.id ?? '')
    nextNodes = expandAncestors(nextNodes, event.parentId)

    return {
      ...state,
      isStreaming: true,
      startedAt,
      nodes: nextNodes,
    }
  }

  // 7. 文本 delta 追加
  if (event.type === 'text-delta') {
    return {
      ...state,
      isStreaming: true,
      startedAt,
      content: state.content + event.delta,
    }
  }

  // 8. 新增：Group 开始
  if (event.type === 'group-start') {
    const node: GroupTraceNode = {
      id: event.id,
      kind: 'group',
      title: event.title,
      status: 'active',
      startedAt: now,
      isCollapsed: false,
      parentId: event.parentId,
    }

    let nextNodes = [...closeActiveNodes(state.nodes, now), node]
    // 渐进收缩：同级旧 complete 节点折叠
    nextNodes = collapseFinishedSiblings(nextNodes, event.parentId, event.id)
    // 展开所有祖先 Group
    nextNodes = expandAncestors(nextNodes, event.parentId)

    return {
      ...state,
      isStreaming: true,
      startedAt,
      nodes: nextNodes,
    }
  }

  // 9. 新增：Group 结束
  if (event.type === 'group-end') {
    return {
      ...state,
      isStreaming: true,
      startedAt,
      nodes: state.nodes.map((node) => {
        if (node.id !== event.id || node.kind !== 'group') {
          return node
        }

        return {
          ...node,
          status: 'complete',
          endedAt: now,
          duration: secondsBetween(node.startedAt, now),
        }
      }),
    }
  }

  // 10. 新增：手动折叠控制
  if (event.type === 'toggle-collapse') {
    return {
      ...state,
      nodes: state.nodes.map((node) => {
        if (node.id !== event.id || node.kind !== 'group') {
          return node
        }

        return {
          ...node,
          isCollapsed: event.isCollapsed !== undefined ? event.isCollapsed : !node.isCollapsed,
        }
      }),
    }
  }

  // 11. 新增：重置所有子 Group 为折叠状态
  if (event.type === 'collapse-all-groups') {
    return {
      ...state,
      nodes: state.nodes.map((node) => {
        if (node.kind !== 'group') {
          return node
        }
        return {
          ...node,
          isCollapsed: true,
        }
      }),
    }
  }

  return state
}
