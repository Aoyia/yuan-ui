<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue'
import { mockBasicFlow, mockIntermediateFlow, mockAdvancedFlow } from './mockData'
import { staticSnippets } from './constants/snippets'
import {
  AgentTrace,
  AgentTraceTrigger,
  AgentTraceContent,
  AgentTraceList,
  useAgentTraceStream
} from './components/AgentTrace'
import { Play, RotateCcw, Activity } from '@lucide/vue'

const currentScenario = ref<'basic' | 'intermediate' | 'advanced'>('advanced')
const isStreaming = ref(false)

// 2. 初始化新版 AgentTrace 解析器
const traceParser = useAgentTraceStream()

const chatViewportRef = ref<HTMLElement | null>(null)
const documentViewportRef = ref<HTMLElement | null>(null)

function handleNodeClick(id: string) {
  console.log('Node clicked:', id)
}



// 智能自动滚动锚底：仅在滚动条本来就在底部、或处于流式运行状态时，才追加自动滚动，防止打断浏览器原生 Scroll Anchoring
function scrollToBottom() {
  nextTick(() => {
    if (chatViewportRef.value) {
      const el = chatViewportRef.value
      const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= 15
      if (isAtBottom || isStreaming.value) {
        el.scrollTop = el.scrollHeight
      }
    }
    if (documentViewportRef.value) {
      const el = documentViewportRef.value
      const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= 15
      if (isAtBottom || isStreaming.value) {
        el.scrollTop = el.scrollHeight
      }
    }
  })
}


watch(() => traceParser.content.value, () => scrollToBottom())
watch(() => traceParser.nodes.value.length, () => scrollToBottom())
watch(() => {
  const lastNode = traceParser.nodes.value[traceParser.nodes.value.length - 1]
  if (lastNode?.kind === 'reasoning') return lastNode.summary
  if (lastNode?.kind === 'tool') return String(lastNode.output ?? lastNode.input ?? '')
  return ''
}, () => scrollToBottom())



// 阻塞并等待用户审批的 Promise 控制器
const pendingApproval = ref<{ resolve: (approved: boolean) => void; id: string } | null>(null)

function onUserApprove(nodeId: string) {
  if (pendingApproval.value && pendingApproval.value.id === nodeId) {
    traceParser.handleTraceEvent({ type: 'tool-approval-response', id: nodeId, approved: true })
    pendingApproval.value.resolve(true)
    pendingApproval.value = null
  }
}

function onUserReject(payload: { nodeId: string; reason?: string }) {
  if (pendingApproval.value && pendingApproval.value.id === payload.nodeId) {
    traceParser.handleTraceEvent({ type: 'tool-approval-response', id: payload.nodeId, approved: false, reason: payload.reason })
    pendingApproval.value.resolve(false)
    pendingApproval.value = null
  }
}

function onUserToggleCollapse(nodeId: string) {
  traceParser.handleTraceEvent({ type: 'toggle-collapse', id: nodeId })
}

async function startSimulation() {
  if (isStreaming.value) return
  isStreaming.value = true
  pendingApproval.value = null

  traceParser.reset()
  
  // 根据渐进式场景选择对应的数据流
  let targetFlow = mockAdvancedFlow
  if (currentScenario.value === 'basic') {
    targetFlow = mockBasicFlow
  } else if (currentScenario.value === 'intermediate') {
    targetFlow = mockIntermediateFlow
  }

  for (let i = 0; i < targetFlow.length; i++) {
    if (!isStreaming.value) break // 支持中途打断
    
    const chunk = targetFlow[i]
    
    if (chunk.type === 'tool-approval-request') {
      traceParser.handleTraceEvent(chunk)
      
      // 阻塞循环：等待用户审批
      const approved = await new Promise<boolean>((resolve) => {
        pendingApproval.value = { resolve, id: chunk.id }
      })
      
      if (!approved) {
        // 如果被用户拒绝：我们跳过下一个 chunk (代表工具执行成功的输出)，模拟拒绝分支
        i++
        await new Promise(resolve => setTimeout(resolve, 500))
        continue
      }
      await new Promise(resolve => setTimeout(resolve, 500))
      continue
    }
    
    traceParser.handleTraceEvent(chunk)
    
    // 模拟流式事件输出延迟
    if (chunk.type === 'reasoning-delta' || chunk.type === 'text-delta') {
      await new Promise(resolve => setTimeout(resolve, 15))
    } else if (chunk.type === 'tool-input-start' || chunk.type === 'group-start') {
      await new Promise(resolve => setTimeout(resolve, 600))
    } else if (chunk.type === 'tool-output' || chunk.type === 'group-end') {
      await new Promise(resolve => setTimeout(resolve, 800))
    } else if (chunk.type === 'artifact') {
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }
  isStreaming.value = false
}

function handleReset() {
  isStreaming.value = false
  pendingApproval.value = null
  traceParser.reset()
}

const traceOpen = ref(true)

watch(traceOpen, (newVal) => {
  // 将重置子组折叠的触发时机改为合拢时（newVal === false），在后台看不见时静默完成折叠，避免展开时播放多余的收缩动画
  if (newVal === false) {
    if (!isStreaming.value) {
      traceParser.handleTraceEvent({ type: 'collapse-all-groups' })
    }
  }
  // 彻底移除 else 分支中的 requestAnimationFrame 锁死滚动条行为，允许浏览器底层的原生 scroll-anchoring 发挥作用
})


const activeFileName = computed(() => {
  return staticSnippets[currentScenario.value].fileName
})

const activeCode = computed(() => {
  const rawCode = staticSnippets[currentScenario.value].code
  return rawCode
    .replace(/\\{\\{/g, '{{')
    .replace(/\\}\\}/g, '}}')
})

// 运行时翻译占位符，安全避开预编译扫描
const activeCodeTransformed = computed(() => {
  return activeCode.value
    .replace(/\[TEMPLATE_START\]/g, '<' + 'template>')
    .replace(/\[TEMPLATE_END\]/g, '<' + '/template>')
    .replace(/\[SCRIPT_SETUP\]/g, '<' + 'script setup>')
    .replace(/\[SCRIPT_END\]/g, '<' + '/script>')
})
</script>

<template>
  <div class="demo-workbench">
    <!-- 全局顶栏 Header -->
    <header class="demo-header">
      <div class="header-brand">
        <span class="brand-dot" />
        <span class="brand-text">Yuan UI 智能体工作台</span>
      </div>
      
      <div class="header-actions">
        <!-- 渐进式场景选择器 -->
        <div class="scenario-selector">
          <span class="selector-label">演示场景:</span>
          <div class="selector-options">
            <button 
              type="button" 
              class="selector-opt-btn" 
              :class="{ active: currentScenario === 'basic' }"
              @click="currentScenario = 'basic'"
              :disabled="isStreaming"
            >
              基础思维链
            </button>
            <button 
              type="button" 
              class="selector-opt-btn" 
              :class="{ active: currentScenario === 'intermediate' }"
              @click="currentScenario = 'intermediate'"
              :disabled="isStreaming"
            >
              中阶工具调用
            </button>
            <button 
              type="button" 
              class="selector-opt-btn" 
              :class="{ active: currentScenario === 'advanced' }"
              @click="currentScenario = 'advanced'"
              :disabled="isStreaming"
            >
              高阶智能体 (Cursor)
            </button>
          </div>
        </div>
        
        <div class="button-group">
          <button 
            type="button"
            class="btn-primary" 
            :disabled="isStreaming" 
            @click="startSimulation"
          >
            <Play class="btn-icon" />
            <span>运行模拟</span>
          </button>
          <button 
            type="button"
            class="btn-secondary" 
            @click="handleReset"
          >
            <RotateCcw class="btn-icon" />
            <span>重置</span>
          </button>
        </div>
      </div>
    </header>

    <!-- 主体双栏 Workspace -->
    <div class="workspace">
      <!-- 左栏: 对应模式下的代码演示看板 -->
      <aside class="code-panel">
        <div class="code-tab-header">
          <div class="code-tab-active">
            <span class="file-icon">📄</span>
            <span class="file-name">{{ activeFileName }}</span>
          </div>
        </div>
        <div class="code-viewer-body">
          <pre class="code-editor-pre"><code>{{ activeCodeTransformed }}</code></pre>
        </div>
      </aside>

      <!-- 右栏: Document 预览面板，一体化承载思维链和最终正文 -->
      <main class="preview-panel" ref="documentViewportRef">
        <div class="document-container">
          
          <!-- 1. 新版 AgentTrace 演示（移至右侧大视口上方） -->
          <template v-if="traceParser.nodes.value.length > 0 || traceParser.isStreaming.value">
            <AgentTrace
              v-model:open="traceOpen"
              :is-streaming="traceParser.isStreaming.value"
              :duration="traceParser.duration.value"
              @approve="onUserApprove"
              @reject="onUserReject"
              @toggle-collapse="onUserToggleCollapse"
            >
              <AgentTraceTrigger />
              <AgentTraceContent>
                <AgentTraceList :nodes="traceParser.nodes.value" />
              </AgentTraceContent>
            </AgentTrace>
          </template>


          <!-- 3. 空白就绪占位（无数据且未执行时呈现） -->
          <div v-else class="empty-preview">
            <div class="empty-icon-box">
              <Activity class="empty-icon" />
            </div>
            <p class="empty-title">等待模拟运行</p>
            <p class="empty-desc">点击顶部的“运行模拟”按钮，即可在此查看流式思维轨迹与生成的文档正文。</p>
          </div>

          <!-- 4. Markdown 正文结果（始终呈现在思维链正下方） -->
          <div v-if="traceParser.content.value" class="answer-content">
            <div class="markdown-body">{{ traceParser.content.value }}</div>
          </div>

        </div>
      </main>
    </div>
  </div>
</template>

<style>
/* 极简冷灰全屏 Workbench 美学 */
body {
  background-color: #fafafa;
  color: #1d1d1f;
  margin: 0;
  padding: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  width: 100vw;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  overflow: hidden;
}

.dark body {
  background-color: #09090b;
  color: #f4f4f5;
}

.demo-workbench {
  display: flex;
  flex-direction: column;
  width: 100vw;
  height: 100vh;
  background-color: #ffffff;
  overflow: hidden;
}

.dark .demo-workbench {
  background-color: #09090b;
}

/* 顶栏精致 Header */
.demo-header {
  height: 52px;
  padding: 0 1.5rem;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #ffffff;
  z-index: 100;
  flex-shrink: 0;
  user-select: none;
}

.dark .demo-header {
  border-bottom-color: #27272a;
  background-color: #09090b;
}

.header-brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.brand-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: linear-gradient(135deg, #0071e3 0%, #6366f1 100%);
}

.brand-text {
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: #1d1d1f;
}

.dark .brand-text {
  color: #f4f4f5;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

/* 场景选择器 */
.scenario-selector {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background-color: transparent;
  padding: 0;
  border-radius: 0;
}

.selector-label {
  font-size: 0.72rem;
  font-weight: 500;
  color: #86868b;
  margin-right: 0.15rem;
}

.dark .selector-label {
  color: #71717a;
}

.selector-options {
  display: flex;
  gap: 0.2rem;
}

.selector-opt-btn {
  padding: 0.18rem 0.5rem;
  font-size: 0.7rem;
  font-weight: 500;
  border: none;
  background: transparent;
  color: #86868b;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.15s ease;
  outline: none;
}

.dark .selector-opt-btn {
  color: #a1a1aa;
}

.selector-opt-btn.active {
  background-color: #f1f5f9;
  color: #0071e3;
  box-shadow: none;
  font-weight: 600;
}

.dark .selector-opt-btn.active {
  background-color: #27272a;
  color: #2997ff;
}

.selector-opt-btn:hover:not(.active):not(:disabled) {
  background-color: rgba(0, 0, 0, 0.03);
  color: #1d1d1f;
}

.dark .selector-opt-btn:hover:not(.active):not(:disabled) {
  background-color: rgba(255, 255, 255, 0.03);
  color: #f4f4f5;
}

.selector-opt-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 控制按钮组 */
.button-group {
  display: flex;
  gap: 0.4rem;
}

button {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.28rem 0.65rem;
  border-radius: 6px;
  font-size: 0.72rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  outline: none;
}

.btn-primary {
  background-color: #0071e3;
  color: #fff;
  border: none;
}

.btn-primary:hover:not(:disabled) {
  background-color: #0077ed;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: transparent;
  color: #86868b;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.dark .btn-secondary {
  color: #a1a1aa;
  border-color: rgba(255, 255, 255, 0.08);
}

.btn-secondary:hover {
  background: rgba(0, 0, 0, 0.02);
  color: #1d1d1f;
}

.dark .btn-secondary:hover {
  background: rgba(255, 255, 255, 0.02);
  color: #f4f4f5;
}

.btn-icon {
  width: 0.75rem;
  height: 0.75rem;
}

/* 双栏布局主体 */
.workspace {
  display: flex;
  flex: 1;
  height: calc(100vh - 52px);
  overflow: hidden;
}

/* 左侧代码演示看板 (Code Panel) */
.code-panel {
  width: 420px; /* 拓宽左侧代码阅读空间 */
  border-right: 1px solid #f1f5f9;
  background-color: #0b0f19; /* 采用与终端一致的极客夜色暗黑底 */
  display: flex;
  flex-direction: column;
  overflow: hidden;
  flex-shrink: 0;
}

.dark .code-panel {
  border-right-color: #27272a;
  background-color: #09090b;
}

/* 页签栏 */
.code-tab-header {
  height: 34px;
  background-color: #070a12;
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
  display: flex;
  align-items: center;
  padding: 0 1rem;
  flex-shrink: 0;
  user-select: none;
}

.code-tab-active {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  height: 100%;
  border-bottom: 2px solid #0071e3;
  padding: 0 0.25rem;
}

.file-icon {
  font-size: 0.72rem;
}

.file-name {
  font-size: 0.72rem;
  font-weight: 600;
  color: #e2e8f0;
  font-family: ui-monospace, monospace;
}

/* 代码主体区域 */
.code-viewer-body {
  flex: 1;
  overflow: auto;
  padding: 1.25rem 1rem;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.05) transparent;
}

.code-viewer-body::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}

.code-viewer-body::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.06);
  border-radius: 99px;
}

.code-editor-pre {
  margin: 0;
  padding: 0;
  background: transparent;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.72rem;
  line-height: 1.55;
  color: #e2e8f0; /* 白亮字 */
  white-space: pre;
  animation: code-fade-in 0.25s ease;
}

@keyframes code-fade-in {
  from { opacity: 0; transform: translateY(2px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 右侧预览主面板 */
.preview-panel {
  flex: 1;
  background-color: #fafafa;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.04) transparent;
}

.dark .preview-panel {
  background-color: #09090b;
}

.preview-panel::-webkit-scrollbar {
  width: 4px;
}

.preview-panel::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.04);
  border-radius: 99px;
}

.dark .preview-panel::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.04);
}

.document-container {
  max-width: 680px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
  min-height: 100%;
  display: flex;
  flex-direction: column;
}

/* 空白占位 */
.empty-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: auto 0;
  text-align: center;
  color: #86868b;
  animation: yuan-fade-in 0.35s ease;
}

.empty-icon-box {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  border: 1px dashed rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.85rem;
  color: #86868b;
}

.dark .empty-icon-box {
  border-color: rgba(255, 255, 255, 0.08);
  color: #71717a;
}

.empty-icon {
  width: 18px;
  height: 18px;
}

.empty-title {
  font-size: 0.82rem;
  font-weight: 600;
  color: #1d1d1f;
  margin: 0 0 0.2rem 0;
}

.dark .empty-title {
  color: #f4f4f5;
}

.empty-desc {
  font-size: 0.7rem;
  color: #86868b;
  max-width: 280px;
  line-height: 1.4;
  margin: 0;
}

.dark .empty-desc {
  color: #71717a;
}

/* 自然文字流渐入 */
.answer-content {
  animation: yuan-fade-in 0.28s ease;
  width: 100%;
}

@keyframes yuan-fade-in {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

.markdown-body {
  font-size: 0.88rem;
  line-height: 1.55;
  color: #1d1d1f;
}

.dark .markdown-body {
  color: #e4e4e7;
}

.dag-playground-wrapper {
  width: 100%;
  max-height: 600px;
  overflow: auto;
  border-radius: 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  margin-bottom: 1.5rem;
  box-sizing: border-box;
}

.dark .dag-playground-wrapper {
  background: #09090b;
  border-color: #27272a;
}

</style>
