import type { InjectionKey, Ref } from 'vue'
import { inject } from 'vue'

export interface AgentTraceContextValue {
  isOpen: Ref<boolean>
  isStreaming: Ref<boolean>
  duration: Ref<number | undefined>
  setIsOpen: (value: boolean) => void
}

export const AgentTraceKey: InjectionKey<AgentTraceContextValue> = Symbol('AgentTraceContext')

export function useAgentTraceContext() {
  const context = inject(AgentTraceKey)
  if (!context) {
    throw new Error('AgentTrace components must be used within <AgentTrace>')
  }
  return context
}
