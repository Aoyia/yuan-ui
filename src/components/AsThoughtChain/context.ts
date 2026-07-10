import type { InjectionKey, Ref } from 'vue'
import { inject } from 'vue'

export interface AgentTraceContextValue {
  isOpen: Ref<boolean>
  isStreaming: Ref<boolean>
  duration: Ref<number | undefined>
  setIsOpen: (value: boolean) => void
  onApprove?: (nodeId: string) => void
  onReject?: (nodeId: string, reason?: string) => void
  toggleCollapse?: (nodeId: string) => void
}

export const AgentTraceKey: InjectionKey<AgentTraceContextValue> = Symbol('AgentTraceContext')

export function useAgentTraceContext() {
  const context = inject(AgentTraceKey)
  if (!context) {
    throw new Error('AgentTrace components must be used within <AgentTrace>')
  }
  return context
}
