<script setup lang="ts">
import { useVModel, useTimeoutFn } from '@vueuse/core'
import { provide, watch, toRef } from 'vue'
import { AsThoughtChainKey } from './context'

interface Props {
  open?: boolean
  defaultOpen?: boolean
  autoClose?: boolean      // 结束后是否自动折叠
  autoCloseDelay?: number  // 自动折叠延迟毫秒数，默认 1200
  isStreaming?: boolean    // 智能体是否正在流式执行
  duration?: number        // 执行耗时（秒）
}

const props = withDefaults(defineProps<Props>(), {
  defaultOpen: false,
  autoClose: true,
  autoCloseDelay: 1200,
  isStreaming: false,
})

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'approve', nodeId: string): void
  (e: 'reject', payload: { nodeId: string; reason?: string }): void
  (e: 'toggle-collapse', nodeId: string): void
}>()

const isOpen = useVModel(props, 'open', emit, {
  defaultValue: props.defaultOpen,
  passive: true,
})

const { start: startAutoClose, stop: stopAutoClose } = useTimeoutFn(() => {
  isOpen.value = false
}, () => props.autoCloseDelay, { immediate: false })

// 监听 streaming 状态，流式开始时自动展开，结束后如果开启了自动折叠，则延迟折叠
watch(() => props.isStreaming, (newVal, oldVal) => {
  if (newVal === true) {
    stopAutoClose()
    isOpen.value = true
  } else if (props.autoClose && oldVal === true && newVal === false && isOpen.value) {
    startAutoClose()
  }
}, { immediate: true })

provide(AsThoughtChainKey, {
  isOpen,
  isStreaming: toRef(props, 'isStreaming'),
  duration: toRef(props, 'duration'),
  setIsOpen: (val: boolean) => { isOpen.value = val },
  onApprove: (nodeId: string) => {
    emit('approve', nodeId)
  },
  onReject: (nodeId: string, reason?: string) => {
    emit('reject', { nodeId, reason })
  },
  toggleCollapse: (nodeId: string) => {
    emit('toggle-collapse', nodeId)
  }
})
</script>

<template>
  <div class="yuan-agent-trace">
    <slot />
  </div>
</template>

<style>
.yuan-agent-trace {
  max-width: 65ch;
  margin-bottom: 1rem;
  width: 100%;
}
</style>
