import type { InjectionKey, Ref } from 'vue'
import { inject } from 'vue'

export interface AsThoughtChainContextValue {
  isOpen: Ref<boolean>
  isStreaming: Ref<boolean>
  duration: Ref<number | undefined>
  setIsOpen: (value: boolean) => void
  onApprove?: (nodeId: string) => void
  onReject?: (nodeId: string, reason?: string) => void
  toggleCollapse?: (nodeId: string) => void
}

export const AsThoughtChainKey: InjectionKey<AsThoughtChainContextValue> = Symbol('AsThoughtChainContext')

export function useAsThoughtChainContext() {
  const context = inject(AsThoughtChainKey)
  if (!context) {
    throw new Error('AsThoughtChain components must be used within <AsThoughtChain>')
  }
  return context
}
