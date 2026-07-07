import { ref, onMounted, onBeforeUnmount, nextTick, watch, type Ref, type ComputedRef } from 'vue'
import type { DAGNode, DAGEdge, DAGTraceStatus } from './types'

export interface UseDAGLayoutOptions {
  containerRef: Ref<HTMLElement | null>
  nodeElements: Ref<Record<string, HTMLElement>>
  nodes: Ref<DAGNode[]> | ComputedRef<DAGNode[]> | Ref<readonly DAGNode[]> | ComputedRef<readonly DAGNode[]>
}

export function useDAGLayout(options: UseDAGLayoutOptions) {
  const links = ref<Array<{
    id: string
    x1: number
    y1: number
    x2: number
    y2: number
    status: DAGTraceStatus
  }>>([])

  // 辅助函数：根据当前节点，派生边关联信息
  const getComputedEdges = (nodes: readonly DAGNode[]): DAGEdge[] => {
    const result: DAGEdge[] = []
    nodes.forEach(node => {
      const parentIds = node.parentIds || (node.parentId ? [node.parentId] : [])
      if (parentIds.length > 0) {
        parentIds.forEach(pId => {
          result.push({
            source: pId,
            target: node.id,
            status: node.status
          })
        })
      }
    })
    return result
  }

  const updateLinks = () => {
    const containerEl = options.containerRef.value
    if (!containerEl) return
    
    const containerRect = containerEl.getBoundingClientRect()
    const computedLinks: typeof links.value = []
    const edges = getComputedEdges(options.nodes.value)

    edges.forEach(edge => {
      const parentEl = options.nodeElements.value[edge.source]
      const childEl = options.nodeElements.value[edge.target]

      if (parentEl && childEl) {
        const parentRect = parentEl.getBoundingClientRect()
        const childRect = childEl.getBoundingClientRect()

        const x1 = parentRect.right - containerRect.left
        const y1 = parentRect.top - containerRect.top + parentRect.height / 2

        const x2 = childRect.left - containerRect.left
        const y2 = childRect.top - containerRect.top + childRect.height / 2

        const edgeStatus = edge.status || 'complete'

        computedLinks.push({
          id: `${edge.source}-${edge.target}`,
          x1,
          y1,
          x2,
          y2,
          status: edgeStatus
        })
      }
    })

    links.value = computedLinks
  }

  let resizeObserver: ResizeObserver | null = null

  onMounted(() => {
    if (window.ResizeObserver && options.containerRef.value) {
      resizeObserver = new ResizeObserver(() => {
        updateLinks()
      })
      resizeObserver.observe(options.containerRef.value)
    } else {
      updateLinks()
    }
  })

  watch(() => options.nodes.value, () => {
    nextTick(() => {
      updateLinks()
    })
  })

  onBeforeUnmount(() => {
    if (resizeObserver) {
      resizeObserver.disconnect()
    }
  })

  return {
    links,
    updateLinks
  }
}

