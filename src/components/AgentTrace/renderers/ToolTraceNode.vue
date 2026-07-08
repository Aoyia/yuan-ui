<script setup lang="ts">
import { computed, ref } from 'vue'
import { 
  Wrench, ChevronDown, ChevronRight, AlertCircle, Loader2, 
  ShieldAlert, Check, X, Terminal, FileCode, Globe, File 
} from '@lucide/vue'
import type { TraceStatus, ToolTraceState } from '../types'
import { useAgentTraceContext } from '../context'

// 导入四大内置渲染器
import TerminalRenderer from './TerminalRenderer.vue'
import DiffRenderer from './DiffRenderer.vue'
import SearchRenderer from './SearchRenderer.vue'
import FileRenderer from './FileRenderer.vue'

interface Props {
  id: string
  title: string
  status?: TraceStatus
  state?: ToolTraceState
  duration?: number
  toolName: string
  input?: unknown
  output?: unknown
  errorText?: string
  maxOutputLength?: number
}

const props = withDefaults(defineProps<Props>(), {
  status: 'pending',
  state: 'input-streaming',
  maxOutputLength: 1000,
})

const isInputCollapsed = ref(true)
const isOutputCollapsed = ref(false)

const { onApprove, onReject } = useAgentTraceContext()

const statusClass = computed(() => {
  return {
    'status-complete': props.status === 'complete',
    'status-active': props.status === 'active',
    'status-pending': props.status === 'pending',
    'status-error': props.status === 'error',
    'status-cancelled': props.status === 'cancelled',
  }
})

const stateText = computed(() => {
  switch (props.state) {
    case 'input-streaming': return '输入中'
    case 'input-available': return '准备就绪'
    case 'approval-requested': return '等待审批'
    case 'approval-responded': return '已授权'
    case 'output-available': return '执行成功'
    case 'output-error': return '执行失败'
    case 'output-denied': return '已拒绝'
    default: return '运行中'
  }
})

// 智能路由类型判定
const isTerminalTool = computed(() => ['execute_command', 'run_command'].includes(props.toolName))
const isDiffTool = computed(() => ['write_file', 'replace_file_content', 'multi_replace_file_content', 'apply_patch'].includes(props.toolName))
const isFileTool = computed(() => ['read_file', 'view_file'].includes(props.toolName))
const isSearchTool = computed(() => ['google_search', 'web_search'].includes(props.toolName))

// 派生图标
const toolIcon = computed(() => {
  if (isTerminalTool.value) return Terminal
  if (isDiffTool.value) return FileCode
  if (isSearchTool.value) return Globe
  if (isFileTool.value) return File
  return Wrench
})

// 提取 Terminal 命令行
const terminalCommand = computed(() => {
  if (typeof props.input === 'string') return props.input
  if (props.input && typeof props.input === 'object') {
    return (props.input as any).CommandLine || (props.input as any).command || ''
  }
  return ''
})

// 提取文件读取信息
const fileInfo = computed(() => {
  const input = props.input as any
  let filePath = ''
  if (input && typeof input === 'object') {
    filePath = input.path || input.TargetFile || input.AbsolutePath || ''
  }
  let fileContent = ''
  const output = props.output
  if (typeof output === 'string') {
    fileContent = output
  } else if (output && typeof output === 'object') {
    fileContent = (output as any).content || JSON.stringify(output)
  }
  return { filePath, fileContent }
})

// 提取 Diff 内容和路径
const diffInfo = computed(() => {
  const input = props.input as any
  const output = props.output as any
  
  let filePath = ''
  if (input && typeof input === 'object') {
    filePath = input.TargetFile || input.path || input.AbsolutePath || ''
  }
  
  let diffText = ''
  if (typeof output === 'string' && (output.includes('+++') || output.includes('@@') || output.startsWith('-') || output.startsWith('+'))) {
    diffText = output
  } else if (output && typeof output === 'object' && typeof output.diff === 'string') {
    diffText = output.diff
  } else if (input && typeof input === 'object') {
    if (typeof input.patch === 'string') diffText = input.patch
    if (typeof input.diff === 'string') diffText = input.diff
    if (typeof input.ReplacementContent === 'string') {
      diffText = `@@ -1,1 +1,1 @@\n- ${input.TargetContent || ''}\n+ ${input.ReplacementContent}`
    }
  }
  
  return { filePath, diffText }
})

// 格式化输出 ( fallback 时使用 )
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

function toggleInput() {
  if (formattedInput.value) {
    isInputCollapsed.value = !isInputCollapsed.value
  }
}

function toggleOutput() {
  if (formattedOutput.value || props.errorText) {
    isOutputCollapsed.value = !isOutputCollapsed.value
  }
}

function handleApprove() {
  if (onApprove && props.id) {
    onApprove(props.id)
  }
}

function handleReject() {
  if (onReject && props.id) {
    onReject(props.id, '用户拒绝了执行授权')
  }
}
</script>

<template>
  <div class="yuan-trace-node tool-node" :class="[statusClass, { 'is-active-tool': props.status === 'active' }]">
    <div class="timeline-container">
      <div class="icon-bubble">
        <slot name="icon">
          <Loader2 v-if="props.status === 'active'" class="icon-active spin" />
          <AlertCircle v-else-if="props.status === 'error'" class="icon-error" />
          <component :is="toolIcon" v-else class="icon-tool" />
        </slot>
      </div>
    </div>

    <div class="step-details">
      <div class="step-header">
        <span class="step-label">
          {{ props.title }}
        </span>
        <span class="state-badge" :class="`state-${props.state}`">
          {{ stateText }}
        </span>
        <span v-if="props.duration !== undefined" class="step-duration">
          {{ props.duration }}s
        </span>
      </div>

      <div class="step-body">
        <!-- 极简审批面板 -->
        <div v-if="props.state === 'approval-requested'" class="approval-panel">
          <div class="approval-message">
            <ShieldAlert class="shield-icon" />
            <span>高危敏感命令，需要您的授权审批：</span>
          </div>
          <div class="approval-actions">
            <button type="button" class="approve-btn" @click="handleApprove">
              <Check class="btn-icon" />
              <span>同意执行</span>
            </button>
            <button type="button" class="reject-btn" @click="handleReject">
              <X class="btn-icon" />
              <span>拒绝授权</span>
            </button>
          </div>
        </div>

        <!-- 语义化特化渲染 -->
        <template v-else-if="props.status !== 'pending'">
          
          <!-- 1. 终端渲染器 -->
          <TerminalRenderer 
            v-if="isTerminalTool && (terminalCommand || props.output || props.errorText)"
            :command="terminalCommand"
            :output="props.output as string"
            :error-text="props.errorText"
          />

          <!-- 2. Diff 差异渲染器 -->
          <DiffRenderer
            v-else-if="isDiffTool && diffInfo.diffText"
            :file-path="diffInfo.filePath"
            :diff="diffInfo.diffText"
          />

          <!-- 3. 文件展示渲染器 -->
          <FileRenderer
            v-else-if="isFileTool && fileInfo.filePath"
            :file-path="fileInfo.filePath"
            :content="fileInfo.fileContent"
          />

          <!-- 4. 搜索卡片渲染器 -->
          <SearchRenderer
            v-else-if="isSearchTool && props.output"
            :results="props.output"
          />

          <!-- 5. 兜底 JSON 折叠块渲染 -->
          <template v-else>
            <!-- Input Block -->
            <div v-if="formattedInput" class="panel-section input-section">
              <button type="button" class="section-toggle" @click="toggleInput">
                <component :is="isInputCollapsed ? ChevronRight : ChevronDown" class="toggle-icon" />
                <span class="section-title">输入参数</span>
              </button>
              <div class="grid-transition" :class="{ 'is-expanded': !isInputCollapsed }">
                <div class="grid-transition-inner">
                  <div class="section-content">
                    <pre class="code-block"><code>{{ formattedInput }}</code></pre>
                  </div>
                </div>
              </div>
            </div>

            <!-- Output Block -->
            <div v-if="formattedOutput || props.errorText" class="panel-section output-section">
              <button type="button" class="section-toggle" @click="toggleOutput">
                <component :is="isOutputCollapsed ? ChevronRight : ChevronDown" class="toggle-icon" />
                <span class="section-title">输出结果</span>
              </button>
              <div class="grid-transition" :class="{ 'is-expanded': !isOutputCollapsed }">
                <div class="grid-transition-inner">
                  <div class="section-content">
                    <div v-if="props.errorText" class="error-panel">
                      <pre class="error-text"><code>{{ props.errorText }}</code></pre>
                    </div>
                    <pre v-if="formattedOutput" class="code-block"><code>{{ formattedOutput }}</code></pre>
                  </div>
                </div>
              </div>
            </div>
          </template>

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
  font-size: 0.78rem;
  animation: yuan-slide-in 0.22s cubic-bezier(0.4, 0, 0.2, 1);
  padding: 0.2rem 0;
}

@keyframes yuan-slide-in {
  from {
    opacity: 0;
    transform: translateY(4px);
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
  margin-right: 0.65rem;
  width: 1.1rem;
  position: relative;
  flex-shrink: 0;
}

.icon-bubble {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.1rem;
  height: 1.1rem;
  z-index: 2;
  background-color: transparent;
  transition: all 0.2s ease;
}

.icon-tool {
  width: 0.7rem;
  height: 0.7rem;
  color: var(--yuan-text-secondary);
}

.icon-error {
  width: 0.75rem;
  height: 0.75rem;
  color: var(--yuan-error, #ff3b30);
}

.icon-active {
  width: 0.75rem;
  height: 0.75rem;
  color: var(--yuan-primary);
}


.step-details {
  flex: 1;
  padding-bottom: 0.65rem;
}

.step-header {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  line-height: 1.1rem;
}

.step-label {
  font-weight: 500;
  color: var(--yuan-text-primary);
}

.state-badge {
  font-size: 0.62rem;
  padding: 0 0.25rem;
  border-radius: 4px;
  font-weight: 600;
  border: 1px solid var(--yuan-border);
  background: transparent;
  color: var(--yuan-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.state-input-streaming {
  color: var(--yuan-primary) !important;
  border-color: var(--yuan-primary-light, rgba(0, 113, 227, 0.1)) !important;
}

.state-approval-requested {
  color: var(--yuan-warning, #ff9500) !important;
  border-color: var(--yuan-warning-light, rgba(255, 149, 0, 0.1)) !important;
}

.state-output-available {
  color: var(--yuan-success, #34c759) !important;
  border-color: var(--yuan-success-light, rgba(52, 199, 89, 0.1)) !important;
}

.state-output-error {
  color: var(--yuan-error, #ff3b30) !important;
  border-color: var(--yuan-error-light, rgba(255, 59, 48, 0.1)) !important;
}

.step-duration {
  font-size: 0.68rem;
  color: var(--yuan-text-tertiary);
}

.step-body {
  margin-top: 0.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

/* 极其精制透明的审批面板 */
.approval-panel {
  border: 1px dashed var(--yuan-border);
  background-color: var(--yuan-bg-muted);
  border-radius: 6px;
  padding: 0.5rem 0.6rem;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  margin-top: 0.15rem;
}

.approval-message {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.7rem;
  color: var(--yuan-text-secondary);
}

.shield-icon {
  width: 0.8rem;
  height: 0.8rem;
  color: var(--yuan-warning, #ff9500);
  flex-shrink: 0;
}

.approval-actions {
  display: flex;
  gap: 0.4rem;
}

/* 极细浅色边框按钮 */
.approve-btn, .reject-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.2rem;
  font-size: 0.68rem;
  font-weight: 500;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  background: transparent;
  border: 1px solid var(--yuan-border);
  color: var(--yuan-text-primary);
  transition: all 0.15s ease;
}

.approve-btn:hover {
  background-color: var(--yuan-success-light);
  color: var(--yuan-success);
  border-color: var(--yuan-success);
}

.reject-btn:hover {
  background-color: var(--yuan-error-light);
  color: var(--yuan-error);
  border-color: var(--yuan-error);
}

.btn-icon {
  width: 0.75rem;
  height: 0.75rem;
}

.panel-section {
  border: 1px solid var(--yuan-border);
  border-radius: 6px;
  overflow: hidden;
}

.section-toggle {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 0.2rem 0.4rem;
  background-color: var(--yuan-bg-muted);
  border: none;
  cursor: pointer;
  outline: none;
  text-align: left;
}

.toggle-icon {
  width: 0.75rem;
  height: 0.75rem;
  color: var(--yuan-text-secondary);
  margin-right: 0.2rem;
}

.section-title {
  font-size: 0.7rem;
  font-weight: 500;
  color: var(--yuan-text-primary);
}

.section-content {
  padding: 0.4rem;
  background-color: var(--yuan-bg);
  border-top: 1px solid var(--yuan-border);
}

/* Grid 折叠动效 */
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

.code-block {
  margin: 0;
  padding: 0.2rem;
  background-color: var(--yuan-bg-muted);
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.7rem;
  white-space: pre-wrap;
  word-break: break-all;
  color: var(--yuan-text-secondary);
  max-height: 120px;
  overflow-y: auto;
  scrollbar-width: thin;
}

.error-panel {
  padding: 0.4rem;
  background-color: var(--yuan-error-light, rgba(255, 59, 48, 0.04));
  border: 1px solid var(--yuan-error, rgba(255, 59, 48, 0.08));
  border-radius: 4px;
  margin-bottom: 0.25rem;
}

.error-text {
  margin: 0;
  font-family: monospace;
  font-size: 0.7rem;
  white-space: pre-wrap;
  word-break: break-all;
  color: var(--yuan-error, #ff3b30);
}

/* 状态修饰 */
.status-complete .step-label {
  color: var(--yuan-text-secondary);
}

.status-active .step-label {
  color: var(--yuan-primary);
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
