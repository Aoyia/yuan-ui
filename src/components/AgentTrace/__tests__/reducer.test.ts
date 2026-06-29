import { describe, expect, it } from 'vitest'
import { createAgentTraceState, reduceAgentTraceEvent } from '../reducer'

describe('reduceAgentTraceEvent', () => {
  it('appends reasoning summary deltas into one active reasoning node', () => {
    let state = createAgentTraceState()

    state = reduceAgentTraceEvent(state, { type: 'reasoning-delta', delta: '分析需求' }, 1000)
    state = reduceAgentTraceEvent(state, { type: 'reasoning-delta', delta: '，确认组件边界' }, 1500)

    expect(state.nodes).toHaveLength(1)
    expect(state.nodes[0]).toMatchObject({
      kind: 'reasoning',
      status: 'active',
      summary: '分析需求，确认组件边界',
    })
    expect(state.isStreaming).toBe(true)
  })

  it('closes active reasoning when a tool starts', () => {
    let state = createAgentTraceState()

    state = reduceAgentTraceEvent(state, { type: 'reasoning-delta', delta: '需要读取配置' }, 1000)
    state = reduceAgentTraceEvent(
      state,
      { type: 'tool-input-start', id: 'tool-1', toolName: 'read_file', input: { path: 'vite.config.js' } },
      2500,
    )

    expect(state.nodes[0]).toMatchObject({
      kind: 'reasoning',
      status: 'complete',
      duration: 2,
    })
    expect(state.nodes[1]).toMatchObject({
      kind: 'tool',
      toolName: 'read_file',
      state: 'input-available',
      status: 'active',
    })
  })

  it('updates matching tool output without relying on list order', () => {
    let state = createAgentTraceState()

    state = reduceAgentTraceEvent(state, { type: 'tool-input-start', id: 'search', toolName: 'google_search' }, 1000)
    state = reduceAgentTraceEvent(state, { type: 'tool-input-start', id: 'cmd', toolName: 'execute_command' }, 1200)
    state = reduceAgentTraceEvent(state, { type: 'tool-output', id: 'search', output: [{ title: 'Vue docs' }] }, 2000)

    expect(state.nodes.find(node => node.id === 'search')).toMatchObject({
      kind: 'tool',
      status: 'complete',
      state: 'output-available',
      output: [{ title: 'Vue docs' }],
    })
    expect(state.nodes.find(node => node.id === 'cmd')).toMatchObject({
      kind: 'tool',
      status: 'active',
      state: 'input-streaming',
    })
  })

  it('marks tool output errors as error nodes', () => {
    let state = createAgentTraceState()

    state = reduceAgentTraceEvent(state, { type: 'tool-input-start', id: 'cmd', toolName: 'execute_command' }, 1000)
    state = reduceAgentTraceEvent(state, { type: 'tool-output', id: 'cmd', errorText: 'Command failed' }, 2000)

    expect(state.nodes[0]).toMatchObject({
      kind: 'tool',
      status: 'error',
      state: 'output-error',
      errorText: 'Command failed',
    })
  })

  it('handles tool approval lifecycle events', () => {
    let state = createAgentTraceState()

    // 1. 开始工具调用
    state = reduceAgentTraceEvent(state, { type: 'tool-input-start', id: 'cmd', toolName: 'execute_command' }, 1000)
    // 2. 请求审批
    state = reduceAgentTraceEvent(state, { type: 'tool-approval-request', id: 'cmd' }, 1500)
    expect(state.nodes[0]).toMatchObject({
      kind: 'tool',
      state: 'approval-requested',
      status: 'active',
    })

    // 3. 拒绝审批
    let rejectedState = reduceAgentTraceEvent(state, { type: 'tool-approval-response', id: 'cmd', approved: false, reason: 'Command is too dangerous' }, 2000)
    expect(rejectedState.nodes[0]).toMatchObject({
      kind: 'tool',
      state: 'output-denied',
      status: 'complete',
      errorText: 'Command is too dangerous',
    })

    // 4. 同意审批
    let approvedState = reduceAgentTraceEvent(state, { type: 'tool-approval-response', id: 'cmd', approved: true }, 2000)
    expect(approvedState.nodes[0]).toMatchObject({
      kind: 'tool',
      state: 'approval-responded',
      status: 'active',
    })
  })

  it('creates nested group nodes and ends them correctly', () => {
    let state = createAgentTraceState()

    // 1. 开始父 Group
    state = reduceAgentTraceEvent(state, { type: 'group-start', id: 'g-parent', title: '父分组' }, 1000)
    // 2. 开始子 Group
    state = reduceAgentTraceEvent(state, { type: 'group-start', id: 'g-child', title: '子分组', parentId: 'g-parent' }, 1200)

    expect(state.nodes).toHaveLength(2)
    expect(state.nodes.find(n => n.id === 'g-child')).toMatchObject({
      kind: 'group',
      title: '子分组',
      parentId: 'g-parent',
      status: 'active',
    })

    // 3. 结束子 Group
    state = reduceAgentTraceEvent(state, { type: 'group-end', id: 'g-child' }, 2000)
    expect(state.nodes.find(n => n.id === 'g-child')).toMatchObject({
      status: 'complete',
      duration: 1, // 2000 - 1200 = 800ms -> Math.ceil(0.8) = 1s
    })
  })

  it('triggers progressive collapse for finished sibling groups', () => {
    let state = createAgentTraceState()

    // 1. 开启第一个顶级 Group 且完成它
    state = reduceAgentTraceEvent(state, { type: 'group-start', id: 'g-1', title: '大步骤一' }, 1000)
    state = reduceAgentTraceEvent(state, { type: 'group-end', id: 'g-1' }, 2000)
    expect(state.nodes.find(n => n.id === 'g-1')).toMatchObject({
      status: 'complete',
      isCollapsed: false, // 刚结束时默认不折叠
    })

    // 2. 开启同级（顶级）的第二个大 Group g-2，测试渐进折叠
    state = reduceAgentTraceEvent(state, { type: 'group-start', id: 'g-2', title: '大步骤二' }, 3000)
    
    // 预期：前一个 complete 状态的顶级 g-1 会被自动折叠
    expect(state.nodes.find(n => n.id === 'g-1')?.kind === 'group' && (state.nodes.find(n => n.id === 'g-1') as any).isCollapsed).toBe(true)
    // 预期：当前的 g-2 强制展开
    expect(state.nodes.find(n => n.id === 'g-2')?.kind === 'group' && (state.nodes.find(n => n.id === 'g-2') as any).isCollapsed).toBe(false)
  })

  it('allows manual collapse toggling', () => {
    let state = createAgentTraceState()
    state = reduceAgentTraceEvent(state, { type: 'group-start', id: 'g-1', title: '分组' }, 1000)
    
    // 手动收起
    state = reduceAgentTraceEvent(state, { type: 'toggle-collapse', id: 'g-1', isCollapsed: true })
    expect(state.nodes.find(n => n.id === 'g-1')?.kind === 'group' && (state.nodes.find(n => n.id === 'g-1') as any).isCollapsed).toBe(true)
    
    // 手动展开
    state = reduceAgentTraceEvent(state, { type: 'toggle-collapse', id: 'g-1', isCollapsed: false })
    expect(state.nodes.find(n => n.id === 'g-1')?.kind === 'group' && (state.nodes.find(n => n.id === 'g-1') as any).isCollapsed).toBe(false)
  })

  it('collapses all group nodes when collapse-all-groups event is received', () => {
    let state = createAgentTraceState()
    state = reduceAgentTraceEvent(state, { type: 'group-start', id: 'g-1', title: '组一' }, 1000)
    state = reduceAgentTraceEvent(state, { type: 'group-start', id: 'g-2', title: '组二' }, 2000)
    
    // 强制把所有组一键折叠
    state = reduceAgentTraceEvent(state, { type: 'collapse-all-groups' })
    expect(state.nodes.find(n => n.id === 'g-1')?.kind === 'group' && (state.nodes.find(n => n.id === 'g-1') as any).isCollapsed).toBe(true)
    expect(state.nodes.find(n => n.id === 'g-2')?.kind === 'group' && (state.nodes.find(n => n.id === 'g-2') as any).isCollapsed).toBe(true)
  })
})


