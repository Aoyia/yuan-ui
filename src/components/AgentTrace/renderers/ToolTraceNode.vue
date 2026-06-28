<script setup lang="ts">
import { computed, ref } from 'vue'
import { Wrench, ChevronDown, ChevronRight, AlertCircle, Loader2 } from '@lucide/vue'
import type { ToolTraceNode } from '../types'

interface Props {
  node: ToolTraceNode
  maxOutputLength?: number
}

const props = withDefaults(defineProps<Props>(), {
  maxOutputLength: 1000,
})

const isInputCollapsed = ref(true)
const isOutputCollapsed = ref(false)

const statusClass = computed(() => {
  return {
    'status-complete': props.node.status === 'complete',
    'status-active': props.node.status === 'active',
    'status-pending': props.node.status === 'pending',
    'status-error': props.node.status === 'error',
    'status-cancelled': props.node.status === 'cancelled',
  }
})

const stateText = computed(() => {
  switch (props.node.state) {
    case 'input-streaming': return '参数输入中'
    case 'input-available': return '参数已就绪'
    case 'approval-requested': return '等待用户审批'
    case 'approval-responded': return '用户已审批'
    case 'output-available': return '已完成'
    case 'output-error': return '已失败'
    case 'output-denied': return '已被拒绝'
    default: return '执行中'
  }
})

const formattedInput = computed(() => {
  if (props.node.input === undefined || props.node.input === null) return ''
  if (typeof props.node.input === 'object') {
    try {
      return JSON.stringify(props.node.input, null, 2)
    } catch {
      return String(props.node.input)
    }
  }
  return String(props.node.input)
})

const formattedOutput = computed(() => {
  if (props.node.output === undefined || props.node.output === null) return ''
  if (typeof props.node.output === 'object') {
    try {
      return JSON.stringify(props.node.output, null, 2)
    } catch {
      return String(props.node.output)
    }
  }
  const str = String(props.node.output)
  if (str.length > props.maxOutputLength) {
    return str.slice(0, props.maxOutputLength) + '\n... [部分输出已被截断]'
  }
  return str
})

function toggleInput() {
  if (formattedInput.value) {
    isInputCollapsed.value = !isInputCollapsed.value
  }
}

function toggleOutput() {
  if (formattedOutput.value || props.node.errorText) {
    isOutputCollapsed.value = !isOutputCollapsed.value
  }
}
</script>

<template>
  <div class="yuan-trace-node tool-node" :class="statusClass">
    <div class="timeline-container">
      <div class="icon-bubble">
        <slot name="icon">
          <div v-if="props.node.status === 'complete'" class="bubble-complete">
            <Wrench class="icon-tool" />
          </div>
          <Loader2 v-else-if="props.node.status === 'active'" class="icon-active spin" />
          <div v-else-if="props.node.status === 'error'" class="bubble-error">
            <AlertCircle class="icon-error" />
          </div>
          <div v-else class="bubble-pending">
            <Wrench class="icon-tool" />
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
        <span class="state-badge" :class="`state-${props.node.state}`">
          {{ stateText }}
        </span>
        <span v-if="props.node.duration !== undefined" class="step-duration">
          ({{ props.node.duration }}秒)
        </span>
      </div>

      <div class="step-body">
        <!-- Input Block -->
        <div v-if="formattedInput" class="panel-section input-section">
          <button type="button" class="section-toggle" @click="toggleInput">
            <component :is="isInputCollapsed ? ChevronRight : ChevronDown" class="toggle-icon" />
            <span class="section-title">输入参数</span>
          </button>
          <div v-show="!isInputCollapsed" class="section-content">
            <pre class="code-block"><code>{{ formattedInput }}</code></pre>
          </div>
        </div>

        <!-- Output Block -->
        <div v-if="formattedOutput || props.node.errorText" class="panel-section output-section">
          <button type="button" class="section-toggle" @click="toggleOutput">
            <component :is="isOutputCollapsed ? ChevronRight : ChevronDown" class="toggle-icon" />
            <span class="section-title">输出结果</span>
          </button>
          <div v-show="!isOutputCollapsed" class="section-content">
            <div v-if="props.node.errorText" class="error-panel">
              <pre class="error-text"><code>{{ props.node.errorText }}</code></pre>
            </div>
            <pre v-if="formattedOutput" class="code-block"><code>{{ formattedOutput }}</code></pre>
          </div>
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

.bubble-error {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1rem;
  height: 1rem;
  border-radius: 50%;
  background-color: #fee2e2;
  color: #ef4444;
}

.bubble-pending {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1rem;
  height: 1rem;
  border-radius: 50%;
  background-color: #f8fafc;
  color: #cbd5e1;
}

.icon-tool {
  width: 0.65rem;
  height: 0.65rem;
}

.icon-error {
  width: 0.7rem;
  height: 0.7rem;
}

.icon-active {
  width: 0.875rem;
  height: 0.875rem;
  color: #3b82f6;
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

.state-badge {
  font-size: 0.75rem;
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  font-weight: 500;
  background-color: #f1f5f9;
  color: #64748b;
}

.state-input-streaming {
  background-color: #eff6ff;
  color: #3b82f6;
}

.state-approval-requested {
  background-color: #fef3c7;
  color: #d97706;
}

.state-output-available {
  background-color: #ecfdf5;
  color: #10b981;
}

.state-output-error {
  background-color: #fee2e2;
  color: #ef4444;
}

.state-output-denied {
  background-color: #f5f5f5;
  color: #737373;
}

.step-duration {
  font-size: 0.75rem;
  color: #94a3b8;
}

.step-body {
  margin-top: 0.375rem;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.panel-section {
  border: 1px solid #f1f5f9;
  border-radius: 6px;
  overflow: hidden;
}

.section-toggle {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 0.25rem 0.5rem;
  background-color: #f8fafc;
  border: none;
  cursor: pointer;
  outline: none;
  text-align: left;
}

.toggle-icon {
  width: 0.875rem;
  height: 0.875rem;
  color: #64748b;
  margin-right: 0.25rem;
}

.section-title {
  font-size: 0.75rem;
  font-weight: 600;
  color: #475569;
}

.section-content {
  padding: 0.5rem;
  background-color: #fff;
  border-top: 1px solid #f1f5f9;
}

.code-block {
  margin: 0;
  padding: 0.25rem;
  background-color: #f8fafc;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.75rem;
  white-space: pre-wrap;
  word-break: break-all;
  color: #334155;
  max-height: 150px;
  overflow-y: auto;
}

.error-panel {
  padding: 0.5rem;
  background-color: #fef2f2;
  border: 1px solid #fee2e2;
  border-radius: 4px;
  margin-bottom: 0.375rem;
}

.error-text {
  margin: 0;
  font-family: monospace;
  font-size: 0.75rem;
  white-space: pre-wrap;
  word-break: break-all;
  color: #dc2626;
}

/* 状态过渡 */
.status-complete .step-label {
  color: #64748b;
}

.status-active .step-label {
  color: #1e293b;
  font-weight: 600;
}

.spin {
  animation: yuan-spin 1s infinite linear;
}

@keyframes yuan-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
