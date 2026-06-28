<script setup lang="ts">
import { Activity, ChevronDown } from '@lucide/vue'
import { useAgentTraceContext } from './context'

const { isOpen, isStreaming, duration, setIsOpen } = useAgentTraceContext()

function toggleOpen() {
  setIsOpen(!isOpen.value)
}
</script>

<template>
  <button
    type="button"
    class="yuan-agent-trace-header"
    @click="toggleOpen"
  >
    <div class="header-left">
      <slot name="icon">
        <Activity class="icon-activity" :class="{ 'is-streaming': isStreaming }" />
      </slot>
      <span class="status-text">
        <slot>
          <template v-if="isStreaming">正在处理...</template>
          <template v-else-if="duration !== undefined">已完成，用时 {{ duration }} 秒</template>
          <template v-else>执行轨迹</template>
        </slot>
      </span>
    </div>
    <ChevronDown class="icon-chevron" :class="{ 'is-open': isOpen }" />
  </button>
</template>

<style scoped>
.yuan-agent-trace-header {
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

.yuan-agent-trace-header:hover {
  color: #111827;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.icon-activity {
  width: 1rem;
  height: 1rem;
  color: #10b981; /* 绿色 */
}

.icon-activity.is-streaming {
  animation: yuan-pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  color: #3b82f6; /* streaming时用蓝色 */
}

@keyframes yuan-pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: .5;
  }
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
