<script setup lang="ts">
import { ChevronDown } from '@lucide/vue'
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
      <div 
        class="status-dot" 
        :class="{ 
          'is-streaming': isStreaming, 
          'is-complete': !isStreaming && duration !== undefined 
        }" 
      />
      <span class="status-text">
        <slot>
          <template v-if="isStreaming">Thinking...</template>
          <template v-else-if="duration !== undefined">Completed in {{ duration }}s</template>
          <template v-else>Agent Trace</template>
        </slot>
      </span>
    </div>
    <ChevronDown class="icon-chevron" :class="{ 'is-open': isOpen }" />
  </button>
</template>

<style scoped>
.yuan-agent-trace-header {
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0.35rem 0.2rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: #86868b;
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--yuan-border);
  cursor: pointer;
  outline: none;
  transition: all 0.2s ease;
  user-select: none;
  margin-bottom: 0.5rem;
}

.dark .yuan-agent-trace-header {
  color: #a1a1aa;
}

.yuan-agent-trace-header:hover {
  color: #1d1d1f;
}

.dark .yuan-agent-trace-header:hover {
  color: #f4f4f5;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.45rem;
}

.status-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background-color: #86868b;
  transition: background-color 0.3s ease;
}

.dark .status-dot {
  background-color: #52525b;
}

.status-dot.is-streaming {
  background-color: #0071e3;
  animation: yuan-pulse-dot 1.4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.status-dot.is-complete {
  background-color: #34c759;
}

@keyframes yuan-pulse-dot {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.35;
    transform: scale(0.8);
  }
}

.status-text {
  font-weight: 500;
  letter-spacing: -0.01em;
}

.icon-chevron {
  width: 0.8rem;
  height: 0.8rem;
  color: #86868b;
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.dark .icon-chevron {
  color: #71717a;
}

.icon-chevron.is-open {
  transform: rotate(180deg);
}
</style>
