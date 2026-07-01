<script setup lang="ts">
import { ref, computed } from 'vue'
import { 
  MessageSquare, Image, FileText, ExternalLink, Check, Loader2, 
  Circle, AlertCircle, Wrench, Terminal, FileCode, Globe, File,
  GitFork, ChevronDown, ChevronUp
} from '@lucide/vue'
import type { DAGTraceStatus, ToolTraceState, AgentTraceVisibility } from './types'

interface Props {
  id: string
  kind: 'reasoning' | 'tool' | 'artifact' | 'text'
  title: string
  status?: DAGTraceStatus
  
  // reasoning
  summary?: string
  visibility?: AgentTraceVisibility
  
  // tool
  toolName?: string
  state?: ToolTraceState
  input?: unknown
  output?: unknown
  errorText?: string
  
  // artifact
  artifactType?: 'image' | 'file' | 'link'
  url?: string
  caption?: string
  
  // text
  content?: string
  
  duration?: number
  maxOutputLength?: number
}

const props = withDefaults(defineProps<Props>(), {
  status: 'pending',
  visibility: 'details',
  maxOutputLength: 600,
})

const emit = defineEmits<{
  (e: 'click', id: string): void
  (e: 'fork', id: string): void
}>()

const isExpanded = ref(false)

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

const isTerminal = computed(() => {
  return props.kind === 'tool' && ['execute_command', 'run_command'].includes(props.toolName || '')
})

const commandText = computed(() => {
  if (typeof props.input === 'string') return props.input
  if (props.input && typeof props.input === 'object') {
    return (props.input as any).CommandLine || (props.input as any).command || ''
  }
  return ''
})

const formattedInput = computed(() => {
  if (props.input === undefined || props.input === null) return ''
  if (typeof props.input === 'object') {
    try {
      return JSON.stringify(props.input, null, 2)
    } catch {
      return String(props.input)
    }
  }
  return String(props.input)
})

const formattedOutput = computed(() => {
  if (props.output === undefined || props.output === null) return ''
  if (typeof props.output === 'object') {
    try {
      return JSON.stringify(props.output, null, 2)
    } catch {
      return String(props.output)
    }
  }
  const str = String(props.output)
  if (str.length > props.maxOutputLength) {
    return str.slice(0, props.maxOutputLength) + '\n... [truncated]'
  }
  return str
})

function handleNodeClick() {
  emit('click', props.id)
}

function handleFork(event: Event) {
  event.stopPropagation()
  emit('fork', props.id)
}

function toggleExpand(event: Event) {
  event.stopPropagation()
  isExpanded.value = !isExpanded.value
}
</script>

<template>
  <div 
    class="yuan-dag-node-wrapper"
    :class="[statusClass, `kind-${props.kind}`]"
    @click="handleNodeClick"
  >
    <!-- 节点主体气泡 -->
    <div class="dag-node-bubble">
      <!-- 头部状态指示呼吸灯和图标 -->
      <div class="node-header">
        <div class="node-icon-wrapper">
          <component 
            :is="nodeIcon" 
            class="node-icon"
            :class="{ 'spin': props.status === 'active' && props.kind === 'reasoning' }"
          />
        </div>
        <span class="node-title">{{ props.title }}</span>
        
        <div class="node-actions-area">
          <span v-if="props.duration !== undefined" class="node-duration">{{ props.duration }}s</span>
          <!-- Fork 干预按钮 -->
          <button 
            type="button" 
            class="action-btn fork-btn" 
            title="从此步骤分叉调整" 
            @click="handleFork"
          >
            <GitFork class="btn-icon" />
          </button>
          <!-- 展开详情按钮 -->
          <button 
            v-if="props.kind !== 'text' || props.content" 
            type="button" 
            class="action-btn expand-btn" 
            @click="toggleExpand"
          >
            <component :is="isExpanded ? ChevronUp : ChevronDown" class="btn-icon" />
          </button>
        </div>
      </div>

      <!-- 节点简短内容 (摘要) -->
      <div class="node-summary-area" v-if="props.kind === 'reasoning' && props.summary">
        <div class="summary-text" v-if="props.visibility !== 'redacted'">
          {{ props.summary }}
        </div>
        <div class="redacted-text" v-else>
          推理内容已隐藏
        </div>
      </div>

      <!-- 纯文本节点展示 -->
      <div class="node-summary-area" v-else-if="props.kind === 'text' && props.content && !isExpanded">
        <div class="summary-text text-truncate">{{ props.content }}</div>
      </div>

      <!-- 语义化展开详情区域 -->
      <div class="grid-transition" :class="{ 'is-expanded': isExpanded }">
        <div class="grid-transition-inner">
          <div class="node-detail-content">
            <!-- Reasoning detail -->
            <div v-if="props.kind === 'reasoning' && props.summary" class="detail-section">
              <div class="detail-label">核心思考记录</div>
              <div class="detail-body pre-wrap">{{ props.summary }}</div>
            </div>

            <!-- Text detail -->
            <div v-else-if="props.kind === 'text' && props.content" class="detail-section">
              <div class="detail-body pre-wrap">{{ props.content }}</div>
            </div>

            <!-- Artifact detail -->
            <div v-else-if="props.kind === 'artifact'" class="detail-section">
              <div v-if="props.artifactType === 'image'" class="artifact-image-container">
                <img :src="props.url" :alt="props.caption || '生成图像'" class="artifact-img" />
                <p v-if="props.caption" class="artifact-caption">{{ props.caption }}</p>
              </div>
              <div v-else-if="props.artifactType === 'file'" class="artifact-link-container">
                <a :href="props.url || '#'" target="_blank" class="artifact-link">
                  <FileText class="link-icon" />
                  <span>{{ props.caption || '查看文件' }}</span>
                  <ExternalLink class="ext-icon" />
                </a>
              </div>
              <div v-else class="artifact-link-container">
                <a :href="props.url || '#'" target="_blank" class="artifact-link">
                  <span>{{ props.caption || props.url }}</span>
                  <ExternalLink class="ext-icon" />
                </a>
              </div>
            </div>

            <!-- Tool detail -->
            <div v-else-if="props.kind === 'tool'" class="detail-section">
              <!-- Command -->
              <div v-if="isTerminal && commandText" class="tool-io-block">
                <div class="detail-label">执行命令</div>
                <pre class="code-pre"><code>{{ commandText }}</code></pre>
              </div>
              <!-- Input -->
              <div v-if="!isTerminal && formattedInput" class="tool-io-block">
                <div class="detail-label">输入参数</div>
                <pre class="code-pre"><code>{{ formattedInput }}</code></pre>
              </div>
              <!-- Error -->
              <div v-if="props.errorText" class="tool-error-block">
                <div class="detail-label error-label">错误输出</div>
                <pre class="code-pre error-pre"><code>{{ props.errorText }}</code></pre>
              </div>
              <!-- Output -->
              <div v-if="formattedOutput" class="tool-io-block">
                <div class="detail-label">执行结果</div>
                <pre class="code-pre"><code>{{ formattedOutput }}</code></pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.yuan-dag-node-wrapper {
  width: 280px;
  position: relative;
  border-radius: 12px;
  padding: 1px;
  box-sizing: border-box;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  user-select: none;
}

/* 玻璃拟态设计（Glassmorphism） */
.dag-node-bubble {
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 11px;
  padding: 0.75rem;
  box-sizing: border-box;
  box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.05),
              0 0 1px 1px rgba(0, 0, 0, 0.02);
  transition: all 0.3s ease;
}

.dark .dag-node-bubble {
  background: rgba(30, 30, 35, 0.75);
  box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.3),
              0 0 0 1px rgba(255, 255, 255, 0.05);
}

/* 气泡边框渐变 */
.yuan-dag-node-wrapper {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0.15) 100%);
}
.dark .yuan-dag-node-wrapper {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%);
}

/* 悬停微动效 */
.yuan-dag-node-wrapper:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px -4px rgba(0, 0, 0, 0.08);
}
.dark .yuan-dag-node-wrapper:hover {
  box-shadow: 0 8px 30px -4px rgba(0, 0, 0, 0.4);
}

/* 状态修饰 */
/* 1. Active 呼吸灯 */
.status-active {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.8) 0%, rgba(59, 130, 246, 0.2) 100%);
  animation: border-breath 2s infinite ease-in-out;
}
.status-active .dag-node-bubble {
  box-shadow: 0 0 15px rgba(59, 130, 246, 0.15);
}

@keyframes border-breath {
  0%, 100% { opacity: 0.85; }
  50% { opacity: 0.5; }
}

/* 2. Error 报错 */
.status-error {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.8) 0%, rgba(239, 68, 68, 0.2) 100%);
}

/* 3. Pruned 剪裁变灰置弱 */
.status-pruned {
  opacity: 0.45;
  background: dotted 1px rgba(0, 0, 0, 0.2);
}
.dark .status-pruned {
  background: dotted 1px rgba(255, 255, 255, 0.05);
}
.status-pruned:hover {
  opacity: 0.85;
}

/* Header Area */
.node-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
}

.node-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.03);
  color: #475569;
}
.dark .node-icon-wrapper {
  background: rgba(255, 255, 255, 0.05);
  color: #94a3b8;
}

/* 不同类型图标背景差异 */
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
  width: 0.875rem;
  height: 0.875rem;
}

.node-title {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #1e293b;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.dark .node-title {
  color: #f1f5f9;
}

.node-actions-area {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.node-duration {
  font-size: 0.6875rem;
  color: #94a3b8;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 4px;
  border: none;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.15s ease;
}

.action-btn:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #475569;
}
.dark .action-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #e2e8f0;
}

.fork-btn:hover {
  color: #3b82f6;
}

.btn-icon {
  width: 0.75rem;
  height: 0.75rem;
}

/* Summary Area */
.node-summary-area {
  margin-top: 0.5rem;
  border-top: 1px solid rgba(0, 0, 0, 0.03);
  padding-top: 0.5rem;
}
.dark .node-summary-area {
  border-top-color: rgba(255, 255, 255, 0.03);
}

.summary-text {
  font-size: 0.75rem;
  color: #475569;
  line-height: 1.4;
}
.dark .summary-text {
  color: #cbd5e1;
}

.text-truncate {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.redacted-text {
  font-size: 0.75rem;
  color: #94a3b8;
  font-style: italic;
}

/* Details transition */
.grid-transition {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.grid-transition.is-expanded {
  grid-template-rows: 1fr;
}
.grid-transition-inner {
  overflow: hidden;
}

.node-detail-content {
  margin-top: 0.5rem;
  border-top: 1px dashed rgba(0, 0, 0, 0.06);
  padding-top: 0.5rem;
}
.dark .node-detail-content {
  border-top-color: rgba(255, 255, 255, 0.06);
}

.detail-section {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.detail-label {
  font-size: 0.6875rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}
.dark .detail-label {
  color: #94a3b8;
}

.detail-body {
  font-size: 0.75rem;
  color: #334155;
  line-height: 1.4;
}
.dark .detail-body {
  color: #e2e8f0;
}

.pre-wrap {
  white-space: pre-wrap;
  word-break: break-all;
}

/* Code block */
.code-pre {
  margin: 0.25rem 0;
  padding: 0.375rem;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.02);
  border: 1px solid rgba(0, 0, 0, 0.04);
  font-family: monospace;
  font-size: 0.6875rem;
  max-height: 120px;
  overflow-y: auto;
  color: #334155;
  scrollbar-width: thin;
}
.dark .code-pre {
  background: rgba(0, 0, 0, 0.2);
  border-color: rgba(255, 255, 255, 0.05);
  color: #cbd5e1;
}

.error-label {
  color: #ef4444;
}
.error-pre {
  background: rgba(239, 68, 68, 0.03);
  border-color: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}
.dark .error-pre {
  background: rgba(239, 68, 68, 0.05);
  color: #f87171;
}

/* Artifact image */
.artifact-image-container {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.artifact-img {
  max-width: 100%;
  max-height: 140px;
  object-fit: contain;
  border-radius: 6px;
  border: 1px solid rgba(0, 0, 0, 0.06);
}
.dark .artifact-img {
  border-color: rgba(255, 255, 255, 0.08);
}
.artifact-caption {
  font-size: 0.6875rem;
  color: #64748b;
  margin: 0;
}

/* Artifact link */
.artifact-link-container {
  display: flex;
}
.artifact-link {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: #3b82f6;
  text-decoration: none;
}
.artifact-link:hover {
  text-decoration: underline;
}
.link-icon, .ext-icon {
  width: 0.75rem;
  height: 0.75rem;
}

.spin {
  animation: spin 1s infinite linear;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
