import { describe, it, expect } from 'vitest'
import { transformFlatToFlowElements } from '../adapter'
import type { DAGNode } from '../types'

describe('transformFlatToFlowElements', () => {
  it('should transform basic nodes and edges correctly', () => {
    const flatNodes: DAGNode[] = [
      { id: 'n-1', kind: 'reasoning', title: 'Start Planning', status: 'complete' },
      { id: 'n-2', kind: 'tool', title: 'Run cmd', status: 'active', parentIds: ['n-1'] }
    ]
    const { nodes, edges } = transformFlatToFlowElements(flatNodes)

    expect(nodes).toHaveLength(2)
    expect(nodes.map(n => n.id)).toContain('n-1')
    expect(nodes.map(n => n.id)).toContain('n-2')
    expect(nodes.find(n => n.id === 'n-2')?.type).toBe('step')

    expect(edges).toHaveLength(1)
    expect(edges[0]).toEqual({
      id: 'n-1-n-2',
      source: 'n-1',
      target: 'n-2',
      type: 'smoothstep',
      animated: true,
      data: { status: 'active' }
    })
  })

  it('should identify parent group nodes and assign subnodes correctly', () => {
    const flatNodes: DAGNode[] = [
      { id: 'g-1', kind: 'reasoning', title: 'Group A', status: 'complete', childrenIds: ['n-1'] },
      { id: 'n-1', kind: 'tool', title: 'Step 1', status: 'complete', parentId: 'g-1' }
    ]
    const { nodes, edges } = transformFlatToFlowElements(flatNodes)

    const groupNode = nodes.find(n => n.id === 'g-1')
    const childNode = nodes.find(n => n.id === 'n-1')

    expect(groupNode).toBeDefined()
    expect(groupNode?.type).toBe('group')
    expect(groupNode?.data.title).toBe('Group A')

    expect(childNode).toBeDefined()
    expect(childNode?.parentNode).toBe('g-1')
    expect(childNode?.extent).toBe('parent')
  })
})
