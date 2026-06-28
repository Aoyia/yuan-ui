import { computed, ref } from 'vue'
import type { AgentTraceEvent } from './types'
import { createAgentTraceState, reduceAgentTraceEvent } from './reducer'

export function useAgentTraceStream() {
  const state = ref(createAgentTraceState())

  const nodes = computed(() => state.value.nodes)
  const content = computed(() => state.value.content)
  const isStreaming = computed(() => state.value.isStreaming)
  const duration = computed(() => state.value.duration)

  function handleTraceEvent(event: AgentTraceEvent) {
    state.value = reduceAgentTraceEvent(state.value, event)
  }

  function reset() {
    state.value = reduceAgentTraceEvent(state.value, { type: 'reset' })
  }

  return {
    state,
    nodes,
    content,
    isStreaming,
    duration,
    handleTraceEvent,
    reset,
  }
}
