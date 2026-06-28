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
})
