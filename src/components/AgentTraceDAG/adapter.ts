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
 * 基于第一性原理，根据时间执行顺序为同级节点自动推导并生成时序连线，
 * 彻底避免跨层级的父子连线，使得图的流动极其清晰且排版引擎绝不崩溃。
 */
export function transformFlatToFlowElements(flatNodes: DAGNode[]): { nodes: FlowNode[]; edges: FlowEdge[] } {
  const nodes: FlowNode[] = []
  const edges: FlowEdge[] = []

  // 1. 生成所有节点定义
  flatNodes.forEach(node => {
    const isGroup = (node.kind as any) === 'group'

    nodes.push({
      id: node.id,
      type: isGroup ? 'group' : 'step',
      data: { ...node },
      parentNode: node.parentId || undefined,
      extent: node.parentId ? 'parent' : undefined,
      position: { x: 0, y: 0 } // 由 Dagre 动态排版赋予
    })
  })

  // 2. 按 parentId 对节点进行分组分类（包括顶层）
  const parentGroups = new Map<string | undefined, DAGNode[]>()
  flatNodes.forEach(node => {
    const pId = node.parentId || undefined
    if (!parentGroups.has(pId)) {
      parentGroups.set(pId, [])
    }
    parentGroups.get(pId)!.push(node)
  })

  // 3. 在同级节点间，根据数组自然时序自动推导 Edge 连线
  parentGroups.forEach((children, pId) => {
    for (let i = 0; i < children.length; i++) {
      const curr = children[i]
      
      // 3.1 尊重显式定义的 parentIds（非父子包含的显式依赖）
      const hasExplicit = curr.parentIds && curr.parentIds.length > 0
      if (hasExplicit) {
        curr.parentIds!.forEach((explicitParentId: string) => {
          // 过滤掉直接父子关系，不和自身的容器发生边连接
          if (explicitParentId === curr.id || explicitParentId === curr.parentId) return
          
          edges.push({
            id: `${explicitParentId}-${curr.id}`,
            source: explicitParentId,
            target: curr.id,
            type: 'smoothstep',
            animated: curr.status === 'active',
            data: {
              status: curr.status || 'pending'
            }
          })
        })
      } else {
        // 3.2 没有任何显式依赖时，自动与同级组内的前一个步骤相连，实现逻辑轨迹的自然流转
        if (i > 0) {
          const prev = children[i - 1]
          
          edges.push({
            id: `${prev.id}-${curr.id}`,
            source: prev.id,
            target: curr.id,
            type: 'smoothstep',
            animated: curr.status === 'active',
            data: {
              status: curr.status || 'pending'
            }
          })
        }
      }
    }
  })

  return { nodes, edges }
}
