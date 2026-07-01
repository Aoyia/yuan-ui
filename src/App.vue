<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue'
import {
  AgentTrace,
  AgentTraceTrigger,
  AgentTraceContent,
  AgentTraceList,
  useAgentTraceStream
} from './components/AgentTrace'
import { AgentTraceDAG } from './components/AgentTraceDAG'
import { Play, RotateCcw, Activity, ShieldCheck } from '@lucide/vue'

const activeTab = ref<'trace' | 'traceDAG'>('trace')
const currentScenario = ref<'basic' | 'intermediate' | 'advanced'>('advanced')
const isStreaming = ref(false)

// 2. 初始化新版 AgentTrace 解析器
const traceParser = useAgentTraceStream()

const chatViewportRef = ref<HTMLElement | null>(null)
const documentViewportRef = ref<HTMLElement | null>(null)

function handleNodeClick(id: string) {
  console.log('Node clicked:', id)
}

function handleNodeFork(id: string, instruction: string) {
  if (isStreaming.value) return
  isStreaming.value = true
  
  // 查找在 id 之后生成的子孙节点，把它们的状态置为 'pruned'
  const descendants = new Set<string>()
  const queue = [id]
  while (queue.length > 0) {
    const currId = queue.shift()!
    traceParser.state.value.nodes.forEach(n => {
      if (n.parentId === currId && !descendants.has(n.id)) {
        descendants.add(n.id)
        queue.push(n.id)
      }
    })
  }

  // 1. 把所有子孙节点状态强置为 'pruned'
  traceParser.state.value.nodes.forEach(n => {
    if (descendants.has(n.id)) {
      n.status = 'pruned'
    }
  })

  // 2. 向分叉节点派发一个新的分支推理
  const newForkId = 'fork-' + Math.random().toString(36).substring(2, 9)
  traceParser.handleTraceEvent({
    type: 'reasoning-delta',
    id: newForkId,
    parentId: id,
    title: '调整决策分支...',
    delta: `[时空分叉指令]: ${instruction}\n正在重定向逻辑，尝试使用新的测试脚本...`
  })

  // 模拟一段时间后，分支思考完成并开启了新的 tool 任务
  setTimeout(() => {
    traceParser.handleTraceEvent({
      type: 'reasoning-delta',
      id: newForkId,
      delta: '\n\n重定向成功。开始执行新方案的测试。'
    })
    
    // 派发一个新 tool 节点
    const newToolId = 'tool-' + Math.random().toString(36).substring(2, 9)
    traceParser.handleTraceEvent({
      type: 'tool-input-start',
      id: newToolId,
      parentId: newForkId,
      toolName: 'execute_command',
      title: '执行新测试脚本',
      input: { command: 'npm run test:fast' }
    })
    
    // 审批拦截... 或者直接执行成功
    setTimeout(() => {
      traceParser.handleTraceEvent({
        type: 'tool-output',
        id: newToolId,
        output: '[SUCCESS] 新分支测试全部通过。任务成功回滚闭环。'
      })
      // 结束流
      traceParser.handleTraceEvent({
        type: 'finish'
      })
      isStreaming.value = false
    }, 1200)
  }, 1500)
}

// 自动滚动锚底逻辑
function scrollToBottom() {
  nextTick(() => {
    if (chatViewportRef.value) {
      chatViewportRef.value.scrollTop = chatViewportRef.value.scrollHeight
    }
    if (documentViewportRef.value) {
      documentViewportRef.value.scrollTop = documentViewportRef.value.scrollHeight
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


// 1. 基础版本演示数据：纯推理思维链
const mockBasicFlow = [
  { type: 'reasoning-delta', delta: '正在接收并分析用户提出的工程化重构诉求：对标大厂品质开源组件库...' },
  { type: 'reasoning-delta', delta: '\n\n经过对 Vue 3 社区的横向比对，优秀开源组件库的工程骨架一般包含：自动声明文件编译（vite-plugin-dts）、全局 CSS 变量主题底座、Husky 提交校验。' },
  { type: 'reasoning-delta', delta: '\n\n为了保障文档站的极速响应与良好的 Live 演示交互，使用 VitePress 是性价比最高的策略。我们只需要在其基础上对其进行 Layout 换头，即可获得 Arco 级别的颜值。' },
  { type: 'reasoning-delta', delta: '\n\n分析完毕，下面给出基本的重构核心路线说明。' },
  { type: 'text-delta', delta: "# 基础思维链演示完成\n\n通过该基础流，你可以看到 `AgentTrace` 能够完美实现流式 Reasoning Deltas 的打字机追加以及思考完成状态的过渡。" },
  { type: 'finish' }
]

// 2. 中级版本演示数据：包含基本工具调用（回退到 JSON 折叠渲染）
const mockIntermediateFlow = [
  { type: 'reasoning-delta', delta: '正在为您扫描当前项目依赖包情况，我需要读取本地包描述文件 package.json...' },
  { type: 'tool-input-start', id: 'file-package', toolName: 'read_package_json', title: '读取 package.json 文件', input: { path: 'package.json' } },
  { type: 'tool-output', id: 'file-package', output: { name: 'yuan-ui', version: '0.1.0', dependencies: { vue: '^3.4.0', '@vueuse/core': '^10.9.0' } } },
  { type: 'reasoning-delta', delta: '\n\n读取包配置成功。Vue 版本为 3.4.0。为了保障组件库强类型支持，我需要进一步确认本地的打包输出路径...' },
  { type: 'tool-input-start', id: 'dist-check', toolName: 'check_dist_dir', title: '检查 dist 目标目录', input: { mode: 'check-exist' } },
  { type: 'tool-output', id: 'dist-check', output: { exists: true, filesCount: 3, totalBytes: 11860 } },
  { type: 'reasoning-delta', delta: '\n\n环境检测全部通过，我已将项目状态整理就绪。' },
  { type: 'text-delta', delta: "## 中阶工具链演示总结\n\n在中阶演示中，我们成功调用了两个自定义工具。因为这两个工具不属于组件库默认的高频特化工具，`AgentTrace` 自动启用 **JSON Fallback 折叠渲染器**。你可以点击组件上方的 `输入参数` 与 `输出结果` 查看折叠缓动。" },
  { type: 'finish' }
]

// 3. 高阶版本演示数据：包含 Group 嵌套、同级渐进收缩、文件 Diff、敏感操作审批确权拦截、暗黑 Terminal 显色
const mockAdvancedFlow: any[] = [
  // --- 第一阶段：大 Group 1 ---
  { type: 'group-start', id: 'g-env', title: '第一阶段：环境调研与扫描' },
  
  { type: 'reasoning-delta', id: 'r-1', delta: '为了重构出具有 CodeX 和 Cursor 级别的嵌套思维链，我需要先对多级树形 Timeline 和滚动渐进折叠策略做可行性调研。', parentId: 'g-env' },
  
  // 1-1 子 Group
  { type: 'group-start', id: 'g-search', title: '流式折叠技术规范调研', parentId: 'g-env' },
  { type: 'tool-input-start', id: 'search-1', toolName: 'google_search', title: '调研 Web 树形 Timeline 设计', parentId: 'g-search' },
  { type: 'tool-output', id: 'search-1', output: [
    { title: "Vue 3 组合式 API 高阶用法与实践", url: "https://vuejs.org", snippet: "本指南介绍如何利用 inject/provide 及递归挂载，优雅开发具有树形层级连接线的 Timeline 混合折叠组件。" },
    { title: "ChatGPT o1 思维链折叠机制解析", url: "https://openai.com", snippet: "o1 在流式生成步骤时，会把已完成的大步骤自动折叠，仅保留当前的活跃大组展开，降低大量日志对屏幕空间占用的负担。" }
  ]},
  { type: 'group-end', id: 'g-search' },
  
  // 1-2 子 Group 开启（此时同属于 g-env 的前一个子 Group g-search 应当自动渐进式收纳折叠！）
  { type: 'group-start', id: 'g-read-conf', title: '验证本地打包器环境', parentId: 'g-env' },
  { type: 'tool-input-start', id: 'file-1', toolName: 'read_file', title: '读取本地配置文件 vite.config.js', input: { path: 'vite.config.js' }, parentId: 'g-read-conf' },
  { type: 'tool-output', id: 'file-1', output: `import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
export default defineConfig({
  plugins: [vue()]
})` },
  { type: 'group-end', id: 'g-read-conf' },
  
  { type: 'group-end', id: 'g-env' }, // 第一阶段大 Group 结束
  
  // --- 第二阶段：大 Group 2 开启（此时顶级层级中，前一个大 Group g-env 会自动整组收缩隐藏，完美移动焦点！）
  { type: 'group-start', id: 'g-refactor', title: '第二阶段：智能体组件重构' },
  
  // 2-1 子 Group
  { type: 'group-start', id: 'g-patch', title: '重构库组件入口导出', parentId: 'g-refactor' },
  { type: 'tool-input-start', id: 'diff-1', toolName: 'replace_file_content', title: '追加组件树导出', parentId: 'g-patch' },
  { type: 'tool-output', id: 'diff-1', output: `@@ -1,3 +1,5 @@
 export * from './components/ChainOfThought'
+export { default as AgentTrace } from './components/AgentTrace/AgentTrace.vue'
+export { default as GroupTraceNode } from './components/AgentTrace/renderers/GroupTraceNode.vue'
` },
  { type: 'group-end', id: 'g-patch' },
  
  // 2-2 子 Group（高危清理操作，包含审批拦截）
  { type: 'group-start', id: 'g-approve', title: '敏感构建目录清理', parentId: 'g-refactor' },
  { type: 'tool-input-start', id: 'approve-demo', toolName: 'execute_command', title: '清空编译输出目录 dist/', input: { command: 'rm -rf dist/' }, parentId: 'g-approve' },
  { type: 'tool-approval-request', id: 'approve-demo' },
  { type: 'tool-output', id: 'approve-demo', output: '\x1b[32m[SUCCESS] 成功清除构建缓存目录: dist/\x1b[0m' },
  { type: 'group-end', id: 'g-approve' },

  // 2-3 子 Group（打包测试，暗黑终端渲染，带 ANSI 颜色）
  { type: 'group-start', id: 'g-build', title: '编译器打包构建与校验', parentId: 'g-refactor' },
  { type: 'tool-input-start', id: 'cmd-build-new', toolName: 'execute_command', title: '执行打包构建', input: { command: 'npm run build' }, parentId: 'g-build' },
  { type: 'tool-output', id: 'cmd-build-new', output: `\x1B[90mvite v5.4.21 building for production...\x1B[0m
\x1B[32m✓ 34 modules transformed.\x1B[0m
\x1B[36mdist/yuan-ui.es.js   12.45 kB │ gzip: 4.12 kB\x1B[0m
\x1B[32;1m[SUCCESS] 打包库编译完成，无任何警告。\x1B[0m` },
  { type: 'group-end', id: 'g-build' },
  
  { type: 'group-end', id: 'g-refactor' }, // 第二阶段大 Group 结束
  
  // 最终 Markdown 文本输出
  { type: 'text-delta', delta: "# 智能体多级 Grouping 与渐进收缩折叠报告\n\n" },
  { type: 'text-delta', delta: "我们已经在优化后，让 `AgentTrace` 成功具备了类似 **ChatGPT (o1) 与 CodeX 级别**的思维链特质，包含两大革命性提升：\n\n" },
  { type: 'text-delta', delta: "1. **递归树形多级嵌套 Group 机制**：支持无限级树形结构（如大分组嵌套子分组，子分组包含工具或推理）。子级在视觉上缩进排列，左侧配有极细的代码引导折叠虚线（Dashed Guideline），层级感犹如现代 IDE，赏心悦目。\n" },
  { type: 'text-delta', delta: "2. **滚动渐进式折叠策略 (Progressive Collapse)**：采用同级注意力坍缩算法。当任意层级下有新的活跃节点开启时，该层级内所有已完成（Complete）的兄弟大步骤/子步骤会被自动平滑收纳折叠，时刻保证页面高度在视口黄金阅读区内，彻底解决多轮工具调用带来的页面撑爆问题。\n\n" },
  { type: 'text-delta', delta: "这项升级真正突破了 MVP 的限制，使交互体验完美迈入顶级工业级生产力 AI产品序列！" },
  { type: 'finish' }
]

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
  if (newVal === true) {
    // 仅在非流式运行时重新手动展开，才重置所有内部子组为折叠状态，提供极简的点击钻取交互
    if (!isStreaming.value) {
      traceParser.handleTraceEvent({ type: 'collapse-all-groups' })
    }
  } else {
    // 自动或手动收拢折叠：启动 requestAnimationFrame 跟随器，在 350ms 动画周期内逐帧将滚动条锁死在底部，防止高度骤缩与滚动跳闪
    const startTime = Date.now()
    const duration = 350
    
    const trackScroll = () => {
      if (documentViewportRef.value) {
        documentViewportRef.value.scrollTop = documentViewportRef.value.scrollHeight
      }
      if (Date.now() - startTime < duration) {
        requestAnimationFrame(trackScroll)
      }
    }
    requestAnimationFrame(trackScroll)
  }
})
// 静态预置的四大演示场景全量、带通义千问 (Qwen) 生产级 API 接入定义的调用源码
const staticSnippets = {
  basic: {
    fileName: 'QwenBasicReasoning.vue',
    code: `[TEMPLATE_START]
  <!-- 新版极简 AgentTrace 思维链 (对接通义千问推理流) -->
  <AgentTrace :is-streaming="isStreaming">
    <AgentTraceTrigger />
    <AgentTraceContent>
      <AgentTraceList :nodes="nodes" />
    </AgentTraceContent>
  </AgentTrace>

  <!-- 生成的 Markdown 正文结果 -->
  <div v-if="content" class="answer-content">
    <div class="markdown-body">\\{\\{ content \\}\}</div>
  </div>
[TEMPLATE_END]

[SCRIPT_SETUP]
import { ref } from 'vue'
import { AgentTrace, AgentTraceTrigger, AgentTraceContent, AgentTraceList, useQwenAgentStream } from 'yuan-ui'

const isStreaming = ref(false)

// 1. 初始化通义千问大模型 SSE 适配器
const { handleQwenChunk, nodes, content } = useQwenAgentStream()

// 2. 真实千问大模型流式调用与组件接入示例
async function runQwenSimulation() {
  isStreaming.value = true
  
  // 发送请求对接千问 API (以标准 OpenAI/Qwen SSE 流式返回为例)
  const response = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer YOUR_API_KEY' },
    body: JSON.stringify({
      model: 'qwen-max',
      messages: [{ role: 'user', content: '重构 Vue 3 组件库...' }],
      stream: true,
      incremental_output: true // 开启增量流式输出
    })
  })

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    
    // 解析 SSE 数据行
    const chunkText = decoder.decode(value)
    const lines = chunkText.split('\\n').filter(l => l.startsWith('data: '))
    
    for (const line of lines) {
      const dataStr = line.slice(6)
      if (dataStr === '[DONE]') continue
      
      const chunk = JSON.parse(dataStr)
      // 3. 将千问流式 Chunk 帧塞入适配器，组件会自动渲染思维链和正文
      handleQwenChunk(chunk)
      
      /**
       * 千问推理流 (choices[0].delta.reasoning_content) 的真实数据结构示例：
       * {
       *   "choices": [{
       *     "delta": {
       *       "reasoning_content": "正在分析 Vue 3 组合式 API 组件设计...",
       *       "content": ""
       *     }
       *   }]
       * }
       */
    }
  }
  isStreaming.value = false
}
[SCRIPT_END]`
  },
  intermediate: {
    fileName: 'QwenIntermediateTool.vue',
    code: `[TEMPLATE_START]
  <!-- 新版极简 AgentTrace 工作台 (对接千问工具调用) -->
  <AgentTrace :is-streaming="isStreaming">
    <AgentTraceTrigger />
    <AgentTraceContent>
      <!-- 渲染包含参数/返回值的工具节点 -->
      <!-- 自动 Fallback 为输入参数与输出结果折叠面板 -->
      <AgentTraceList :nodes="nodes" />
    </AgentTraceContent>
  </AgentTrace>

  <!-- 生成的 Markdown 正文结果 -->
  <div v-if="content" class="answer-content">
    <div class="markdown-body">\\{\\{ content \\}\}</div>
  </div>
[TEMPLATE_END]

[SCRIPT_SETUP]
import { ref } from 'vue'
import { AgentTrace, AgentTraceList, useQwenAgentStream } from 'yuan-ui'

const isStreaming = ref(false)

// 1. 初始化千问大模型 SSE 适配器
const { handleQwenChunk, nodes, content } = useQwenAgentStream()

// 2. 真实千问工具调用流式 Chunk 数据接收示例
async function runQwenToolSimulation() {
  isStreaming.value = true
  
  // 模拟从千问 API (qwen-max) 接收到的 SSE 流数据
  // 每一个 SSE chunk 都可以通过 handleQwenChunk 实时处理
  const mockChunks = [
    // 首帧：开始调用工具，包含函数名与 tool_call id
    {
      choices: [{
        delta: {
          tool_calls: [{
            index: 0,
            id: "call_file_123",
            type: "function",
            function: { name: "read_package_json", arguments: "" }
          }]
        }
      }]
    },
    // 中间帧：流式输出参数的 JSON 片段
    {
      choices: [{
        delta: {
          tool_calls: [{
            index: 0,
            function: { arguments: "{\\"path\\": " }
          }]
        }
      }]
    },
    // 尾帧：参数输出完毕
    {
      choices: [{
        delta: {
          tool_calls: [{
            index: 0,
            function: { arguments: "\\"package.json\\"}" }
          }]
        }
      }]
    }
  ]

  for (const chunk of mockChunks) {
    // 将千问工具调用参数流喂入适配器，左侧即可看到 [输入参数] 随着流式追加自动还原并格式化
    handleQwenChunk(chunk)
  }
  
  isStreaming.value = false
}
[SCRIPT_END]`
  },
  advanced: {
    fileName: 'QwenAdvancedAgent.vue',
    code: `[TEMPLATE_START]
  <!-- 新版极简 AgentTrace 工作台 (对接千问高阶树形嵌套与审批拦截) -->
  <AgentTrace 
    v-model:open="isOpen"
    :is-streaming="isStreaming"
    @approve="onUserApprove"
    @reject="onUserReject"
  >
    <AgentTraceTrigger />
    <AgentTraceContent>
      <!-- 1. 递归多级嵌套树形 Group 分组 -->
      <!-- 2. 同级已完成步骤自动渐进折叠 (Progressive) -->
      <!-- 3. 高危敏感命令审批拦截确权 (tool-approval) -->
      <AgentTraceList :nodes="nodes" />
    </AgentTraceContent>
  </AgentTrace>

  <!-- 生成的 Markdown 正文结果 -->
  <div v-if="content" class="answer-content">
    <div class="markdown-body">\\{\\{ content \\}\}</div>
  </div>
[TEMPLATE_END]

[SCRIPT_SETUP]
import { ref } from 'vue'
import { AgentTrace, AgentTraceList, useQwenAgentStream } from 'yuan-ui'

const isOpen = ref(true)
const isStreaming = ref(false)

// 1. 初始化千问大模型 SSE 适配器，配置敏感工具列表以启用拦截审批闸
const { handleQwenChunk, nodes, content, handleTraceEvent } = useQwenAgentStream({
  sensitiveTools: ['execute_command'] // 清理、修改等系统终端高危命令强制审批
})

// 2. 模拟从千问接收到高危工具调用并拦截
function handleQwenAdvancedSSE() {
  // 当千问流输出 tool_calls[i].function.name === 'execute_command' 完毕
  // 并且大模型流开始输出 delta.content 时：
  // 适配器会在内部自动拦下一闸，触发 'tool-approval-request' 并向 UI 弹出审批卡片
  
  /**
   * 千问工具调用真实 SSE 结构示例（含敏感操作拦截）：
   * {
   *   "choices": [{
   *     "delta": {
   *       "tool_calls": [{
   *         "index": 0,
   *         "id": "call_cmd_456",
   *         "function": {
   *           "name": "execute_command",
   *           "arguments": "{\\"command\\":\\"rm -rf dist/\\"}"
   *         }
   *       }]
   *     }
   *   }]
   * }
   */
}

// 3. 处理用户在前端的确认/拒绝审批动作
function onUserApprove(nodeId) {
  // 向适配器派发已授权事件，适配器将状态流标记为 [已授权]
  handleTraceEvent({ type: 'tool-approval-response', id: nodeId, approved: true })
  
  // 模拟应用端执行本地脚本并回传结果给千问 API
  const toolResult = "[SUCCESS] 成功清理编译缓存目录: dist/"
  
  // 回传工具结果给千问 API 的格式规范：
  const toolResultMessageSpec = {
    role: "tool",
    name: "execute_command",
    tool_call_id: nodeId,
    content: toolResult
  }
}

function onUserReject(payload) {
  // 派发拒绝授权，终止工具运行，向千问回传拒绝原因
  handleTraceEvent({ 
    type: 'tool-approval-response', 
    id: payload.nodeId, 
    approved: false, 
    reason: '用户拒绝了执行授权' 
  })
}
[SCRIPT_END]`
  }
}

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
      
      <div class="nav-tabs">
        <button
          type="button"
          class="tab-btn"
          :class="{ active: activeTab === 'trace' }"
          @click="activeTab = 'trace'"
          :disabled="isStreaming"
        >
          <ShieldCheck class="tab-icon" />
          <span>新版 AgentTrace (List)</span>
        </button>
        <button
          type="button"
          class="tab-btn"
          :class="{ active: activeTab === 'traceDAG' }"
          @click="activeTab = 'traceDAG'"
          :disabled="isStreaming"
        >
          <ShieldCheck class="tab-icon" />
          <span>新版 AgentTraceDAG (DAG拓扑)</span>
        </button>
      </div>

      <div class="header-actions">
        <!-- 渐进式场景选择器（仅在新版 AgentTrace 下展示） -->
        <div v-if="activeTab === 'trace'" class="scenario-selector">
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
          <template v-if="activeTab === 'trace' && (traceParser.nodes.value.length > 0 || traceParser.isStreaming.value)">
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

          <!-- 1.5 新版 AgentTraceDAG (DAG 拓扑) 演示 -->
          <template v-else-if="activeTab === 'traceDAG' && (traceParser.nodes.value.length > 0 || traceParser.isStreaming.value)">
            <div class="dag-playground-wrapper">
              <AgentTraceDAG
                :nodes="traceParser.nodes.value"
                @node-click="handleNodeClick"
                @node-fork="handleNodeFork"
              />
            </div>
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

/* 纯文字滑动 Tab */
.nav-tabs {
  display: flex;
  background-color: transparent;
  padding: 0;
  border-radius: 0;
  gap: 1.5rem;
  height: 100%;
  align-items: center;
}

.tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  height: 100%;
  border: none;
  background: transparent;
  border-radius: 0;
  font-size: 0.78rem;
  font-weight: 500;
  color: #86868b;
  cursor: pointer;
  transition: color 0.15s ease;
  position: relative;
}

.dark .tab-btn {
  color: #a1a1aa;
}

.tab-btn.active {
  background: transparent;
  color: #1d1d1f;
  box-shadow: none;
  font-weight: 600;
}

.dark .tab-btn.active {
  color: #f4f4f5;
}

.tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background-color: #0071e3;
}

.tab-icon {
  width: 0.8rem;
  height: 0.8rem;
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
