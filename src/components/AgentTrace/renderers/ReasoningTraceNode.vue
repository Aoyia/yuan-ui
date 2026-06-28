<script setup lang="ts">
import { computed } from 'vue'
import { Check, Loader2, Circle, EyeOff } from '@lucide/vue'
import type { ReasoningTraceNode } from '../types'

interface Props {
  node: ReasoningTraceNode
}

const props = defineProps<Props>()

const statusClass = computed(() => {
  return {
    'status-complete': props.node.status === 'complete',
    'status-active': props.node.status === 'active',
    'status-pending': props.node.status === 'pending',
    'status-error': props.node.status === 'error',
    'status-cancelled': props.node.status === 'cancelled',
  }
})
</script>

<template>
  <div class="yuan-trace-node reasoning-node" :class="statusClass">
    <div class="timeline-container">
      <div class="icon-bubble">
        <slot name="icon">
          <div v-if="props.node.status === 'complete'" class="bubble-complete">
            <Check class="icon-check" />
          </div>
          <Loader2 v-else-if="props.node.status === 'active'" class="icon-active spin" />
          <Circle v-else-if="props.node.status === 'pending'" class="icon-pending" />
          <div v-else class="bubble-cancelled">
            <span class="icon-cancel-line">-</span>
          </div>
        </slot>
      </div>
      <div class="vertical-line" />
    </div>

    <div class="step-details">
      <div class="step-header">
        <span class="step-label">{{ props.node.title }}</span>
        <span v-if="props.node.duration !== undefined" class="step-duration">
          ({{ props.node.duration }}秒)
        </span>
      </div>
      <div class="step-body">
        <template v-if="props.node.visibility === 'redacted'">
          <div class="redacted-content">
            <EyeOff class="icon-redacted" />
            <span>推理内容已隐藏</span>
          </div>
        </template>
        <template v-else>
          <div class="reasoning-summary">{{ props.node.summary }}</div>
        </template>
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
  background-color: #e2e8f0;
  color: #64748b;
}

.icon-check {
  width: 0.7rem;
  height: 0.7rem;
  stroke-width: 3;
}

.icon-active {
  width: 0.875rem;
  height: 0.875rem;
  color: #3b82f6;
}

.icon-pending {
  width: 0.75rem;
  height: 0.75rem;
  color: #e2e8f0;
}

.bubble-cancelled {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1rem;
  height: 1rem;
  border-radius: 50%;
  background-color: #f1f5f9;
  color: #94a3b8;
}

.icon-cancel-line {
  font-size: 0.75rem;
  font-weight: bold;
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
  color: #1e293b;
}

.step-duration {
  font-size: 0.75rem;
  color: #94a3b8;
}

.step-body {
  font-size: 0.8125rem;
  line-height: 1.5;
  margin-top: 0.25rem;
  color: #475569;
}

.redacted-content {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: #94a3b8;
  font-style: italic;
}

.icon-redacted {
  width: 0.875rem;
  height: 0.875rem;
}

.reasoning-summary {
  white-space: pre-wrap;
}

/* 状态过渡 */
.status-complete .step-label {
  color: #64748b;
}

.status-complete .step-body {
  color: #64748b;
}

.status-active .step-label {
  color: #1e293b;
  font-weight: 600;
}

.status-active .step-body {
  color: #334155;
}

.status-pending .step-label {
  color: #cbd5e1;
}

.status-pending .step-body {
  color: #cbd5e1;
}

.status-cancelled .step-label {
  color: #94a3b8;
  text-decoration: line-through;
}

.spin {
  animation: yuan-spin 1s infinite linear;
}

@keyframes yuan-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
