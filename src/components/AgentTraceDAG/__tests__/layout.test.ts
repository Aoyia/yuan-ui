import { describe, it, expect } from 'vitest'
import { computeBFSLayout, getBezierPath } from '../layout'
import type { DAGNode } from '../types'

describe('computeBFSLayout', () => {
  it('should layer independent nodes to level 0', () => {
    const nodes: any[] = [
      { id: '1', kind: 'reasoning', title: 'Node 1', status: 'complete' },
      { id: '2', kind: 'tool', title: 'Node 2', status: 'complete' }
    ]
    const result = computeBFSLayout(nodes)
    expect(result).toHaveLength(1)
    expect(result[0].level).toBe(0)
    expect(result[0].nodes).toHaveLength(2)
  })

  it('should sort dependent nodes sequentially', () => {
    const nodes: any[] = [
      { id: '1', kind: 'reasoning', title: 'Node 1', status: 'complete' },
      { id: '2', kind: 'tool', title: 'Node 2', status: 'complete', parentId: '1' }
    ]
    const result = computeBFSLayout(nodes)
    expect(result).toHaveLength(2)
    expect(result[0].level).toBe(0)
    expect(result[1].level).toBe(1)
    expect(result[0].nodes[0].id).toBe('1')
    expect(result[1].nodes[0].id).toBe('2')
  })

  it('should handle multi-parent paths and calculate correct levels', () => {
    // 路径：1 -> 2 -> 4，同时 1 -> 3 -> 4
    // 4 的层级应该是 2
    const nodes: any[] = [
      { id: '1', kind: 'reasoning', title: 'Node 1', status: 'complete' },
      { id: '2', kind: 'tool', title: 'Node 2', status: 'complete', parentId: '1' },
      { id: '3', kind: 'tool', title: 'Node 3', status: 'complete', parentId: '1' },
      { id: '4', kind: 'artifact', title: 'Node 4', status: 'complete', parentIds: ['2', '3'] }
    ]
    const result = computeBFSLayout(nodes)
    expect(result).toHaveLength(3) // level 0, 1, 2
    
    const level0 = result.find(r => r.level === 0)
    const level1 = result.find(r => r.level === 1)
    const level2 = result.find(r => r.level === 2)
    
    expect(level0?.nodes.map(n => n.id)).toContain('1')
    expect(level1?.nodes.map(n => n.id)).toContain('2')
    expect(level1?.nodes.map(n => n.id)).toContain('3')
    expect(level2?.nodes.map(n => n.id)).toEqual(['4'])
  })

  it('should prevent infinite loops and handle cycles gracefully', () => {
    // 环路：1 -> 2 -> 3 -> 1
    const nodes: any[] = [
      { id: '1', kind: 'reasoning', title: 'Node 1', status: 'complete', parentId: '3' },
      { id: '2', kind: 'tool', title: 'Node 2', status: 'complete', parentId: '1' },
      { id: '3', kind: 'tool', title: 'Node 3', status: 'complete', parentId: '2' }
    ]
    
    // 如果没有死循环保护，这行会由于 OOM 卡死
    const result = computeBFSLayout(nodes)
    // 尽管有环，算法应优雅终止并返回分类结果
    expect(result.length).toBeGreaterThan(0)
  })
})

describe('getBezierPath', () => {
  it('should generate a correct cubic Bezier curve path string', () => {
    const x1 = 0, y1 = 0, x2 = 100, y2 = 50
    const path = getBezierPath(x1, y1, x2, y2)
    expect(path).toBe('M 0 0 C 50 0, 50 50, 100 50')
  })
})


