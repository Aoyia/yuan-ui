import dagre from 'dagre'

/**
 * 使用 Dagre 布局引擎为节点分配自上而下的垂直排列坐标。
 * 兼容 Vue Flow 嵌套分组 (Parent-Child Grouping) 并进行局部相对坐标转换。
 */
export function computeDagreLayout(nodes: any[], edges: any[], isVertical = true): any[] {
  const g = new dagre.graphlib.Graph({ compound: true })
  
  g.setGraph({
    rankdir: isVertical ? 'TB' : 'LR',
    nodesep: 50, // 节点左右行间距
    ranksep: 70, // 层与层之间的垂直间距
    multigraph: true
  })
  
  g.setDefaultEdgeLabel(() => ({}))

  // 1. 过滤并向图中塞入节点
  // 如果子节点或父节点被隐藏 (hidden === true)，则不参与排版计算
  const visibleNodes = nodes.filter(n => !n.hidden)
  const visibleNodeIds = new Set(visibleNodes.map(n => n.id))

  visibleNodes.forEach(node => {
    const isGroup = node.type === 'group'
    const collapsed = node.data?.collapsed ?? false

    // 为普通卡片与分组卡片指定排版尺寸
    let width = 220
    let height = 48

    if (isGroup) {
      if (collapsed) {
        width = 180
        height = 40
      } else {
        // 展开状态的 Group：初始较小，Dagre 会在排版后自动将其拉伸以包裹内部子节点
        width = 240
        height = 80
      }
    }

    g.setNode(node.id, { width, height })

    // 如果该节点存在父级，且父级当前也在画布可见节点集中，则声明父子关系
    if (node.parentNode && visibleNodeIds.has(node.parentNode)) {
      g.setParent(node.id, node.parentNode)
    }
  })

  // 2. 塞入边 (仅当边的起点和终点都在可见节点集中时才塞入)
  edges.forEach(edge => {
    if (visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target)) {
      g.setEdge(edge.source, edge.target)
    }
  })

  // 3. 执行布局计算
  dagre.layout(g)

  // 4. 将绝对坐标映射为 Vue Flow 的相对/局部坐标
  return nodes.map(node => {
    if (node.hidden) return node

    const nodeInfo = g.node(node.id)
    if (!nodeInfo) return node

    // 计算绝对左上角坐标
    let x = nodeInfo.x - nodeInfo.width / 2
    let y = nodeInfo.y - nodeInfo.height / 2

    // 关键步骤：如果是子节点，我们需要将其绝对坐标转为相对于 parentNode 左上角的局部相对坐标
    if (node.parentNode && visibleNodeIds.has(node.parentNode)) {
      const parentInfo = g.node(node.parentNode)
      if (parentInfo) {
        const parentLeft = parentInfo.x - parentInfo.width / 2
        const parentTop = parentInfo.y - parentInfo.height / 2
        
        x = x - parentLeft
        y = y - parentTop
      }
    }

    // 处理样式
    const style: Record<string, string> = {}
    if (node.type === 'group') {
      style.width = `${nodeInfo.width}px`
      style.height = `${nodeInfo.height}px`
    }

    return {
      ...node,
      position: { x, y },
      style: node.type === 'group' ? style : undefined
    }
  })
}

/**
 * 兜底保留老的 getBezierPath (以防其它地方直接引用)
 */
export function getBezierPath(x1: number, y1: number, x2: number, y2: number): string {
  const dx = Math.abs(x2 - x1) * 0.5
  return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`
}
