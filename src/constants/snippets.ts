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
