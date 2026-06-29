import type { InjectionKey, Ref } from 'vue'
import { inject } from 'vue'

export interface ChainOfThoughtStepItem {
  id: string
  label: string
  content: string
  status: 'complete' | 'active' | 'pending'
  startTime: number
  duration?: number
}

export interface ChainOfThoughtContextValue {
  isOpen: Ref<boolean>
  setIsOpen: (val: boolean) => void
}

export const ChainOfThoughtKey: InjectionKey<ChainOfThoughtContextValue> = Symbol('ChainOfThoughtContext')

export function useChainOfThoughtContext() {
  const ctx = inject<ChainOfThoughtContextValue>(ChainOfThoughtKey)
  if (!ctx) {
    throw new Error('ChainOfThought components must be used within <ChainOfThought>')
  }
  return ctx
}
