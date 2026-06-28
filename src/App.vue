<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import {
  ChainOfThought,
  ChainOfThoughtHeader,
  ChainOfThoughtContent,
  ChainOfThoughtRenderer,
  useAgentStreamParser
} from './components/ChainOfThought'
import {
  AgentTrace,
  AgentTraceTrigger,
  AgentTraceContent,
  AgentTraceList,
  useAgentTraceStream
} from './components/AgentTrace'
import { Play, RotateCcw, Activity, ShieldCheck } from '@lucide/vue'

const activeTab = ref<'trace' | 'legacy'>('trace')
const isStreaming = ref(false)

// 1. 初始化旧版 CoT 解析器
const legacyParser = useAgentStreamParser()

// 2. 初始化新版 AgentTrace 解析器
const traceParser = useAgentTraceStream()

const chatViewportRef = ref<HTMLElement | null>(null)

// 自动滚动锚底逻辑
function scrollToBottom() {
  nextTick(() => {
    if (chatViewportRef.value) {
      chatViewportRef.value.scrollTo({
        top: chatViewportRef.value.scrollHeight,
        behavior: 'smooth'
      })
    }
  })
}

// 监听内容与节点的变化进行滚动
watch(() => legacyParser.content.value, () => scrollToBottom())
watch(() => legacyParser.nodes.value.length, () => scrollToBottom())
watch(() => legacyParser.nodes.value[legacyParser.nodes.value.length - 1]?.content, () => scrollToBottom())
watch(() => legacyParser.nodes.value[legacyParser.nodes.value.length - 1]?.toolCall?.output, () => scrollToBottom())

watch(() => traceParser.content.value, () => scrollToBottom())
watch(() => traceParser.nodes.value.length, () => scrollToBottom())
watch(() => {
  const lastNode = traceParser.nodes.value[traceParser.nodes.value.length - 1]
  if (lastNode?.kind === 'reasoning') return lastNode.summary
  if (lastNode?.kind === 'tool') return String(lastNode.output ?? lastNode.input ?? '')
  return ''
}, () => scrollToBottom())

// 旧版数据流模拟
const mockLegacyFlow = [
  { type: 'thought', delta: "正在分析用户的问题，以确认 Vue 3 对话式组件库的升级与流式渲染设计。我需要查阅现有的 chain-of-thought 开源实现..." },
  { type: 'tool_call', toolName: 'google_search' },
  {
    type: 'tool_output',
    delta: '已搜索到相关文档',
    searchResults: [
      { title: "Vue 3 组合式 API 指南", url: "https://vuejs.org" },
      { title: "Collapsible 展开动画最佳实践", url: "https://reka-ui.com" },
      { title: "高性能 Markdown 渲染算法", url: "https://markstream.vue" }
    ]
  },
  { type: 'thought', delta: "\n\n已经定位到了 Collapsible 和流式 markdown 的渲染标准。为了进行打包适配，我需要进一步调研本地项目的编译器配置以确认其能够兼容 Vue 3 SFC..." },
  { type: 'tool_call', toolName: 'read_file', filePath: 'vite.config.js' },
  { type: 'tool_output', delta: '文件读取成功。' },
  { type: 'thought', delta: "\n\nVite 配置确认完毕。在重构入口文件前，我必须在本地终端执行构建命令，以验证打包后的打包物体积及样式表无语法错误..." },
  { type: 'tool_call', toolName: 'execute_command', command: 'npm run build', toolId: 'cmd-build' },
  {
    type: 'tool_output',
    toolId: 'cmd-build',
    delta: `vite v5.4.21 building for production...
transforming...
✓ 28 modules transformed.
dist/style.css       4.48 kB │ gzip: 1.37 kB
dist/yuan-ui.es.js   8.52 kB │ gzip: 2.94 kB
✓ built in 215ms`
  },
  { type: 'thought', delta: "\n\n系统构建完成且无报错。为了让用户更清晰地了解本套 Agent 架构的数据流，我 design 了一张架构流程配图..." },
  {
    type: 'image',
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    imageCaption: '图 1: 数据驱动型 Agent 状态流与 Timeline 渲染架构'
  },
  { type: 'thought', delta: "\n\n所有调研和编译测试已完成，逻辑闭环，现在输出正式的系统改造指南。" },
  { content: "# 智能体多轮调研与思考渲染架构\n\n" },
  { content: "我们已成功实现了一套完全由数据驱动的、能够承载 **Agent 多轮工具调用与思考链交织**的 Timeline 混合渲染器。\n\n" },
  { content: "## 本套数据驱动设计的核心点\n\n" },
  { content: "1. **原子节点数据结构 (types.ts)**：所有的思考、工具调用（入参/执行中/已完成/返回网页）、终端输出、图像生成均被抽象为响应式的 `AgentStepNode` 原子。无论工具链路多么错综复杂，前端都只需要维护一个扁平的节点列表，由列表状态实时驱动 UI 渲染。\n" },
  { content: "2. **混合渲染引擎 (ChainOfThoughtRenderer)**：通过动态模板分发，在一个 Timeline 节点内智能匹配不同的工具调用详情，无需在页面编写繁琐的条件分支。\n" },
  { content: "3. **高阶视觉与物理效果**：\n" },
  { content: "   - 处于历史状态 of 节点文字与勾图标自动平滑暗淡，降低视觉杂噪，聚焦 active 步骤。\n" },
  { content: "   - 超长 Timeline 在 `ChainOfThoughtContent` 中具有 `max-height` 限制与隐藏极窄滑动条，支持局部滚动，防止页面爆表。\n" },
  { content: "   - 思考链整体具有自动延时收折动效，正文开始输出后 1.2 秒自动滑出淡出闭合。\n\n" },
  { content: "这套架构不仅在体验上极具 Apple 的物理质感，而且在代码设计上面向未来的复杂智能体交互，具有强大的拓展性！" }
]

// 新版数据流模拟
const mockTraceFlow: any[] = [
  { type: 'reasoning-delta', delta: "正在分析用户的问题，以确认 Vue 3 对话式组件库的升级与流式渲染设计。我需要查阅现有的 chain-of-thought 开源实现..." },
  { type: 'tool-input-start', id: 'search-1', toolName: 'google_search', title: '执行 Google 搜索' },
  { type: 'tool-output', id: 'search-1', output: [
    { title: "Vue 3 组合式 API 指南", url: "https://vuejs.org" },
    { title: "Collapsible 展开动画最佳实践", url: "https://reka-ui.com" },
    { title: "高性能 Markdown 渲染算法", url: "https://markstream.vue" }
  ]},
  { type: 'reasoning-delta', delta: '\n\n已经定位到了 Collapsible 和流式 markdown 的渲染标准。为了进行打包适配，我需要进一步调研本地项目的编译器配置以确认其能够兼容 Vue 3 SFC...' },
  { type: 'tool-input-start', id: 'file-1', toolName: 'read_file', title: '读取本地配置文件', input: { path: 'vite.config.js' } },
  { type: 'tool-output', id: 'file-1', output: '文件读取成功。' },
  { type: 'reasoning-delta', delta: '\n\nVite 配置确认完毕。在重构入口文件前，我必须在本地终端执行构建命令，以验证打包后的打包物体积及样式表无语法错误...' },
  { type: 'tool-input-start', id: 'cmd-1', toolName: 'execute_command', title: '执行编译命令' },
  { type: 'tool-input-delta', id: 'cmd-1', inputDelta: 'npm run build' },
  { type: 'tool-output', id: 'cmd-1', output: `vite v5.4.21 building for production...\ntransforming...\n✓ 28 modules transformed.\ndist/style.css       4.48 kB │ gzip: 1.37 kB\ndist/yuan-ui.es.js   8.52 kB │ gzip: 2.94 kB\n✓ built in 215ms` },
  { type: 'reasoning-delta', delta: '\n\n系统构建完成且无报错。为了让用户更清晰地了解本套 Agent 架构的数据流，我设计了一张架构流程配图...' },
  { type: 'artifact', id: 'art-1', artifactType: 'image', title: '生成多模态配图', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80', caption: '图 1: 数据驱动型 Agent 状态流与 Timeline 渲染架构' },
  { type: 'reasoning-delta', delta: '\n\n所有调研和编译测试已完成，逻辑闭环，现在输出正式的系统改造指南。' },
  { type: 'text-delta', delta: "# 智能体多轮调研与思考渲染架构\n\n" },
  { type: 'text-delta', delta: "我们已成功实现了一套完全由数据驱动的、能够承载 **Agent 多轮工具调用与思考链交织**的 Timeline 混合渲染器。\n\n" },
  { type: 'text-delta', delta: "## 本套数据驱动设计的核心点\n\n" },
  { type: 'text-delta', delta: "1. **原子节点数据结构 (types.ts)**：所有的思考、工具调用（入参/执行中/已完成/返回网页）、终端输出、图像生成均被抽象为响应式的 `AgentStepNode` 原子。无论工具链路多么错综复杂，前端都只需要维护一个扁平的节点列表，由列表状态实时驱动 UI 渲染。\n" },
  { type: 'text-delta', delta: "2. **混合渲染引擎 (AgentTrace)**：通过动态模板分发，在一个 Timeline 节点内智能匹配不同的工具调用详情，无需在页面编写繁琐的条件分支。\n" },
  { type: 'text-delta', delta: "3. **高阶视觉与物理效果**：\n" },
  { type: 'text-delta', delta: "   - 处于历史状态的节点文字与勾图标自动平滑暗淡，降低视觉杂噪，聚焦 active 步骤。\n" },
  { type: 'text-delta', delta: "   - 超长 Timeline 在 `AgentTraceContent` 中具有 `max-height` 限制与极窄滚动条，支持局部滚动，防止页面爆表。\n" },
  { type: 'text-delta', delta: "   - 思考链整体具有自动延时收折动效，当 `isStreaming` 结束后会自动延迟折叠，顺滑视线。\n\n" },
  { type: 'text-delta', delta: "这套架构不仅在体验上极具 Apple 的物理质感，而且在代码设计上面向未来的复杂智能体交互，具有强大的拓展性！" },
  { type: 'finish' }
]

async function startSimulation() {
  if (isStreaming.value) return
  isStreaming.value = true

  if (activeTab.value === 'trace') {
    traceParser.reset()
    for (const chunk of mockTraceFlow) {
      traceParser.handleTraceEvent(chunk)
      // 模拟事件的流式输出延迟
      if (chunk.type === 'reasoning-delta' || chunk.type === 'text-delta') {
        await new Promise(resolve => setTimeout(resolve, 15))
      } else if (chunk.type === 'tool-input-start') {
        await new Promise(resolve => setTimeout(resolve, 600))
      } else if (chunk.type === 'tool-output') {
        await new Promise(resolve => setTimeout(resolve, 800))
      } else if (chunk.type === 'artifact') {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }
  } else {
    legacyParser.reset()
    for (const chunk of mockLegacyFlow) {
      if (chunk.type) {
        const type = chunk.type as any
        if (type === 'tool_call') {
          legacyParser.handleAgentChunk(chunk as any)
          await new Promise(resolve => setTimeout(resolve, 600))
        } else if (type === 'tool_output') {
          legacyParser.handleAgentChunk({ type: 'tool_output', toolId: chunk.toolId, delta: chunk.delta, searchResults: chunk.searchResults })
          await new Promise(resolve => setTimeout(resolve, 600))
        } else if (type === 'image') {
          legacyParser.handleAgentChunk(chunk as any)
          await new Promise(resolve => setTimeout(resolve, 500))
        } else {
          const text = chunk.delta || ''
          const chars = text.split('')
          for (const char of chars) {
            legacyParser.handleAgentChunk({ type: 'thought', delta: char })
            await new Promise(resolve => setTimeout(resolve, 10))
          }
        }
      } else if (chunk.content) {
        const text = chunk.content
        const chars = text.split('')
        for (const char of chars) {
          legacyParser.handleAgentChunk({ type: 'content', delta: char })
          await new Promise(resolve => setTimeout(resolve, 10))
        }
      }
    }
  }
  isStreaming.value = false
}

function handleReset() {
  isStreaming.value = false
  traceParser.reset()
  legacyParser.reset()
}

const traceOpen = ref(true)
const legacyOpen = ref(true)
</script>

<template>
  <div class="demo-container">
    <!-- Tab 导航 & 控制面板 -->
    <header class="demo-control-panel">
      <div class="nav-tabs">
        <button
          type="button"
          class="tab-btn"
          :class="{ active: activeTab === 'trace' }"
          @click="activeTab = 'trace'"
          :disabled="isStreaming"
        >
          <ShieldCheck class="tab-icon" />
          <span>新版 AgentTrace</span>
        </button>
        <button
          type="button"
          class="tab-btn"
          :class="{ active: activeTab === 'legacy' }"
          @click="activeTab = 'legacy'"
          :disabled="isStreaming"
        >
          <Activity class="tab-icon" />
          <span>旧版 CoT 兼容</span>
        </button>
      </div>

      <h1 class="panel-title">Yuan UI 智能体执行轨迹 (Agent CoT) 调试</h1>
      
      <div class="button-group">
        <button 
          class="btn-primary" 
          :disabled="isStreaming" 
          @click="startSimulation"
        >
          <Play class="btn-icon" />
          <span>开始模拟流式执行</span>
        </button>
        <button 
          class="btn-secondary" 
          @click="handleReset"
        >
          <RotateCcw class="btn-icon" />
          <span>重置</span>
        </button>
      </div>
    </header>

    <!-- 主对话渲染区 (支持滚动) -->
    <main class="chat-viewport" ref="chatViewportRef">
      <div class="chat-bubble assistant-bubble">
        
        <!-- 方案 1: 新版 AgentTrace 组件 -->
        <template v-if="activeTab === 'trace'">
          <AgentTrace
            v-model:open="traceOpen"
            :is-streaming="traceParser.isStreaming.value"
            :duration="traceParser.duration.value"
          >
            <AgentTraceTrigger />
            <AgentTraceContent>
              <AgentTraceList :nodes="traceParser.nodes.value" />
            </AgentTraceContent>
          </AgentTrace>

          <div v-if="traceParser.content.value" class="answer-content">
            <div class="markdown-body">{{ traceParser.content.value }}</div>
          </div>
        </template>

        <!-- 方案 2: 旧版 ChainOfThought 兼容模式 -->
        <template v-else>
          <ChainOfThought 
            v-model:open="legacyOpen"
            :is-thinking="legacyParser.isThinking.value"
            :auto-close="true"
          >
            <ChainOfThoughtHeader>
              <span v-if="legacyParser.isThinking.value">正在深度调研并执行多轮工具...</span>
              <span v-else-if="legacyParser.totalDuration.value > 0">智能体执行完毕 (用时 {{ legacyParser.totalDuration.value }} 秒)</span>
              <span v-else>多轮执行状态 (Agent CoT)</span>
            </ChainOfThoughtHeader>
            <ChainOfThoughtContent>
              <!-- 兼容包装器，内部调用 AgentTraceList -->
              <ChainOfThoughtRenderer :nodes="legacyParser.nodes.value" />
            </ChainOfThoughtContent>
          </ChainOfThought>

          <div v-if="legacyParser.content.value" class="answer-content">
            <div class="markdown-body">{{ legacyParser.content.value }}</div>
          </div>
        </template>

      </div>
    </main>
  </div>
</template>

<style>
/* 全局页面美化 */
body {
  background-color: #f5f5f7;
  color: #1d1d1f;
  margin: 0;
  padding: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}

.demo-container {
  width: 90%;
  max-width: 760px;
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 20px;
  box-shadow: 0 8px 30px rgba(0,0,0,0.08);
  border: 1px solid rgba(255,255,255,0.4);
  overflow: hidden;
}

/* 控制面板样式 */
.demo-control-panel {
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.5);
  border-bottom: 1px solid rgba(0,0,0,0.05);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.nav-tabs {
  display: flex;
  background-color: #e3e3e7;
  padding: 2px;
  border-radius: 9px;
  width: fit-content;
}

.tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  border: none;
  background: transparent;
  border-radius: 7px;
  font-size: 0.8125rem;
  font-weight: 500;
  color: #636366;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab-btn.active {
  background: #fff;
  color: #1c1c1e;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.tab-icon {
  width: 0.875rem;
  height: 0.875rem;
}

.panel-title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1d1d1f;
}

.button-group {
  display: flex;
  gap: 0.75rem;
}

button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
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
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #fff;
  color: #1d1d1f;
  border: 1px solid #d2d2d7;
}

.btn-secondary:hover {
  background: #f5f5f7;
}

.btn-icon {
  width: 0.875rem;
  height: 0.875rem;
}

/* 对话区样式 */
.chat-viewport {
  padding: 2rem;
  height: 480px;
  overflow-y: auto;
  background-color: rgba(250,250,252,0.3);
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.08) transparent;
  -webkit-overflow-scrolling: touch;
}

.chat-viewport::-webkit-scrollbar {
  width: 5px;
}

.chat-viewport::-webkit-scrollbar-track {
  background: transparent;
}

.chat-viewport::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.08);
  border-radius: 9999px;
}

.chat-viewport:hover::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.15);
}

.chat-bubble {
  background: #fff;
  border-radius: 16px;
  padding: 1.25rem;
  box-shadow: 0 4px 20px rgba(0,0,0,0.03);
  border: 1px solid rgba(0,0,0,0.03);
}

/* 正文部分 */
.answer-content {
  margin-top: 1.25rem;
  padding-top: 1.25rem;
  border-top: 1px dashed #e5e7eb;
}

.markdown-body {
  font-size: 0.9375rem;
  line-height: 1.6;
  white-space: pre-wrap;
}
</style>
