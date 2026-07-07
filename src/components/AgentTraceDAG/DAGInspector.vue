<script setup lang="ts">
import { computed, ref } from 'vue'
import { X, ExternalLink, FileText, Info } from '@lucide/vue'
import type { DAGNode } from './types'

// 从 ../AgentTrace/renderers/ 导入内置渲染器
import TerminalRenderer from '../AgentTrace/renderers/TerminalRenderer.vue'
import DiffRenderer from '../AgentTrace/renderers/DiffRenderer.vue'
import SearchRenderer from '../AgentTrace/renderers/SearchRenderer.vue'
import FileRenderer from '../AgentTrace/renderers/FileRenderer.vue'

interface Props {
  selectedNode: DAGNode
  maxOutputLength?: number
}

const props = withDefaults(defineProps<Props>(), {
  maxOutputLength: 600,
})

defineEmits<{
  (e: 'close'): void
}>()

// 移入特定工具识别的计算属性
const selectedToolName = computed(() => {
  return props.selectedNode.kind === 'tool' ? props.selectedNode.toolName : ''
})

const isTerminalTool = computed(() => ['execute_command', 'run_command'].includes(selectedToolName.value))
const isDiffTool = computed(() => ['write_file', 'replace_file_content', 'multi_replace_file_content', 'apply_patch'].includes(selectedToolName.value))
const isFileTool = computed(() => ['read_file', 'view_file'].includes(selectedToolName.value))
const isSearchTool = computed(() => ['google_search', 'web_search'].includes(selectedToolName.value))

const terminalCommand = computed(() => {
  if (props.selectedNode.kind !== 'tool') return ''
  const input = props.selectedNode.input
  if (typeof input === 'string') return input
  if (input && typeof input === 'object') {
    return (input as any).CommandLine || (input as any).command || ''
  }
  return ''
})

const fileInfo = computed(() => {
  if (props.selectedNode.kind !== 'tool') return { filePath: '', fileContent: '' }
  const input = props.selectedNode.input as any
  let filePath = ''
  if (input && typeof input === 'object') {
    filePath = input.path || input.TargetFile || input.AbsolutePath || ''
  }
  let fileContent = ''
  const output = props.selectedNode.output
  if (typeof output === 'string') {
    fileContent = output
  } else if (output && typeof output === 'object') {
    fileContent = (output as any).content || JSON.stringify(output)
  }
  return { filePath, fileContent }
})

const diffInfo = computed(() => {
  if (props.selectedNode.kind !== 'tool') return { filePath: '', diffText: '' }
  const input = props.selectedNode.input as any
  const output = props.selectedNode.output as any
  
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

const formattedInput = computed(() => {
  if (props.selectedNode.kind !== 'tool') return ''
  const input = props.selectedNode.input
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
  if (props.selectedNode.kind !== 'tool') return ''
  const output = props.selectedNode.output
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

const reasoningNode = computed(() => {
  return props.selectedNode.kind === 'reasoning' ? props.selectedNode : null
})

const artifactNode = computed(() => {
  return props.selectedNode.kind === 'artifact' ? props.selectedNode : null
})

const textNode = computed(() => {
  return props.selectedNode.kind === 'text' ? props.selectedNode : null
})

function toggleInput() {
  if (formattedInput.value) {
    isInputCollapsed.value = !isInputCollapsed.value
  }
}

function toggleOutput() {
  const node = props.selectedNode
  const hasError = node.kind === 'tool' && node.errorText
  if (formattedOutput.value || hasError) {
    isOutputCollapsed.value = !isOutputCollapsed.value
  }
}
</script>

<template>
  <div class="dag-inspector-panel">
    <div class="inspector-header">
      <div class="inspector-title-area">
        <span class="inspector-kind-badge" :class="`badge-${selectedNode.kind}`">
          {{ selectedNode.kind.toUpperCase() }}
        </span>
        <h3 class="inspector-title" :title="selectedNode.title">{{ selectedNode.title }}</h3>
      </div>
      <button type="button" class="close-inspector-btn" @click="$emit('close')" title="Close Panel">
        <X class="close-icon" />
      </button>
    </div>

    <div class="inspector-body">
      <!-- 1. reasoning -->
      <div v-if="reasoningNode" class="inspector-reasoning">
        <div class="reasoning-summary-card">
          <div class="card-header">
            <Info class="card-icon" />
            <span>推理概述</span>
          </div>
          <p class="reasoning-summary-text">{{ reasoningNode.summary || '无推理内容' }}</p>
        </div>
      </div>

      <!-- 2. tool -->
      <div v-else-if="selectedNode.kind === 'tool'" class="inspector-tool">
        <!-- 1. 终端渲染器 -->
        <TerminalRenderer 
          v-if="isTerminalTool && (terminalCommand || selectedNode.output || (selectedNode.kind === 'tool' && selectedNode.errorText))"
          :command="terminalCommand"
          :output="selectedNode.output as string"
          :error-text="selectedNode.kind === 'tool' ? selectedNode.errorText : undefined"
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
          <div v-if="formattedOutput || (selectedNode.kind === 'tool' && selectedNode.errorText)" class="panel-section output-section">
            <button type="button" class="section-toggle" @click="toggleOutput">
              <span class="section-title">输出结果</span>
            </button>
            <div class="grid-transition" :class="{ 'is-expanded': !isOutputCollapsed }">
              <div class="grid-transition-inner">
                <div class="section-content">
                  <div v-if="selectedNode.kind === 'tool' && selectedNode.errorText" class="error-panel">
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
      <div v-else-if="artifactNode" class="inspector-artifact">
        <div class="artifact-card">
          <!-- image -->
          <div v-if="artifactNode.artifactType === 'image'" class="artifact-image-wrapper">
            <img :src="artifactNode.url" :alt="artifactNode.caption" class="artifact-image" />
            <p v-if="artifactNode.caption" class="artifact-caption">{{ artifactNode.caption }}</p>
          </div>
          <!-- link -->
          <div v-else-if="artifactNode.artifactType === 'link'" class="artifact-link-wrapper">
            <a :href="artifactNode.url" target="_blank" class="artifact-link">
              <ExternalLink class="link-icon" />
              <span>{{ artifactNode.title || '查看链接' }}</span>
            </a>
            <p v-if="artifactNode.caption" class="artifact-caption">{{ artifactNode.caption }}</p>
          </div>
          <!-- file -->
          <div v-else-if="artifactNode.artifactType === 'file'" class="artifact-file-wrapper">
            <div class="artifact-file-info">
              <FileText class="file-icon" />
              <span class="file-path">{{ artifactNode.url || artifactNode.title || '查看文件' }}</span>
            </div>
            <p v-if="artifactNode.caption" class="artifact-caption">{{ artifactNode.caption }}</p>
          </div>
        </div>
      </div>

      <!-- 4. text -->
      <div v-else-if="textNode" class="inspector-text">
        <div class="text-content-card">
          <p class="text-content-body">{{ textNode.content || '无文本内容' }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
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
  flex-shrink: 0;
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
</style>
