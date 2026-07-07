<script setup lang="ts">
import { computed, ref } from 'vue'
import { X, ExternalLink, FileText, Info } from '@lucide/vue'
import type { DAGNode, DAGTraceStatus } from './types'
import DAGTraceNode from './DAGTraceNode.vue'
import { computeBFSLayout, getBezierPath } from './layout'
import { useDAGLayout } from './useDAGLayout'

// 导入内置的四个 Renderer
import TerminalRenderer from '../AgentTrace/renderers/TerminalRenderer.vue'
import DiffRenderer from '../AgentTrace/renderers/DiffRenderer.vue'
import SearchRenderer from '../AgentTrace/renderers/SearchRenderer.vue'
import FileRenderer from '../AgentTrace/renderers/FileRenderer.vue'

interface Props {
  nodes: DAGNode[]
  maxOutputLength?: number
}

const props = withDefaults(defineProps<Props>(), {
  maxOutputLength: 600,
})

const emit = defineEmits<{
  (e: 'node-click', id: string): void
}>()

const containerRef = ref<HTMLElement | null>(null)
const nodeElements = ref<Record<string, HTMLElement>>({})

const selectedNodeId = ref<string>('')
const selectedNode = computed(() => props.nodes.find(node => node.id === selectedNodeId.value))

// 1. 拓扑分层布局算法 (BFS Layering)
const columns = computed(() => {
  return computeBFSLayout(props.nodes)
})

// 2. 调用连线 Hook 处理 SVG 连线和 ResizeObserver 自动重绘逻辑
const nodesRef = computed(() => props.nodes)
const { links } = useDAGLayout({
  containerRef,
  nodeElements,
  nodes: nodesRef
})

// 注册气泡节点 DOM 元素句柄
function registerNodeEl(id: string, el: any) {
  if (el) {
    // Vue 3 组件 ref 在组件上获取的是组件实例，如果是 HTML 元素则直接获取 DOM
    nodeElements.value[id] = el.$el || el
  } else {
    delete nodeElements.value[id]
  }
}

// 连线的样式类
function getLinkClass(status: DAGTraceStatus) {
  return {
    'link-complete': status === 'complete',
    'link-active': status === 'active',
    'link-pending': status === 'pending',
    'link-error': status === 'error',
    'link-cancelled': status === 'cancelled',
    'link-pruned': status === 'pruned',
  }
}

function handleNodeClick(id: string) {
  selectedNodeId.value = id
  emit('node-click', id)
}

// Inspector 中 tool 节点的解析与折叠状态逻辑
const selectedToolName = computed(() => {
  const node = selectedNode.value
  return (node && node.kind === 'tool') ? node.toolName : ''
})

const isTerminalTool = computed(() => ['execute_command', 'run_command'].includes(selectedToolName.value))
const isDiffTool = computed(() => ['write_file', 'replace_file_content', 'multi_replace_file_content', 'apply_patch'].includes(selectedToolName.value))
const isFileTool = computed(() => ['read_file', 'view_file'].includes(selectedToolName.value))
const isSearchTool = computed(() => ['google_search', 'web_search'].includes(selectedToolName.value))

// 提取 Terminal 命令行
const terminalCommand = computed(() => {
  const node = selectedNode.value
  if (!node || node.kind !== 'tool') return ''
  const input = node.input
  if (typeof input === 'string') return input
  if (input && typeof input === 'object') {
    return (input as any).CommandLine || (input as any).command || ''
  }
  return ''
})

// 提取文件读取信息
const fileInfo = computed(() => {
  const node = selectedNode.value
  if (!node || node.kind !== 'tool') return { filePath: '', fileContent: '' }
  const input = node.input as any
  let filePath = ''
  if (input && typeof input === 'object') {
    filePath = input.path || input.TargetFile || input.AbsolutePath || ''
  }
  let fileContent = ''
  const output = node.output
  if (typeof output === 'string') {
    fileContent = output
  } else if (output && typeof output === 'object') {
    fileContent = (output as any).content || JSON.stringify(output)
  }
  return { filePath, fileContent }
})

// 提取 Diff 内容和路径
const diffInfo = computed(() => {
  const node = selectedNode.value
  if (!node || node.kind !== 'tool') return { filePath: '', diffText: '' }
  const input = node.input as any
  const output = node.output as any
  
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
  const node = selectedNode.value
  if (!node || node.kind !== 'tool') return ''
  const input = node.input
  if (input === undefined || input === null) return ''
  if (typeof input === 'object') {
    try {
      return JSON.stringify(input, null, 2)
    } catch {
      return String(input)
    }
  }
  return String(input)
})

const formattedOutput = computed(() => {
  const node = selectedNode.value
  if (!node || node.kind !== 'tool') return ''
  const output = node.output
  if (output === undefined || output === null) return ''
  if (typeof output === 'object') {
    try {
      return JSON.stringify(output, null, 2)
    } catch {
      return String(output)
    }
  }
  const str = String(output)
  if (str.length > props.maxOutputLength) {
    return str.slice(0, props.maxOutputLength) + '\n... [truncated]'
  }
  return str
})

const isInputCollapsed = ref(true)
const isOutputCollapsed = ref(false)

function toggleInput() {
  if (formattedInput.value) {
    isInputCollapsed.value = !isInputCollapsed.value
  }
}

function toggleOutput() {
  const node = selectedNode.value
  if (!node || node.kind !== 'tool') return
  if (formattedOutput.value || node.errorText) {
    isOutputCollapsed.value = !isOutputCollapsed.value
  }
}
</script>

<template>
  <div class="dag-flex-layout">
    <!-- 左栏拓扑画布 -->
    <div class="yuan-dag-container" ref="containerRef">
      <!-- 背景极简科技感的网格/渐变 -->
      <div class="dag-grid-bg"></div>

      <!-- 拓扑连接层 (SVG 画布) -->
      <svg class="dag-svg-canvas" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <!-- 激活连线的光亮点动画渐变 -->
          <linearGradient id="glow-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="rgba(59, 130, 246, 0.1)" />
            <stop offset="50%" stop-color="rgba(59, 130, 246, 1)" />
            <stop offset="100%" stop-color="rgba(59, 130, 246, 0.1)" />
          </linearGradient>
        </defs>

        <g v-for="link in links" :key="link.id">
          <!-- 底层虚化发光通道 (仅 active) -->
          <path 
            v-if="link.status === 'active'"
            :d="getBezierPath(link.x1, link.y1, link.x2, link.y2)"
            class="link-glow-underlay"
          />
          
          <!-- 基础实线/虚线 -->
          <path 
            :d="getBezierPath(link.x1, link.y1, link.x2, link.y2)"
            class="link-path"
            :class="getLinkClass(link.status)"
          />

          <!-- 顶层流光动画 (仅 active) -->
          <path 
            v-if="link.status === 'active'"
            :d="getBezierPath(link.x1, link.y1, link.x2, link.y2)"
            class="link-flow-overlay"
          />
        </g>
      </svg>

      <!-- 节点容器层 (分列布局) -->
      <div class="dag-columns-wrapper">
        <div 
          v-for="col in columns" 
          :key="col.level" 
          class="dag-column"
        >
          <div class="column-level-header">
            <span class="level-indicator">STEP {{ col.level + 1 }}</span>
          </div>
          
          <div class="column-nodes-list">
            <DAGTraceNode
              v-for="node in col.nodes"
              :key="node.id"
              :ref="(el) => registerNodeEl(node.id, el)"
              v-bind="node"
              :max-output-length="maxOutputLength"
              :is-selected="node.id === selectedNodeId"
              @click="handleNodeClick"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 右栏详情抽屉面板 (Inspector) -->
    <Transition name="slide">
      <div v-if="selectedNode" class="dag-inspector-panel">
        <div class="inspector-header">
          <div class="inspector-title-area">
            <span class="inspector-kind-badge" :class="`badge-${selectedNode.kind}`">
              {{ selectedNode.kind.toUpperCase() }}
            </span>
            <h3 class="inspector-title" :title="selectedNode.title">{{ selectedNode.title }}</h3>
          </div>
          <button type="button" class="close-inspector-btn" @click="selectedNodeId = ''" title="Close Panel">
            <X class="close-icon" />
          </button>
        </div>

        <div class="inspector-body">
          <!-- 1. reasoning -->
          <div v-if="selectedNode.kind === 'reasoning'" class="inspector-reasoning">
            <div class="reasoning-summary-card">
              <div class="card-header">
                <Info class="card-icon" />
                <span>推理概述</span>
              </div>
              <p class="reasoning-summary-text">{{ (selectedNode as any).summary || '无推理内容' }}</p>
            </div>
          </div>

          <!-- 2. tool -->
          <div v-else-if="selectedNode.kind === 'tool'" class="inspector-tool">
            <!-- 1. 终端渲染器 -->
            <TerminalRenderer 
              v-if="isTerminalTool && (terminalCommand || selectedNode.output || selectedNode.errorText)"
              :command="terminalCommand"
              :output="selectedNode.output as string"
              :error-text="selectedNode.errorText"
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
              v-else-if="isSearchTool && selectedNode.output"
              :results="selectedNode.output"
            />

            <!-- 5. 兜底 JSON 折叠块渲染 -->
            <template v-else>
              <!-- Input Block -->
              <div v-if="formattedInput" class="panel-section input-section">
                <button type="button" class="section-toggle" @click="toggleInput">
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
              <div v-if="formattedOutput || selectedNode.errorText" class="panel-section output-section">
                <button type="button" class="section-toggle" @click="toggleOutput">
                  <span class="section-title">输出结果</span>
                </button>
                <div class="grid-transition" :class="{ 'is-expanded': !isOutputCollapsed }">
                  <div class="grid-transition-inner">
                    <div class="section-content">
                      <div v-if="selectedNode.errorText" class="error-panel">
                        <pre class="error-text"><code>{{ selectedNode.errorText }}</code></pre>
                      </div>
                      <pre v-if="formattedOutput" class="code-block"><code>{{ formattedOutput }}</code></pre>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </div>

          <!-- 3. artifact -->
          <div v-else-if="selectedNode.kind === 'artifact'" class="inspector-artifact">
            <div class="artifact-card">
              <!-- image -->
              <div v-if="(selectedNode as any).artifactType === 'image'" class="artifact-image-wrapper">
                <img :src="(selectedNode as any).url" :alt="(selectedNode as any).caption" class="artifact-image" />
                <p v-if="(selectedNode as any).caption" class="artifact-caption">{{ (selectedNode as any).caption }}</p>
              </div>
              <!-- link -->
              <div v-else-if="(selectedNode as any).artifactType === 'link'" class="artifact-link-wrapper">
                <a :href="(selectedNode as any).url" target="_blank" class="artifact-link">
                  <ExternalLink class="link-icon" />
                  <span>{{ selectedNode.title || '查看链接' }}</span>
                </a>
                <p v-if="(selectedNode as any).caption" class="artifact-caption">{{ (selectedNode as any).caption }}</p>
              </div>
              <!-- file -->
              <div v-else-if="(selectedNode as any).artifactType === 'file'" class="artifact-file-wrapper">
                <div class="artifact-file-info">
                  <FileText class="file-icon" />
                  <span class="file-path">{{ (selectedNode as any).url || selectedNode.title || '查看文件' }}</span>
                </div>
                <p v-if="(selectedNode as any).caption" class="artifact-caption">{{ (selectedNode as any).caption }}</p>
              </div>
            </div>
          </div>

          <!-- 4. text -->
          <div v-else-if="selectedNode.kind === 'text'" class="inspector-text">
            <div class="text-content-card">
              <p class="text-content-body">{{ (selectedNode as any).content || '无文本内容' }}</p>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.dag-flex-layout {
  display: flex;
  width: 100%;
  height: 100%;
  min-height: 500px;
  overflow: hidden;
  position: relative;
}

.yuan-dag-container {
  flex: 1;
  position: relative;
  overflow-x: auto;
  overflow-y: auto;
  box-sizing: border-box;
  padding: 1.5rem;
  scrollbar-width: thin;
}

/* 科技感的背景网格 */
.dag-grid-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  background-image: radial-gradient(rgba(0, 0, 0, 0.03) 1px, transparent 1px);
  background-size: 20px 20px;
  z-index: 0;
}

.dark .dag-grid-bg {
  background-image: radial-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px);
}

/* SVG SVG 连线画布 */
.dag-svg-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

/* 节点列包裹器 */
.dag-columns-wrapper {
  display: flex;
  gap: 5.5rem; /* 列间距，为 SVG 连线空出美观的宽度 */
  position: relative;
  z-index: 2;
  width: max-content;
}

.dag-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 280px;
  flex-shrink: 0;
}

.column-level-header {
  font-size: 0.6875rem;
  font-weight: 700;
  color: #64748b;
  letter-spacing: 0.05em;
  padding: 0.35rem 0.75rem;
  border-radius: 20px;
  background: rgba(0, 0, 0, 0.02);
  border: 1px solid rgba(0, 0, 0, 0.03);
  margin-bottom: 1.5rem;
  user-select: none;
}
.dark .column-level-header {
  color: #94a3b8;
  background: rgba(255, 255, 255, 0.02);
  border-color: rgba(255, 255, 255, 0.03);
}

.column-nodes-list {
  display: flex;
  flex-direction: column;
  gap: 2rem; /* 节点行间距 */
  width: 100%;
}

/* SVG 连线路径样式 */
.link-path {
  fill: none;
  stroke: #cbd5e1;
  stroke-width: 1.5px;
  transition: d 0.3s cubic-bezier(0.25, 1, 0.5, 1), stroke 0.3s ease;
}
.dark .link-path {
  stroke: #334155;
}

.link-complete {
  stroke: #94a3b8;
  stroke-width: 1.5px;
}
.dark .link-complete {
  stroke: #475569;
}

.link-active {
  stroke: #3b82f6;
  stroke-width: 2px;
}

.link-error {
  stroke: #ef4444;
  stroke-width: 2px;
}

.link-pruned {
  stroke: #e2e8f0;
  stroke-width: 1px;
  stroke-dasharray: 4;
  opacity: 0.4;
}
.dark .link-pruned {
  stroke: #1e293b;
}

/* 激活的连线流光和发光效果 */
.link-glow-underlay {
  fill: none;
  stroke: rgba(59, 130, 246, 0.25);
  stroke-width: 6px;
  filter: blur(2px);
}

.link-flow-overlay {
  fill: none;
  stroke: url(#glow-gradient);
  stroke-width: 2px;
  stroke-dasharray: 15 35;
  animation: flow-dash 1.8s infinite linear;
}

@keyframes flow-dash {
  to {
    stroke-dashoffset: -50;
  }
}

/* Inspector Panel styles */
.dag-inspector-panel {
  width: 380px;
  border-left: 1px solid rgba(0, 0, 0, 0.08);
  background: #ffffff;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  z-index: 10;
  box-shadow: -4px 0 16px rgba(0, 0, 0, 0.04);
}
.dark .dag-inspector-panel {
  background: #181825;
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow: -4px 0 16px rgba(0, 0, 0, 0.3);
}

.inspector-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(8px);
}
.dark .inspector-header {
  border-bottom-color: rgba(255, 255, 255, 0.06);
  background: rgba(24, 24, 37, 0.6);
}

.inspector-title-area {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
}

.inspector-kind-badge {
  font-size: 0.625rem;
  font-weight: 700;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  width: max-content;
  letter-spacing: 0.05em;
}
.badge-reasoning {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}
.badge-tool {
  background: rgba(13, 148, 136, 0.1);
  color: #0d9488;
}
.badge-artifact {
  background: rgba(139, 92, 246, 0.1);
  color: #8b5cf6;
}
.badge-text {
  background: rgba(100, 116, 139, 0.1);
  color: #64748b;
}

.inspector-title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.dark .inspector-title {
  color: #f1f5f9;
}

.close-inspector-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  color: #64748b;
  padding: 0.25rem;
  border-radius: 6px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}
.close-inspector-btn:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #1e293b;
}
.dark .close-inspector-btn:hover {
  background: rgba(255, 255, 255, 0.05);
  color: #f1f5f9;
}
.close-icon {
  width: 1.125rem;
  height: 1.125rem;
}

.inspector-body {
  flex: 1;
  overflow-y: auto;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Reasoning panel styles */
.reasoning-summary-card {
  border: 1px solid rgba(59, 130, 246, 0.15);
  background: rgba(59, 130, 246, 0.02);
  border-radius: 8px;
  padding: 0.875rem;
}
.card-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  font-weight: 650;
  color: #3b82f6;
  margin-bottom: 0.5rem;
}
.card-icon {
  width: 0.875rem;
  height: 0.875rem;
}
.reasoning-summary-text {
  font-size: 0.8125rem;
  color: #334155;
  line-height: 1.5;
  margin: 0;
  white-space: pre-wrap;
}
.dark .reasoning-summary-text {
  color: #cbd5e1;
}

/* Artifact panel styles */
.artifact-card {
  border: 1px solid rgba(139, 92, 246, 0.15);
  background: rgba(139, 92, 246, 0.02);
  border-radius: 8px;
  padding: 0.875rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.artifact-image-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.artifact-image {
  max-width: 100%;
  max-height: 240px;
  border-radius: 6px;
  object-fit: contain;
  border: 1px solid rgba(0, 0, 0, 0.05);
  background: #f8fafc;
}
.dark .artifact-image {
  border-color: rgba(255, 255, 255, 0.05);
  background: #0b0f19;
}
.artifact-caption {
  font-size: 0.75rem;
  color: #64748b;
  margin: 0;
  line-height: 1.4;
}
.dark .artifact-caption {
  color: #94a3b8;
}
.artifact-link-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.artifact-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 550;
  color: #8b5cf6;
  text-decoration: none;
  background: rgba(139, 92, 246, 0.05);
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  border: 1px dashed rgba(139, 92, 246, 0.2);
  transition: all 0.2s;
}
.artifact-link:hover {
  background: rgba(139, 92, 246, 0.1);
  transform: translateY(-1px);
}
.link-icon {
  width: 0.875rem;
  height: 0.875rem;
}
.artifact-file-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.artifact-file-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  font-weight: 550;
  color: #475569;
  background: rgba(0, 0, 0, 0.02);
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  border: 1px solid rgba(0, 0, 0, 0.05);
}
.dark .artifact-file-info {
  color: #cbd5e1;
  background: rgba(255, 255, 255, 0.02);
  border-color: rgba(255, 255, 255, 0.05);
}
.file-icon {
  width: 0.875rem;
  height: 0.875rem;
  color: #64748b;
}

/* Text panel styles */
.text-content-card {
  border: 1px solid rgba(0, 0, 0, 0.06);
  background: #f8fafc;
  border-radius: 8px;
  padding: 0.875rem;
}
.dark .text-content-card {
  border-color: rgba(255, 255, 255, 0.06);
  background: rgba(255, 255, 255, 0.01);
}
.text-content-body {
  font-size: 0.8125rem;
  color: #334155;
  line-height: 1.5;
  margin: 0;
  white-space: pre-wrap;
}
.dark .text-content-body {
  color: #cbd5e1;
}

/* Tool Fallback JSON Panel styles */
.panel-section {
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 0.75rem;
}
.dark .panel-section {
  border-color: #334155;
}
.section-toggle {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 0.35rem 0.6rem;
  background-color: #f1f5f9;
  border: none;
  cursor: pointer;
  outline: none;
  text-align: left;
}
.dark .section-toggle {
  background-color: #1e293b;
}
.section-title {
  font-size: 0.75rem;
  font-weight: 600;
  color: #475569;
}
.dark .section-title {
  color: #cbd5e1;
}
.section-content {
  padding: 0.5rem;
  background-color: #ffffff;
  border-top: 1px solid #e2e8f0;
}
.dark .section-content {
  background-color: #0f172a;
  border-top-color: #334155;
}
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
  padding: 0.5rem;
  background-color: #f8fafc;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.75rem;
  white-space: pre-wrap;
  word-break: break-all;
  color: #334155;
  max-height: 200px;
  overflow-y: auto;
  scrollbar-width: thin;
}
.dark .code-block {
  background-color: #0f172a;
  color: #cbd5e1;
}
.error-panel {
  padding: 0.5rem;
  background-color: rgba(239, 68, 68, 0.05);
  border: 1px solid rgba(239, 68, 68, 0.1);
  border-radius: 4px;
  margin-bottom: 0.5rem;
}
.error-text {
  margin: 0;
  font-family: monospace;
  font-size: 0.75rem;
  white-space: pre-wrap;
  word-break: break-all;
  color: #ef4444;
}

/* Transitions */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
</style>

