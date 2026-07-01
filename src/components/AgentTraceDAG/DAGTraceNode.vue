<script setup lang="ts">
import { computed } from 'vue'
import { 
  MessageSquare, Image, FileText, ExternalLink, Check, Loader2, 
  Circle, AlertCircle, Wrench, Terminal, FileCode, Globe, File
} from '@lucide/vue'
import type { DAGTraceStatus, ToolTraceState, AgentTraceVisibility } from './types'

interface Props {
  id: string
  kind: 'reasoning' | 'tool' | 'artifact' | 'text'
  title: string
  status?: DAGTraceStatus
  duration?: number
  isSelected?: boolean
  
  // 保留可选属性，防止父组件 v-bind 传入时在 DOM 元素上落入无用 attribute 节点
  summary?: string
  visibility?: AgentTraceVisibility
  toolName?: string
  state?: ToolTraceState
  input?: unknown
  output?: unknown
  errorText?: string
  artifactType?: 'image' | 'file' | 'link'
  url?: string
  caption?: string
  content?: string
  maxOutputLength?: number
}

const props = withDefaults(defineProps<Props>(), {
  status: 'pending',
  visibility: 'details',
  maxOutputLength: 600,
  isSelected: false,
})

const emit = defineEmits<{
  (e: 'click', id: string): void
  (e: 'fork', id: string): void
}>()

const statusClass = computed(() => {
  return {
    'status-complete': props.status === 'complete',
    'status-active': props.status === 'active',
    'status-pending': props.status === 'pending',
    'status-error': props.status === 'error',
    'status-cancelled': props.status === 'cancelled',
    'status-pruned': props.status === 'pruned',
  }
})

// 根据不同类型计算图标
const nodeIcon = computed(() => {
  if (props.kind === 'text') return MessageSquare
  if (props.kind === 'reasoning') {
    if (props.status === 'active') return Loader2
    if (props.status === 'complete') return Check
    if (props.status === 'error') return AlertCircle
    return Circle
  }
  if (props.kind === 'artifact') {
    if (props.artifactType === 'image') return Image
    if (props.artifactType === 'file') return FileText
    return ExternalLink
  }
  if (props.kind === 'tool') {
    const name = props.toolName || ''
    if (['execute_command', 'run_command'].includes(name)) return Terminal
    if (['write_file', 'replace_file_content', 'multi_replace_file_content', 'apply_patch'].includes(name)) return FileCode
    if (['google_search', 'web_search'].includes(name)) return Globe
    if (['read_file', 'view_file'].includes(name)) return File
    return Wrench
  }
  return Circle
})

function handleNodeClick() {
  emit('click', props.id)
}
</script>

<template>
  <div 
    class="yuan-dag-node-wrapper"
    :class="[
      statusClass, 
      `kind-${props.kind}`, 
      { 'is-selected': props.isSelected }
    ]"
    @click="handleNodeClick"
  >
    <div class="node-content">
      <!-- 1. 图标栏 -->
      <div class="node-icon-wrapper">
        <component 
          :is="nodeIcon" 
          class="node-icon"
          :class="{ 'spin': props.status === 'active' && props.kind === 'reasoning' }"
        />
      </div>
      
      <!-- 2. 标题栏 -->
      <span class="node-title" :title="props.title">{{ props.title }}</span>
      
      <!-- 3. 执行时长 -->
      <span v-if="props.duration !== undefined" class="node-duration">
        {{ props.duration }}s
      </span>
      
      <!-- 4. 右侧状态指示灯 -->
      <div class="status-dot-indicator">
        <span class="dot"></span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.yuan-dag-node-wrapper {
  height: 42px;
  width: 200px;
  position: relative;
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-sizing: border-box;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  user-select: none;
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
}

.dark .yuan-dag-node-wrapper {
  background: rgba(30, 30, 35, 0.75);
  border-color: rgba(255, 255, 255, 0.06);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

/* 悬停动效 */
.yuan-dag-node-wrapper:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px -2px rgba(0, 0, 0, 0.06);
  border-color: rgba(0, 0, 0, 0.15);
}
.dark .yuan-dag-node-wrapper:hover {
  box-shadow: 0 4px 12px -2px rgba(0, 0, 0, 0.4);
  border-color: rgba(255, 255, 255, 0.15);
}

/* 选中高亮样式 (isSelected) */
.yuan-dag-node-wrapper.is-selected {
  border-color: #3b82f6;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.06) 0%, rgba(59, 130, 246, 0.02) 100%);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15), 0 4px 12px -2px rgba(59, 130, 246, 0.15);
}
.dark .yuan-dag-node-wrapper.is-selected {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.03) 100%);
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.25), 0 4px 12px -2px rgba(59, 130, 246, 0.3);
}

/* Active 状态呼吸边框 */
.status-active:not(.is-selected) {
  border-color: rgba(59, 130, 246, 0.5);
  animation: border-breath 2s infinite ease-in-out;
}
@keyframes border-breath {
  0%, 100% { border-color: rgba(59, 130, 246, 0.4); }
  50% { border-color: rgba(59, 130, 246, 0.8); }
}

/* Pruned 剪裁变灰置弱 */
.status-pruned {
  opacity: 0.45;
}
.status-pruned:hover {
  opacity: 0.85;
}

/* 内容布局 */
.node-content {
  display: flex;
  align-items: center;
  height: 100%;
  padding: 0 8px;
  gap: 6px;
}

/* 左侧图标 */
.node-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 5px;
  background: rgba(0, 0, 0, 0.03);
  color: #475569;
  flex-shrink: 0;
}
.dark .node-icon-wrapper {
  background: rgba(255, 255, 255, 0.05);
  color: #94a3b8;
}

/* 不同类型图标背景颜色差异 */
.kind-reasoning .node-icon-wrapper {
  color: #3b82f6;
  background: rgba(59, 130, 246, 0.08);
}
.kind-tool .node-icon-wrapper {
  color: #0d9488;
  background: rgba(13, 148, 136, 0.08);
}
.kind-artifact .node-icon-wrapper {
  color: #8b5cf6;
  background: rgba(139, 92, 246, 0.08);
}

.node-icon {
  width: 13px;
  height: 13px;
}

/* 标题 */
.node-title {
  font-size: 12px;
  font-weight: 550;
  color: #1e293b;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.dark .node-title {
  color: #f1f5f9;
}

/* 执行时间 */
.node-duration {
  font-size: 10px;
  color: #94a3b8;
  flex-shrink: 0;
}

/* 右侧指示灯 */
.status-dot-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 10px;
  height: 10px;
  flex-shrink: 0;
}
.status-dot-indicator .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #94a3b8; /* 默认 pending 灰色 */
  transition: all 0.25s ease;
}

/* 状态对应的颜色 */
.status-complete .status-dot-indicator .dot {
  background-color: #10b981; /* 绿色 */
}
.status-active .status-dot-indicator .dot {
  background-color: #3b82f6; /* 蓝色 */
  animation: dot-breath 1.5s infinite ease-in-out;
}
.status-error .status-dot-indicator .dot {
  background-color: #ef4444; /* 红色 */
}
.status-cancelled .status-dot-indicator .dot,
.status-pruned .status-dot-indicator .dot {
  background-color: #64748b; /* 灰色 */
}

@keyframes dot-breath {
  0%, 100% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.3); opacity: 1; }
}

.spin {
  animation: spin 1s infinite linear;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
