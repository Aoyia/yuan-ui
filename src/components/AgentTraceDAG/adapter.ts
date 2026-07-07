import type { DAGNode } from './types'

export interface FlowNode {
  id: string
  type: 'group' | 'step'
  data: any
  parentNode?: string
  extent?: 'parent'
  position: { x: number; y: number }
  style?: Record<string, string>
  hidden?: boolean
}

export interface FlowEdge {
  id: string
  source: string
  target: string
  type: string
  animated: boolean
  data: {
    status: string
  }
  hidden?: boolean
}

/**
 * 将扁平的 DAGNode[] 转换为 Vue Flow 的 Nodes 和 Edges。
 */
export function transformFlatToFlowElements(flatNodes: DAGNode[]): { nodes: FlowNode[]; edges: FlowEdge[] } {
  const nodes: FlowNode[] = []
  const edges: FlowEdge[] = []

  // 1. 生成所有节点
  flatNodes.forEach(node => {
    // 判定是否是分组节点：如果有 childrenIds 列表，或者 kind 是特定的 reasoning 而作为容器等
    // 这里我们检查 childrenIds 是否包含元素，或者 node.kind === 'reasoning' 且被当做 parent 时。
    // 最稳妥的是检查 node.childrenIds && node.childrenIds.length > 0。
    const isGroup = node.kind === 'group'

    nodes.push({
      id: node.id,
      type: isGroup ? 'group' : 'step',
      data: { ...node },
      parentNode: node.parentId || undefined,
      extent: node.parentId ? 'parent' : undefined,
      position: { x: 0, y: 0 } // 由布局引擎最终重算
    })

    // 2. 根据 parentIds / parentId 创建 Edges
    const parentIds = node.parentIds || (node.parentId ? [node.parentId] : [])
    parentIds.forEach(pId => {
      // 避免自环
      if (pId === node.id) return

      edges.push({
        id: `${pId}-${node.id}`,
        source: pId,
        target: node.id,
        type: 'smoothstep',
        animated: node.status === 'active',
        data: {
          status: node.status || 'pending'
        }
      })
    })
  })

  return { nodes, edges }
}
