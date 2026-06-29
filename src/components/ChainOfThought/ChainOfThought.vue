<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import { provide, watch } from 'vue'
import { ChainOfThoughtKey } from './context'

interface Props {
  open?: boolean
  defaultOpen?: boolean
  autoClose?: boolean  // 思考完毕后是否自动收缩折叠
  isThinking?: boolean  // 模型的思考/推理流状态
}

const props = withDefaults(defineProps<Props>(), {
  defaultOpen: false,
  autoClose: true,
  isThinking: false,
})

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
}>()

const isOpen = useVModel(props, 'open', emit, {
  defaultValue: props.defaultOpen,
  passive: true,
})

// 监听思考流结束状态，执行延迟自动折叠逻辑，提升长对话的屏占比与可读性
watch(() => props.isThinking, (newVal, oldVal) => {
  if (props.autoClose && oldVal === true && newVal === false && isOpen.value) {
    setTimeout(() => {
      isOpen.value = false
    }, 1200) // 延迟 1.2s，提供从高亮高频思维到阅读正文的视线过渡
  }
})

provide(ChainOfThoughtKey, {
  isOpen,
  setIsOpen: (val: boolean) => { isOpen.value = val }
})
</script>

<template>
  <div class="yuan-chain-of-thought">
    <slot />
  </div>
</template>

<style scoped>
.yuan-chain-of-thought {
  max-width: 65ch;
  margin-bottom: 1rem;
  width: 100%;
}
</style>
