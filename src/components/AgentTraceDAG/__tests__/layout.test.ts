import { describe, it, expect } from 'vitest'
import { computeBFSLayout, getBezierPath } from '../layout'
import type { DAGNode } from '../types'

describe('computeBFSLayout', () => {
  it('should layer independent nodes to level 0', () => {
    const nodes: DAGNode[] = [
      { id: '1', kind: 'reasoning', title: 'Node 1', status: 'complete' },
      { id: '2', kind: 'tool', title: 'Node 2', status: 'complete' }
    ]
    const result = computeBFSLayout(nodes)
    expect(result).toHaveLength(1)
    expect(result[0].level).toBe(0)
    expect(result[0].nodes).toHaveLength(2)
  })

  it('should sort dependent nodes sequentially', () => {
    const nodes: DAGNode[] = [
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
})

describe('getBezierPath', () => {
  it('should generate a correct cubic Bezier curve path string', () => {
    const x1 = 0, y1 = 0, x2 = 100, y2 = 50
    const path = getBezierPath(x1, y1, x2, y2)
    expect(path).toBe('M 0 0 C 50 0, 50 50, 100 50')
  })
})

