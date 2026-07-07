<script setup lang="ts">
import { computed } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import { 
  MessageSquare, Image, FileText, ExternalLink, Check, Loader2, 
  Circle, AlertCircle, Wrench, Terminal, FileCode, Globe, File
} from '@lucide/vue'

interface NodeProps {
  id: string
  data: {
    id: string
    kind: 'reasoning' | 'tool' | 'artifact' | 'text'
    title: string
    status?: 'complete' | 'active' | 'pending' | 'error' | 'cancelled' | 'pruned'
    duration?: number
    toolName?: string
    artifactType?: 'image' | 'file' | 'link'
  }
}

const props = defineProps<NodeProps>()

// 判定节点状态
const status = computed(() => props.data.status || 'pending')

const nodeIcon = computed(() => {
  const kind = props.data.kind
  if (kind === 'text') return MessageSquare
  if (kind === 'reasoning') {
    if (status.value === 'active') return Loader2
    if (status.value === 'complete') return Check
    if (status.value === 'error') return AlertCircle
    return Circle
  }
  if (kind === 'artifact') {
    if (props.data.artifactType === 'image') return Image
    if (props.data.artifactType === 'file') return FileText
    return ExternalLink
  }
  if (kind === 'tool') {
    const name = props.data.toolName || ''
    if (['execute_command', 'run_command'].includes(name)) return Terminal
    if (['write_file', 'replace_file_content', 'multi_replace_file_content', 'apply_patch'].includes(name)) return FileCode
    if (['google_search', 'web_search'].includes(name)) return Globe
    if (['read_file', 'view_file'].includes(name)) return File
    return Wrench
  }
  return Circle
})
</script>

<template>
  <div 
    class="custom-step-node" 
    :class="[`status-${status}`, `kind-${data.kind}`]"
  >
    <!-- 入度手柄 (顶部) -->
    <Handle 
      type="target" 
      :position="Position.Top" 
      class="node-handle handle-top" 
    />
    
    <div class="node-body">
      <!-- 左侧图标库 -->
      <div class="icon-container">
        <component 
          :is="nodeIcon" 
          class="step-icon"
          :class="{ 'spin': status === 'active' && data.kind === 'reasoning' }" 
        />
      </div>

      <!-- 标题 -->
      <span class="step-title" :title="data.title">{{ data.title }}</span>

      <!-- 运行时长 -->
      <span v-if="data.duration !== undefined" class="step-duration">
        {{ data.duration }}s
      </span>

      <!-- 状态小指示灯 -->
      <div class="status-indicator">
        <span class="indicator-dot"></span>
      </div>
    </div>

    <!-- 出度手柄 (底部) -->
    <Handle 
      type="source" 
      :position="Position.Bottom" 
      class="node-handle handle-bottom" 
    />
  </div>
</template>

<style scoped>
.custom-step-node {
  width: 220px;
  height: 48px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 8px;
  box-sizing: border-box;
  padding: 0 10px;
  display: flex;
  align-items: center;
  box-shadow: 0 4px 10px -2px rgba(0, 0, 0, 0.03);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.dark .custom-step-node {
  background: rgba(24, 24, 37, 0.85);
  border-color: rgba(255, 255, 255, 0.06);
  box-shadow: 0 4px 10px -2px rgba(0, 0, 0, 0.3);
}

.custom-step-node:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 20px -8px rgba(0, 0, 0, 0.08);
  border-color: rgba(0, 0, 0, 0.15);
}

.dark .custom-step-node:hover {
  box-shadow: 0 12px 20px -8px rgba(0, 0, 0, 0.5);
  border-color: rgba(255, 255, 255, 0.15);
}

/* 核心内容排版 */
.node-body {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 8px;
}

.icon-container {
  width: 26px;
  height: 26px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.03);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #475569;
  flex-shrink: 0;
}

.dark .icon-container {
  background: rgba(255, 255, 255, 0.05);
  color: #cbd5e1;
}

/* 针对不同类型，给图标底座上色 */
.kind-reasoning .icon-container {
  color: #3b82f6;
  background: rgba(59, 130, 246, 0.08);
}
.kind-tool .icon-container {
  color: #0d9488;
  background: rgba(13, 148, 136, 0.08);
}
.kind-artifact .icon-container {
  color: #8b5cf6;
  background: rgba(139, 92, 246, 0.08);
}

.step-icon {
  width: 14px;
  height: 14px;
}

.step-title {
  font-size: 12px;
  font-weight: 600;
  color: #1e293b;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dark .step-title {
  color: #cbd5e1;
}

.step-duration {
  font-size: 10px;
  color: #94a3b8;
  font-family: ui-monospace, monospace;
}

/* 状态小灯 */
.status-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 8px;
  height: 8px;
}

.indicator-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #cbd5e1;
}

.dark .indicator-dot {
  background-color: #475569;
}

.status-complete .indicator-dot {
  background-color: #10b981;
}

.status-active .indicator-dot {
  background-color: #3b82f6;
  animation: pulse 1.5s infinite ease-in-out;
}

.status-error .indicator-dot {
  background-color: #ef4444;
}

/* 动画效果 */
@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.3); opacity: 1; }
}

.spin {
  animation: spin 1s infinite linear;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 连线手柄定制 (极简化) */
.node-handle {
  width: 8px !important;
  height: 8px !important;
  border: 2px solid #ffffff !important;
  background-color: #cbd5e1 !important;
  transition: all 0.2s ease;
  opacity: 0; /* 默认隐藏，悬浮时露出，提供极致清爽视觉 */
}

.custom-step-node:hover .node-handle {
  opacity: 1;
}

.dark .node-handle {
  border-color: #181825 !important;
  background-color: #475569 !important;
}

.status-active .node-handle {
  background-color: #3b82f6 !important;
}

.status-complete .node-handle {
  background-color: #10b981 !important;
}
</style>
