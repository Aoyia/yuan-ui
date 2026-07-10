<script setup lang="ts">
import { ref, watch, nextTick, computed, onMounted, onActivated } from 'vue'
import {
  AsThoughtChain,
  AsThoughtChainTrigger,
  AsThoughtChainContent,
  AsThoughtChainList,
  useAsThoughtChainStream
} from '../../src/index'
import { Play, RotateCcw, Activity, FileText } from '@lucide/vue'
import { useSimulator } from '../hooks/useSimulator'
import { staticSnippets } from '../snippets'

const currentScenario = ref<'basic' | 'intermediate' | 'advanced'>('advanced')

// 1. 初始化新版 AsThoughtChain 解析器
const traceParser = useAsThoughtChainStream()

// 2. 引入模拟器 Engine 核心逻辑
const {
  isStreaming,
  onUserApprove,
  onUserReject,
  onUserToggleCollapse,
  startSimulation,
  handleReset
} = useSimulator(traceParser)

const chatViewportRef = ref<HTMLElement | null>(null)
const documentViewportRef = ref<HTMLElement | null>(null)

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

const traceOpen = ref(true)

watch(traceOpen, (newVal) => {
  // 将重置子组折叠的触发时机改为合拢时（newVal === false），在后台看不见时静默完成折叠，避免展开时播放多余的收缩动画
  if (newVal === false) {
    if (!isStreaming.value) {
      traceParser.handleTraceEvent({ type: 'collapse-all-groups' })
    }
  }
})

let hasMounted = false

onMounted(() => {
  hasMounted = true
  nextTick(() => {
    // 延迟 150ms 等待 Tab Transition 渐变完成并稳定，保障吸底计算高度正确
    setTimeout(() => {
      startSimulation(currentScenario.value)
    }, 150)
  })
})

onActivated(() => {
  if (!hasMounted) return
  nextTick(() => {
    setTimeout(() => {
      startSimulation(currentScenario.value)
    }, 150)
  })
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
  <!-- 左栏: Monaco 风格 Mock 代码面板 -->
  <aside class="code-panel">
    <div class="code-tab-header">
      <div class="code-tab-active" style="display: flex; align-items: center; gap: 6px;">
        <FileText class="file-icon" style="width: 14px; height: 14px; color: var(--yuan-primary);" />
        <span class="file-name">{{ activeFileName }}</span>
      </div>
    </div>
    <div class="code-viewer-body">
      <pre class="code-editor-pre"><code>{{ activeCodeTransformed }}</code></pre>
    </div>
  </aside>

  <!-- 右栏: Document 预览面板 -->
  <main class="preview-panel" ref="documentViewportRef">
    <!-- 局部模拟控制条 -->
    <div class="preview-header-bar">
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
          @click="startSimulation(currentScenario)"
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

    <div class="document-container">
      <!-- 1. 新版 AsThoughtChain 演示 -->
      <template v-if="traceParser.nodes.value.length > 0 || traceParser.isStreaming.value">
        <AsThoughtChain
          v-model:open="traceOpen"
          :is-streaming="traceParser.isStreaming.value"
          :duration="traceParser.duration.value"
          @approve="onUserApprove"
          @reject="onUserReject"
          @toggle-collapse="onUserToggleCollapse"
        >
          <AsThoughtChainTrigger />
          <AsThoughtChainContent>
            <AsThoughtChainList :nodes="traceParser.nodes.value" />
          </AsThoughtChainContent>
        </AsThoughtChain>
      </template>

      <!-- 3. 空白就绪占位 -->
      <div v-else class="empty-preview">
        <div class="empty-icon-box">
          <Activity class="empty-icon" />
        </div>
        <p class="empty-title">等待模拟运行</p>
        <p class="empty-desc">点击上方的“运行模拟”按钮，即可在此查看流式思维轨迹与生成的文档正文。</p>
      </div>

      <!-- 4. Markdown 正文结果 -->
      <div v-if="traceParser.content.value" class="answer-content">
        <div class="markdown-body">{{ traceParser.content.value }}</div>
      </div>
    </div>
  </main>
</template>
