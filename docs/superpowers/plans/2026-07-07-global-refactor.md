# 全局组件瘦身与逻辑解耦重构实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 重构 Vue 3 项目，剥离 [App.vue](file:///Users/neoyuan/Desktop/aoyi/yuan-ui/src/App.vue) 中的 mock 演示数据与代码文本，以及解耦 [AgentTraceDAG.vue](file:///Users/neoyuan/Desktop/aoyi/yuan-ui/src/components/AgentTraceDAG/AgentTraceDAG.vue) 极其臃肿的布局几何算法与 Inspector 渲染职责。

**架构：** 提取纯静态常量，将 BFS 分层拓扑计算抽离为纯 TS 函数，将 SVG 连线计算及监听封装为自定义 Hook `useDAGLayout`，并将侧边栏详情抽屉封装为自治的 `DAGInspector.vue` 子组件。

**技术栈：** Vue 3, TypeScript, Vite, Vitest

---

### 任务 1：演示数据与 staticSnippets 剥离

**文件：**
- 创建：`src/mockData.ts`
- 创建：`src/constants/snippets.ts`
- 修改：`src/App.vue`

- [ ] **步骤 1：创建 `src/mockData.ts` 并导出演示数据**
  新建 [src/mockData.ts](file:///Users/neoyuan/Desktop/aoyi/yuan-ui/src/mockData.ts)，剪切 `App.vue` 中的 `mockBasicFlow`、`mockIntermediateFlow`、`mockAdvancedFlow` 演示流：
  ```typescript
  export const mockBasicFlow = [
    { type: 'reasoning-delta', delta: '正在接收并分析用户提出的工程化重构诉求：对标大厂品质开源组件库...' },
    { type: 'reasoning-delta', delta: '\n\n经过对 Vue 3 社区的横向比对，优秀开源组件库的工程骨架一般包含：自动声明文件编译（vite-plugin-dts）、全局 CSS 变量主题底座、Husky 提交校验。' },
    { type: 'reasoning-delta', delta: '\n\n为了保障文档站的极速响应与良好的 Live 演示交互，使用 VitePress 是性价比最高的策略。我们只需要在其基础上对其进行 Layout 换头，即可获得 Arco 级别的颜值。' },
    { type: 'reasoning-delta', delta: '\n\n分析完毕，下面给出基本的重构核心路线说明。' },
    { type: 'text-delta', delta: "# 基础思维链演示完成\n\n通过该基础流，你可以看到 `AgentTrace` 能够完美实现流式 Reasoning Deltas 的打字机追加以及思考完成状态的过渡。" },
    { type: 'finish' }
  ]

  export const mockIntermediateFlow = [
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

  export const mockAdvancedFlow: any[] = [
    { type: 'group-start', id: 'g-env', title: '第一阶段：环境调研与扫描' },
    { type: 'reasoning-delta', id: 'r-1', delta: '为了重构出具有 CodeX 和 Cursor 级别的嵌套思维链，我需要先对多级树形 Timeline 和滚动渐进折叠策略做可行性调研。', parentId: 'g-env' },
    { type: 'group-start', id: 'g-search', title: '流式折叠技术规范调研', parentId: 'g-env' },
    { type: 'tool-input-start', id: 'search-1', toolName: 'google_search', title: '调研 Web 树形 Timeline 设计', parentId: 'g-search' },
    { type: 'tool-output', id: 'search-1', output: [
      { title: "Vue 3 组合式 API 高阶用法与实践", url: "https://vuejs.org", snippet: "本指南介绍如何利用 inject/provide 及递归挂载，优雅开发具有树形层级连接线的 Timeline 混合折叠组件。" },
      { title: "ChatGPT o1 思维链折叠机制解析", url: "https://openai.com", snippet: "o1 在流式生成步骤时，会把已完成的大步骤自动折叠，仅保留当前的活跃大组展开，降低大量日志对屏幕空间占用的负担。" }
    ]},
    { type: 'group-end', id: 'g-search' },
    { type: 'group-start', id: 'g-read-conf', title: '验证本地打包器环境', parentId: 'g-env' },
    { type: 'tool-input-start', id: 'file-1', toolName: 'read_file', title: '读取本地配置文件 vite.config.js', input: { path: 'vite.config.js' }, parentId: 'g-read-conf' },
    { type: 'tool-output', id: 'file-1', output: `import { defineConfig } from 'vite'
  import vue from '@vitejs/plugin-vue'
  export default defineConfig({
    plugins: [vue()]
  })` },
    { type: 'group-end', id: 'g-read-conf' },
    { type: 'group-end', id: 'g-env' },
    { type: 'group-start', id: 'g-refactor', title: '第二阶段：智能体组件重构' },
    { type: 'group-start', id: 'g-patch', title: '重构库组件入口导出', parentId: 'g-refactor' },
    { type: 'tool-input-start', id: 'diff-1', toolName: 'replace_file_content', title: '追加组件树导出', parentId: 'g-patch' },
    { type: 'tool-output', id: 'diff-1', output: `@@ -1,3 +1,5 @@
   export * from './components/ChainOfThought'
  +export { default as AgentTrace } from './components/AgentTrace/AgentTrace.vue'
  +export { default as GroupTraceNode } from './components/AgentTrace/renderers/GroupTraceNode.vue'
  ` },
    { type: 'group-end', id: 'g-patch' },
    { type: 'group-start', id: 'g-approve', title: '敏感构建目录清理', parentId: 'g-refactor' },
    { type: 'tool-input-start', id: 'approve-demo', toolName: 'execute_command', title: '清空编译输出目录 dist/', input: { command: 'rm -rf dist/' }, parentId: 'g-approve' },
    { type: 'tool-approval-request', id: 'approve-demo' },
    { type: 'tool-output', id: 'approve-demo', output: '\x1b[32m[SUCCESS] 成功清除构建缓存目录: dist/\x1b[0m' },
    { type: 'group-end', id: 'g-approve' },
    { type: 'group-start', id: 'g-build', title: '编译器打包构建与校验', parentId: 'g-refactor' },
    { type: 'tool-input-start', id: 'cmd-build-new', toolName: 'execute_command', title: '执行打包构建', input: { command: 'npm run build' }, parentId: 'g-build' },
    { type: 'tool-output', id: 'cmd-build-new', output: `\x1B[90mvite v5.4.21 building for production...\x1B[0m
  \x1B[32m✓ 34 modules transformed.\x1B[0m
  \x1B[36mdist/yuan-ui.es.js   12.45 kB │ gzip: 4.12 kB\x1B[0m
  \x1B[32;1m[SUCCESS] 打包库编译完成，无任何警告。\x1B[0m` },
    { type: 'group-end', id: 'g-build' },
    { type: 'group-end', id: 'g-refactor' },
    { type: 'text-delta', delta: "# 智能体多级 Grouping 与渐进收缩折叠报告\n\n" },
    { type: 'text-delta', delta: "我们已经在优化后，让 `AgentTrace` 成功具备了类似 **ChatGPT (o1) 与 CodeX 级别**的思维链特质，包含两大革命性提升：\n\n" },
    { type: 'text-delta', delta: "1. **递归树形多级嵌套 Group 机制**：支持无限级树形结构（如大分组嵌套子分组，子分组包含工具或推理）。子级在视觉上缩进排列，左侧配有极细的代码引导折叠虚线（Dashed Guideline），层级感犹如现代 IDE，赏心悦目。\n" },
    { type: 'text-delta', delta: "2. **滚动渐进式折叠策略 (Progressive Collapse)**：采用同级注意力坍缩算法。当任意层级下有新的活跃节点开启时，该层级内所有已完成（Complete）的兄弟大步骤/子步骤会被自动平滑收纳折叠，时刻保证页面高度在视口黄金阅读区内，彻底解决多轮工具调用带来的页面撑爆问题。\n\n" },
    { type: 'text-delta', delta: "这项升级真正突破了 MVP 的限制，使交互体验完美迈入顶级工业级生产力 AI产品序列！" },
    { type: 'finish' }
  ]
  ```

- [ ] **步骤 2：创建 `src/constants/snippets.ts` 并导出 staticSnippets**
  新建 [src/constants/snippets.ts](file:///Users/neoyuan/Desktop/aoyi/yuan-ui/src/constants/snippets.ts)，剪切 `App.vue` 中的 `staticSnippets`（替换转义字符为正常形式）：
  ```typescript
  export const staticSnippets = {
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
      <div class="markdown-body">{{ content }}</div>
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
      <div class="markdown-body">{{ content }}</div>
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
        <AgentTraceList :nodes="nodes" />
      </AgentTraceContent>
    </AgentTrace>

    <!-- 生成的 Markdown 正文结果 -->
    <div v-if="content" class="answer-content">
      <div class="markdown-body">{{ content }}</div>
    </div>
  [TEMPLATE_END]

  [SCRIPT_SETUP]
  import { ref } from 'vue'
  import { AgentTrace, AgentTraceList, useQwenAgentStream } from 'yuan-ui'

  const isOpen = ref(true)
  const isStreaming = ref(false)

  // 1. 初始化千问大模型 SSE 适配器，配置敏感工具列表以启用拦截审批闸
  const { handleQwenChunk, nodes, content, handleTraceEvent } = useQwenAgentStream({
    sensitiveTools: ['execute_command']
  })

  // 2. 真实千问接收到高危工具调用并拦截
  function handleQwenAdvancedSSE() {}

  // 3. 处理用户在前端的确认/拒绝审批动作
  function onUserApprove(nodeId) {
    handleTraceEvent({ type: 'tool-approval-response', id: nodeId, approved: true })
    const toolResult = "[SUCCESS] 成功清理编译缓存目录: dist/"
    // 回传工具结果给千问 API
  }

  function onUserReject(payload) {
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
  ```

- [ ] **步骤 3：修改 `src/App.vue` 导入上述文件并移除硬编码**
  修改 [src/App.vue](file:///Users/neoyuan/Desktop/aoyi/yuan-ui/src/App.vue)，在顶端导入：
  ```typescript
  import { mockBasicFlow, mockIntermediateFlow, mockAdvancedFlow } from './mockData'
  import { staticSnippets } from './constants/snippets'
  ```
  然后完全删除原 `mockBasicFlow`、`mockIntermediateFlow`、`mockAdvancedFlow` 数组以及 `staticSnippets` 大常量的具体定义。

- [ ] **步骤 4：编译检查与运行测试**
  运行：`npm run build` 验证主页面编译通过。

- [ ] **步骤 5：Commit**
  ```bash
  git add src/mockData.ts src/constants/snippets.ts src/App.vue
  git commit -m "refactor: extract demo mock flows and static snippets from App.vue"
  ```

---

### 任务 2：DAG BFS 拓扑分层算法模块抽离

**文件：**
- 创建：`src/components/AgentTraceDAG/layout.ts`
- 创建：`src/components/AgentTraceDAG/__tests__/layout.test.ts`

- [ ] **步骤 1：创建 `src/components/AgentTraceDAG/layout.ts` 算法文件**
  新建 [src/components/AgentTraceDAG/layout.ts](file:///Users/neoyuan/Desktop/aoyi/yuan-ui/src/components/AgentTraceDAG/layout.ts)，写入：
  ```typescript
  import type { DAGNode, DAGEdge } from './types'

  export function computeBFSLayout(nodes: DAGNode[]): Array<{ level: number; nodes: DAGNode[] }> {
    if (nodes.length === 0) return []

    const normalizedNodes = nodes.map(node => ({
      ...node,
      parentIds: node.parentIds || (node.parentId ? [node.parentId] : [])
    }))

    const computedEdges: DAGEdge[] = []
    normalizedNodes.forEach(node => {
      if (node.parentIds && node.parentIds.length > 0) {
        node.parentIds.forEach(pId => {
          computedEdges.push({
            source: pId,
            target: node.id,
            status: node.status
          })
        })
      }
    })

    const nodeMap = new Map<string, typeof normalizedNodes[0]>()
    const childMap = new Map<string, string[]>()
    const inDegree = new Map<string, number>()
    
    normalizedNodes.forEach(node => {
      nodeMap.set(node.id, node)
      childMap.set(node.id, [])
      inDegree.set(node.id, 0)
    })

    computedEdges.forEach(edge => {
      const parentIds = childMap.get(edge.source) || []
      parentIds.push(edge.target)
      childMap.set(edge.source, parentIds)

      const deg = inDegree.get(edge.target) || 0
      inDegree.set(edge.target, deg + 1)
    })

    const nodeLevels = new Map<string, number>()
    const queue: string[] = []

    normalizedNodes.forEach(node => {
      const deg = inDegree.get(node.id) || 0
      if (deg === 0 || (!node.parentIds || node.parentIds.length === 0)) {
        nodeLevels.set(node.id, 0)
        queue.push(node.id)
      }
    })

    while (queue.length > 0) {
      const currId = queue.shift()!
      const currLevel = nodeLevels.get(currId) || 0
      const children = childMap.get(currId) || []

      children.forEach(childId => {
        const childLevel = nodeLevels.get(childId) || 0
        const targetLevel = Math.max(childLevel, currLevel + 1)
        nodeLevels.set(childId, targetLevel)
        
        if (!queue.includes(childId)) {
          queue.push(childId)
        }
      })
    }

    const maxLevel = Math.max(0, ...Array.from(nodeLevels.values()))
    const resultCols: Array<{ level: number; nodes: DAGNode[] }> = []

    for (let i = 0; i <= maxLevel; i++) {
      resultCols.push({ level: i, nodes: [] })
    }

    nodes.forEach(node => {
      const level = nodeLevels.get(node.id) ?? 0
      if (level < resultCols.length) {
        resultCols[level].nodes.push(node)
      } else {
        resultCols[0].nodes.push(node)
      }
    })

    return resultCols.filter(col => col.nodes.length > 0)
  }

  export function getBezierPath(x1: number, y1: number, x2: number, y2: number): string {
    const dx = Math.abs(x2 - x1) * 0.5
    return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`
  }
  ```

- [ ] **步骤 2：创建 `layout.test.ts` 测试文件**
  新建 [src/components/AgentTraceDAG/__tests__/layout.test.ts](file:///Users/neoyuan/Desktop/aoyi/yuan-ui/src/components/AgentTraceDAG/__tests__/layout.test.ts)，写入：
  ```typescript
  import { describe, it, expect } from 'vitest'
  import { computeBFSLayout } from '../layout'
  import type { DAGNode } from '../types'

  describe('computeBFSLayout', () => {
    it('should layer independent nodes to level 0', () => {
      const nodes: DAGNode[] = [
        { id: '1', kind: 'reasoning', title: 'Node 1', status: 'complete' },
        { id: '2', kind: 'tool', title: 'Node 2', status: 'complete' }
      ]
      const result = computeBFSLayout(nodes)
      expect(result).toHaveLength(1)
      expect(result[0].level).toBe(0)
      expect(result[0].nodes).toHaveLength(2)
    })

    it('should sort dependent nodes sequentially', () => {
      const nodes: DAGNode[] = [
        { id: '1', kind: 'reasoning', title: 'Node 1', status: 'complete' },
        { id: '2', kind: 'tool', title: 'Node 2', status: 'complete', parentId: '1' }
      ]
      const result = computeBFSLayout(nodes)
      expect(result).toHaveLength(2)
      expect(result[0].level).toBe(0)
      expect(result[1].level).toBe(1)
      expect(result[0].nodes[0].id).toBe('1')
      expect(result[1].nodes[0].id).toBe('2')
    })
  })
  ```

- [ ] **步骤 3：运行 layout 单元测试**
  运行：`npx vitest run src/components/AgentTraceDAG/__tests__/layout.test.ts`
  预期：PASS。

- [ ] **步骤 4：Commit**
  ```bash
  git add -f src/components/AgentTraceDAG/layout.ts src/components/AgentTraceDAG/__tests__/layout.test.ts
  git commit -m "feat: extract DAG BFS layering algorithm and add unit tests"
  ```

---

### 任务 3：useDAGLayout 几何连线 Hook 抽离与主组件瘦身

**文件：**
- 创建：`src/components/AgentTraceDAG/useDAGLayout.ts`
- 修改：`src/components/AgentTraceDAG/AgentTraceDAG.vue`

- [ ] **步骤 1：创建 `useDAGLayout.ts`**
  新建 [src/components/AgentTraceDAG/useDAGLayout.ts](file:///Users/neoyuan/Desktop/aoyi/yuan-ui/src/components/AgentTraceDAG/useDAGLayout.ts)，写入：
  ```typescript
  import { ref, onMounted, onBeforeUnmount, nextTick, watch, type Ref } from 'vue'
  import type { DAGNode, DAGEdge, DAGTraceStatus } from './types'

  export interface UseDAGLayoutOptions {
    containerRef: Ref<HTMLElement | null>
    nodeElements: Ref<Record<string, HTMLElement>>
    nodes: Ref<DAGNode[]>
  }

  export function useDAGLayout(options: UseDAGLayoutOptions) {
    const links = ref<Array<{
      id: string
      x1: number
      y1: number
      x2: number
      y2: number
      status: DAGTraceStatus
    }>>([])

    const getComputedEdges = (nodes: DAGNode[]): DAGEdge[] => {
      const result: DAGEdge[] = []
      nodes.forEach(node => {
        const parentIds = node.parentIds || (node.parentId ? [node.parentId] : [])
        if (parentIds.length > 0) {
          parentIds.forEach(pId => {
            result.push({
              source: pId,
              target: node.id,
              status: node.status
            })
          })
        }
      })
      return result
    }

    const updateLinks = () => {
      const containerEl = options.containerRef.value
      if (!containerEl) return
      
      const containerRect = containerEl.getBoundingClientRect()
      const computedLinks: typeof links.value = []
      const edges = getComputedEdges(options.nodes.value)

      edges.forEach(edge => {
        const parentEl = options.nodeElements.value[edge.source]
        const childEl = options.nodeElements.value[edge.target]

        if (parentEl && childEl) {
          const parentRect = parentEl.getBoundingClientRect()
          const childRect = childEl.getBoundingClientRect()

          const x1 = parentRect.right - containerRect.left
          const y1 = parentRect.top - containerRect.top + parentRect.height / 2

          const x2 = childRect.left - containerRect.left
          const y2 = childRect.top - containerRect.top + childRect.height / 2

          const childNode = options.nodes.value.find(n => n.id === edge.target)
          const edgeStatus = childNode ? childNode.status : (edge.status || 'complete')

          computedLinks.push({
            id: `${edge.source}-${edge.target}`,
            x1,
            y1,
            x2,
            y2,
            status: edgeStatus
          })
        }
      })

      links.value = computedLinks
    }

    let resizeObserver: ResizeObserver | null = null

    onMounted(() => {
      nextTick(() => {
        updateLinks()
      })

      if (window.ResizeObserver && options.containerRef.value) {
        resizeObserver = new ResizeObserver(() => {
          updateLinks()
        })
        resizeObserver.observe(options.containerRef.value)
      }
    })

    watch(() => options.nodes.value, () => {
      nextTick(() => {
        updateLinks()
      })
    }, { deep: true })

    onBeforeUnmount(() => {
      if (resizeObserver) {
        resizeObserver.disconnect()
      }
    })

    return {
      links,
      updateLinks
    }
  }
  ```

- [ ] **步骤 2：在 `AgentTraceDAG.vue` 中移除算法并调用新函数**
  修改 [src/components/AgentTraceDAG/AgentTraceDAG.vue](file:///Users/neoyuan/Desktop/aoyi/yuan-ui/src/components/AgentTraceDAG/AgentTraceDAG.vue)：
  - 导入 `computeBFSLayout` 和 `getBezierPath`：
    ```typescript
    import { computeBFSLayout, getBezierPath } from './layout'
    import { useDAGLayout } from './useDAGLayout'
    ```
  - 定义 `nodesRef = computed(() => props.nodes)` 并调用 `useDAGLayout`：
    ```typescript
    const nodesRef = computed(() => props.nodes)
    const { links, updateLinks } = useDAGLayout({
      containerRef,
      nodeElements,
      nodes: nodesRef
    })
    ```
  - 将 `columns` 计算属性简化为：
    ```typescript
    const columns = computed(() => {
      return computeBFSLayout(props.nodes)
    })
    ```
  - 删除原有的 `normalizedNodes`、`computedEdges` 计算属性，删除原有 `updateLinks` 方法，以及 resizeObserver 在 onMounted/onBeforeUnmount 中的直接挂载逻辑。

- [ ] **步骤 3：运行项目全部测试**
  运行：`npm run test`
  预期：所有测试通过。

- [ ] **步骤 4：Commit**
  ```bash
  git add -f src/components/AgentTraceDAG/useDAGLayout.ts src/components/AgentTraceDAG/AgentTraceDAG.vue
  git commit -m "refactor: extract updateLinks to useDAGLayout hook and simplify columns computation in AgentTraceDAG"
  ```

---

### 任务 4：Inspector 详情面板解耦为独立子组件

**文件：**
- 创建：`src/components/AgentTraceDAG/DAGInspector.vue`
- 修改：`src/components/AgentTraceDAG/AgentTraceDAG.vue`

- [ ] **步骤 1：创建 `DAGInspector.vue`**
  新建 [src/components/AgentTraceDAG/DAGInspector.vue](file:///Users/neoyuan/Desktop/aoyi/yuan-ui/src/components/AgentTraceDAG/DAGInspector.vue)，将 Inspector 面板逻辑剪切至此。
  注意导入渲染组件：
  ```vue
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

  function toggleInput() {
    if (formattedInput.value) {
      isInputCollapsed.value = !isInputCollapsed.value
    }
  }

  function toggleOutput() {
    if (formattedOutput.value || props.selectedNode.errorText) {
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
  </template>

  <style scoped>
  /* 仅保留详情抽屉相关的 CSS 样式定义，从原 AgentTraceDAG.vue 的 style scoped 中搬运过来 */
  .dag-inspector-panel {
    width: 320px;
    border-left: 1px solid #e2e8f0;
    background: #ffffff;
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    z-index: 10;
  }
  .dark .dag-inspector-panel {
    border-left-color: #27272a;
    background: #09090b;
  }
  .inspector-header {
    height: 48px;
    padding: 0 1rem;
    border-bottom: 1px solid #f1f5f9;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
  }
  .dark .inspector-header {
    border-bottom-color: #27272a;
  }
  .inspector-title-area {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-width: 0;
  }
  .inspector-kind-badge {
    font-size: 9px;
    font-weight: 700;
    padding: 0.15rem 0.35rem;
    border-radius: 4px;
    letter-spacing: 0.05em;
  }
  .badge-reasoning { background: rgba(59, 130, 246, 0.08); color: #3b82f6; }
  .badge-tool { background: rgba(16, 185, 129, 0.08); color: #10b981; }
  .badge-artifact { background: rgba(245, 158, 11, 0.08); color: #f59e0b; }
  .badge-text { background: rgba(107, 114, 128, 0.08); color: #6b7280; }
  .inspector-title {
    font-size: 0.78rem;
    font-weight: 600;
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: #1d1d1f;
  }
  .dark .inspector-title { color: #f4f4f5; }
  .close-inspector-btn {
    border: none;
    background: transparent;
    padding: 0.25rem;
    border-radius: 4px;
    cursor: pointer;
    color: #86868b;
  }
  .close-inspector-btn:hover { background: rgba(0, 0, 0, 0.04); color: #1d1d1f; }
  .dark .close-inspector-btn:hover { background: rgba(255, 255, 255, 0.04); color: #f4f4f5; }
  .close-icon { width: 0.85rem; height: 0.85rem; }
  .inspector-body {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
    scrollbar-width: thin;
  }
  .reasoning-summary-card, .artifact-card, .text-content-card {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 0.75rem;
  }
  .dark .reasoning-summary-card, .dark .artifact-card, .dark .text-content-card {
    background: #18181b;
    border-color: #27272a;
  }
  .card-header {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.7rem;
    font-weight: 600;
    color: #86868b;
    margin-bottom: 0.5rem;
  }
  .card-icon { width: 0.75rem; height: 0.75rem; }
  .reasoning-summary-text, .text-content-body {
    font-size: 0.7rem;
    line-height: 1.45;
    margin: 0;
    white-space: pre-wrap;
    word-break: break-all;
    color: #1d1d1f;
  }
  .dark .reasoning-summary-text, .dark .text-content-body { color: #d4d4d8; }
  .panel-section {
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    margin-bottom: 0.75rem;
    overflow: hidden;
    background: #ffffff;
  }
  .dark .panel-section {
    border-color: #27272a;
    background: #09090b;
  }
  .section-toggle {
    width: 100%;
    text-align: left;
    padding: 0.45rem 0.65rem;
    background: #f8fafc;
    border: none;
    border-bottom: 1px solid #e2e8f0;
    font-size: 0.7rem;
    font-weight: 600;
    color: #64748b;
  }
  .dark .section-toggle {
    background: #18181b;
    border-bottom-color: #27272a;
    color: #a1a1aa;
  }
  .grid-transition {
    display: grid;
    grid-template-rows: 0fr;
    transition: grid-template-rows 0.25s ease-out;
  }
  .grid-transition.is-expanded {
    grid-template-rows: 1fr;
  }
  .grid-transition-inner {
    overflow: hidden;
  }
  .section-content {
    padding: 0.65rem;
  }
  .code-block {
    margin: 0;
    padding: 0.5rem;
    background: #0f172a;
    border-radius: 4px;
    font-family: ui-monospace, monospace;
    font-size: 0.65rem;
    color: #e2e8f0;
    overflow-x: auto;
    white-space: pre;
  }
  .error-panel {
    background: rgba(239, 68, 68, 0.04);
    border: 1px solid rgba(239, 68, 68, 0.15);
    border-radius: 4px;
    padding: 0.5rem;
    margin-bottom: 0.5rem;
  }
  .error-text {
    margin: 0;
    font-family: ui-monospace, monospace;
    font-size: 0.65rem;
    color: #ef4444;
    white-space: pre-wrap;
  }
  .artifact-image-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .artifact-image {
    max-width: 100%;
    max-height: 200px;
    object-fit: contain;
    border-radius: 4px;
  }
  .artifact-caption {
    font-size: 0.65rem;
    color: #86868b;
    margin: 0.35rem 0 0 0;
    text-align: center;
  }
  .artifact-link-wrapper {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }
  .artifact-link {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.72rem;
    color: #3b82f6;
    text-decoration: none;
    font-weight: 500;
  }
  .artifact-link:hover { text-decoration: underline; }
  .artifact-file-info {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    color: #1d1d1f;
  }
  .dark .artifact-file-info { color: #f4f4f5; }
  .file-path {
    font-size: 0.7rem;
    font-weight: 500;
    word-break: break-all;
  }
  </style>
  ```

- [ ] **步骤 2：在 `AgentTraceDAG.vue` 中移除 Inspector 代码并引入新组件**
  修改 [src/components/AgentTraceDAG/AgentTraceDAG.vue](file:///Users/neoyuan/Desktop/aoyi/yuan-ui/src/components/AgentTraceDAG/AgentTraceDAG.vue)：
  - 导入 `DAGInspector`：
    ```typescript
    import DAGInspector from './DAGInspector.vue'
    ```
  - 删除 `selectedToolName`、`isTerminalTool`、`isDiffTool`、`isFileTool`、`isSearchTool`、`terminalCommand`、`fileInfo`、`diffInfo`、`formattedInput`、`formattedOutput`、`isInputCollapsed`、`isOutputCollapsed` 以及 `toggleInput`/`toggleOutput` 等多余的状态和计算属性。
  - 在模板中，用 `<DAGInspector>` 组件替换侧边栏：
    ```html
    <!-- 右栏详情抽屉面板 (Inspector) -->
    <Transition name="slide">
      <DAGInspector
        v-if="selectedNode"
        :selected-node="selectedNode"
        :max-output-length="maxOutputLength"
        @close="selectedNodeId = ''"
      />
    </Transition>
    ```
  - 删除主组件中被抽走的 CSS 样式（以减少样式大小，并开启 scoped 隔离）。

- [ ] **步骤 3：运行测试并验证**
  运行：`npm run test`
  预期：所有单元测试通过。

- [ ] **步骤 4：Commit**
  ```bash
  git add -f src/components/AgentTraceDAG/DAGInspector.vue src/components/AgentTraceDAG/AgentTraceDAG.vue
  git commit -m "refactor: extract inspector sidebar logic and UI into DAGInspector component"
  ```

---

### 任务 5：生产编译构建验证

- [ ] **步骤 1：运行生产环境打包**
  运行：`npm run build`
  预期：没有 TypeScript 编译和 Vite 构建错误，生成 `dist/` 文件夹。

- [ ] **步骤 2：运行单元测试**
  运行：`npm run test`
  预期：PASS。

- [ ] **步骤 3：Commit**
  ```bash
  git commit --allow-empty -m "chore: verify build success and complete refactor lifecycle"
  ```
