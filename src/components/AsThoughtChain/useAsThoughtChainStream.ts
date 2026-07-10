import { computed, ref } from 'vue'
import type { AsThoughtChainEvent } from './types'
import { createAsThoughtChainState, reduceAsThoughtChainEvent } from './reducer'

export function useAsThoughtChainStream() {
  const state = ref(createAsThoughtChainState())

  const nodes = computed(() => state.value.nodes)
  const content = computed(() => state.value.content)
  const isStreaming = computed(() => state.value.isStreaming)
  const duration = computed(() => state.value.duration)

  function handleTraceEvent(event: AsThoughtChainEvent) {
    state.value = reduceAsThoughtChainEvent(state.value, event)
  }

  function reset() {
    state.value = reduceAsThoughtChainEvent(state.value, { type: 'reset' })
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
