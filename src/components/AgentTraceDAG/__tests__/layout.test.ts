import { describe, it, expect } from 'vitest'
import { computeDagreLayout, getBezierPath } from '../layout'

describe('computeDagreLayout', () => {
  it('should assign valid positions for simple nodes', () => {
    const nodes = [
      { id: '1', type: 'step', position: { x: 0, y: 0 } },
      { id: '2', type: 'step', position: { x: 0, y: 0 } }
    ]
    const edges = [
      { source: '1', target: '2' }
    ]
    const positioned = computeDagreLayout(nodes, edges)

    expect(positioned).toHaveLength(2)
    const n1 = positioned.find(n => n.id === '1')
    const n2 = positioned.find(n => n.id === '2')

    expect(n1?.position.x).toBeDefined()
    expect(n1?.position.y).toBeDefined()
    expect(n2?.position.x).toBeDefined()
    expect(n2?.position.y).toBeDefined()
    
    // 自上而下排列中，下游节点 2 的 y 坐标应该明显大于上游节点 1
    expect(n2!.position.y).toBeGreaterThan(n1!.position.y)
  })

  it('should calculate relative coordinates for parent-child grouping nodes', () => {
    const nodes = [
      { id: 'parent-g', type: 'group', data: { collapsed: false }, position: { x: 0, y: 0 } },
      { id: 'child-s', type: 'step', parentNode: 'parent-g', position: { x: 0, y: 0 } }
    ]
    const edges: any[] = []
    const positioned = computeDagreLayout(nodes, edges)

    const parentNode = positioned.find(n => n.id === 'parent-g')
    const childNode = positioned.find(n => n.id === 'child-s')

    expect(parentNode?.style?.width).toBeDefined()
    expect(parentNode?.style?.height).toBeDefined()

    expect(childNode?.position.x).toBeDefined()
    expect(childNode?.position.y).toBeDefined()
  })

  it('should hide children nodes when group collapsed', () => {
    const nodes = [
      { id: 'parent-g', type: 'group', data: { collapsed: true }, position: { x: 0, y: 0 } },
      { id: 'child-s', type: 'step', parentNode: 'parent-g', hidden: true, position: { x: 0, y: 0 } }
    ]
    const edges: any[] = []
    const positioned = computeDagreLayout(nodes, edges)

    const parentNode = positioned.find(n => n.id === 'parent-g')
    const childNode = positioned.find(n => n.id === 'child-s')

    // 折叠状态下，由于子节点 hidden 为 true 且不加入 Dagre，所以子节点保持 hidden，父节点会具有固定的缩小尺寸
    expect(parentNode?.style?.width).toBe('180px')
    expect(parentNode?.style?.height).toBe('40px')
    expect(childNode?.position.x).toBe(0) // 不变
  })
})

describe('getBezierPath', () => {
  it('should generate a correct cubic Bezier curve path string', () => {
    const x1 = 0, y1 = 0, x2 = 100, y2 = 50
    const path = getBezierPath(x1, y1, x2, y2)
    expect(path).toBe('M 0 0 C 50 0, 50 50, 100 50')
  })
})
