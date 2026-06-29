<script setup lang="ts">
import { Brain, ChevronDown } from '@lucide/vue'
import { useChainOfThoughtContext } from './context'

const { isOpen, setIsOpen } = useChainOfThoughtContext()

function toggleOpen() {
  setIsOpen(!isOpen.value)
}
</script>

<template>
  <button
    type="button"
    class="yuan-cot-header"
    @click="toggleOpen"
  >
    <div class="header-left">
      <Brain class="icon-brain" />
      <span class="status-text">
        <slot>思维链 (Chain of Thought)</slot>
      </span>
    </div>
    <ChevronDown class="icon-chevron" :class="{ 'is-open': isOpen }" />
  </button>
</template>

<style scoped>
.yuan-cot-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  color: #6b7280; /* 浅灰色文字，不干扰正文 */
  background: transparent;
  border: none;
  cursor: pointer;
  outline: none;
  transition: color 0.2s ease;
  user-select: none;
}

.yuan-cot-header:hover {
  color: #111827;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.icon-brain {
  width: 1rem;
  height: 1rem;
  color: #8b5cf6; /* 紫色 */
}

.status-text {
  font-weight: 500;
}

.icon-chevron {
  width: 1rem;
  height: 1rem;
  transition: transform 0.2s ease;
}

.icon-chevron.is-open {
  transform: rotate(180deg);
}
</style>
