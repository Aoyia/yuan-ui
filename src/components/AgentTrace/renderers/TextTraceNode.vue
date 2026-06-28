<script setup lang="ts">
import { MessageSquare } from '@lucide/vue'
import type { TextTraceNode } from '../types'

interface Props {
  node: TextTraceNode
}

const props = defineProps<Props>()
</script>

<template>
  <div class="yuan-trace-node text-node status-complete">
    <div class="timeline-container">
      <div class="icon-bubble">
        <slot name="icon">
          <div class="bubble-complete">
            <MessageSquare class="icon-text-node" />
          </div>
        </slot>
      </div>
      <div class="vertical-line" />
    </div>

    <div class="step-details">
      <div class="step-header">
        <span class="step-label">
          {{ props.node.title }}
        </span>
      </div>

      <div class="step-body">
        <div class="text-content">
          {{ props.node.content }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.yuan-trace-node {
  display: flex;
  position: relative;
  width: 100%;
  font-size: 0.875rem;
  animation: yuan-slide-in 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes yuan-slide-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.timeline-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-right: 0.75rem;
  width: 1.25rem;
  position: relative;
  flex-shrink: 0;
}

.icon-bubble {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  z-index: 2;
  background-color: #fff;
  transition: all 0.3s ease;
}

.bubble-complete {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1rem;
  height: 1rem;
  border-radius: 50%;
  background-color: #f1f5f9;
  color: #64748b;
}

.icon-text-node {
  width: 0.65rem;
  height: 0.65rem;
}

.vertical-line {
  position: absolute;
  top: 1.25rem;
  bottom: 0;
  width: 1px;
  background-color: #e2e8f0;
  z-index: 1;
}

.step-details {
  flex: 1;
  padding-bottom: 1rem;
}

.step-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  line-height: 1.25rem;
}

.step-label {
  font-weight: 500;
  color: #64748b;
}

.step-body {
  margin-top: 0.25rem;
}

.text-content {
  font-size: 0.8125rem;
  line-height: 1.5;
  color: #475569;
  white-space: pre-wrap;
}
</style>
