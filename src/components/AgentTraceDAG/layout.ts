import type { DAGNode, DAGEdge } from './types'

export function computeBFSLayout(nodes: DAGNode[]): Array<{ level: number; nodes: DAGNode[] }> {
  if (nodes.length === 0) return []

  const normalizedNodes = nodes.map(node => ({
    ...node,
    parentIds: node.parentIds || (node.parentId ? [node.parentId] : [])
  }))

  const computedEdges: DAGEdge[] = []
  normalizedNodes.forEach(node => {
    if (node.parentIds && node.parentIds.length > 0) {
      node.parentIds.forEach(pId => {
        computedEdges.push({
          source: pId,
          target: node.id,
          status: node.status
        })
      })
    }
  })

  const nodeMap = new Map<string, typeof normalizedNodes[0]>()
  const childMap = new Map<string, string[]>()
  const inDegree = new Map<string, number>()
  
  normalizedNodes.forEach(node => {
    nodeMap.set(node.id, node)
    childMap.set(node.id, [])
    inDegree.set(node.id, 0)
  })

  computedEdges.forEach(edge => {
    const parentIds = childMap.get(edge.source) || []
    parentIds.push(edge.target)
    childMap.set(edge.source, parentIds)

    const deg = inDegree.get(edge.target) || 0
    inDegree.set(edge.target, deg + 1)
  })

  const nodeLevels = new Map<string, number>()
  const queue: string[] = []

  normalizedNodes.forEach(node => {
    const deg = inDegree.get(node.id) || 0
    if (deg === 0 || (!node.parentIds || node.parentIds.length === 0)) {
      nodeLevels.set(node.id, 0)
      queue.push(node.id)
    }
  })

  while (queue.length > 0) {
    const currId = queue.shift()!
    const currLevel = nodeLevels.get(currId) || 0
    const children = childMap.get(currId) || []

    children.forEach(childId => {
      const childLevel = nodeLevels.get(childId) || 0
      const targetLevel = Math.max(childLevel, currLevel + 1)
      nodeLevels.set(childId, targetLevel)
      
      if (!queue.includes(childId)) {
        queue.push(childId)
      }
    })
  }

  const maxLevel = Math.max(0, ...Array.from(nodeLevels.values()))
  const resultCols: Array<{ level: number; nodes: DAGNode[] }> = []

  for (let i = 0; i <= maxLevel; i++) {
    resultCols.push({ level: i, nodes: [] })
  }

  nodes.forEach(node => {
    const level = nodeLevels.get(node.id) ?? 0
    if (level < resultCols.length) {
      resultCols[level].nodes.push(node)
    } else {
      resultCols[0].nodes.push(node)
    }
  })

  return resultCols.filter(col => col.nodes.length > 0)
}

export function getBezierPath(x1: number, y1: number, x2: number, y2: number): string {
  const dx = Math.abs(x2 - x1) * 0.5
  return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`
}
