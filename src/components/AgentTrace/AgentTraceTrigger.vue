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
    class="yuan-agent-trace__trigger"
    @click="toggleOpen"
  >
    <div class="yuan-agent-trace__trigger-left">
      <div 
        class="yuan-agent-trace__trigger-dot" 
        :class="{ 
          'yuan-agent-trace__trigger-dot--streaming': isStreaming, 
          'yuan-agent-trace__trigger-dot--complete': !isStreaming && duration !== undefined 
        }" 
      />
      <span class="yuan-agent-trace__trigger-text">
        <slot>
          <template v-if="isStreaming">Thinking...</template>
          <template v-else-if="duration !== undefined">Completed in {{ duration }}s</template>
          <template v-else>Agent Trace</template>
        </slot>
      </span>
    </div>
    <ChevronDown class="yuan-agent-trace__trigger-chevron" :class="{ 'yuan-agent-trace__trigger-chevron--open': isOpen }" />
  </button>
</template>

<style>
.yuan-agent-trace__trigger {
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

.dark .yuan-agent-trace__trigger {
  color: #a1a1aa;
}

.yuan-agent-trace__trigger:hover {
  color: #1d1d1f;
}

.dark .yuan-agent-trace__trigger:hover {
  color: #f4f4f5;
}

.yuan-agent-trace__trigger-left {
  display: flex;
  align-items: center;
  gap: 0.45rem;
}

.yuan-agent-trace__trigger-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background-color: #86868b;
  transition: background-color 0.3s ease;
}

.dark .yuan-agent-trace__trigger-dot {
  background-color: #52525b;
}

.yuan-agent-trace__trigger-dot--streaming {
  background-color: #0071e3;
  animation: yuan-pulse-dot 1.4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.yuan-agent-trace__trigger-dot--complete {
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

.yuan-agent-trace__trigger-text {
  font-weight: 500;
  letter-spacing: -0.01em;
}

.yuan-agent-trace__trigger-chevron {
  width: 0.8rem;
  height: 0.8rem;
  color: #86868b;
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.dark .yuan-agent-trace__trigger-chevron {
  color: #71717a;
}

.yuan-agent-trace__trigger-chevron--open {
  transform: rotate(180deg);
}
</style>
