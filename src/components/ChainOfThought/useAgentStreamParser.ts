import { ref, watch, type Ref } from 'vue'
import { nanoid } from 'nanoid'
import type { AgentStepNode, SearchResultItem } from './types'

export function useAgentStreamParser() {
  const nodes = ref<AgentStepNode[]>([])
  const content = ref('')
  const isThinking = ref(false)
  const totalDuration = ref(0)

  let totalStartTime: number | null = null
  let activeNodeIndex = -1

  // 启动全局思考计时
  function startGlobalTimer() {
    if (!totalStartTime) {
      totalStartTime = Date.now()
      isThinking.value = true
    }
  }

  // 关闭全局计时
  function stopGlobalTimer() {
    if (totalStartTime) {
      totalDuration.value = Math.ceil((Date.now() - totalStartTime) / 1000)
      totalStartTime = null
      isThinking.value = false

      // 保证所有活跃节点正常结束
      nodes.value.forEach(node => {
        if (node.status === 'active') {
          node.status = 'complete'
          node.duration = Math.ceil((Date.now() - node.startTime) / 1000)
          if (node.toolCall) {
            node.toolCall.status = 'complete'
          }
        }
      })
      activeNodeIndex = -1
    }
  }

  // 闭合当前的活跃节点，并计算它的微观执行时间
  function closeActiveNode() {
    if (activeNodeIndex !== -1) {
      const activeNode = nodes.value[activeNodeIndex]
      if (activeNode && activeNode.status === 'active') {
        activeNode.status = 'complete'
        activeNode.duration = Math.ceil((Date.now() - activeNode.startTime) / 1000)
        if (activeNode.toolCall) {
          activeNode.toolCall.status = 'complete'
        }
      }
      activeNodeIndex = -1
    }
  }

  // 处理大模型/Agent 流式推送回来的 delta 网络包
  function handleAgentChunk(event: {
    type: 'thought' | 'tool_call' | 'tool_output' | 'image' | 'content'
    delta?: string
    toolName?: string
    toolArgs?: string
    toolId?: string
    searchResults?: SearchResultItem[]
    filePath?: string
    command?: string
    imageUrl?: string
    imageCaption?: string
  }) {
    startGlobalTimer()

    // 1. 推理思考流
    if (event.type === 'thought' && event.delta) {
      // 如果当前没有活跃节点，或者当前的活跃节点不是思考类型，我们需要切换节点
      if (activeNodeIndex === -1 || nodes.value[activeNodeIndex].type !== 'thought') {
        closeActiveNode()
        
        const stepNum = nodes.value.filter(n => n.type === 'thought').length + 1
        const newNode: AgentStepNode = {
          id: nanoid(),
          type: 'thought',
          label: `推理分析阶段 ${stepNum}`,
          content: '',
          status: 'active',
          startTime: Date.now()
        }
        nodes.value.push(newNode)
        activeNodeIndex = nodes.value.length - 1
      }
      nodes.value[activeNodeIndex].content += event.delta
    }

    // 2. 工具调用开始 (Tool call initiate)
    else if (event.type === 'tool_call' && event.toolName) {
      closeActiveNode()

      let label = `调用工具: ${event.toolName}`
      if (event.toolName === 'google_search') {
        label = '网络搜索检索'
      } else if (event.toolName === 'read_file') {
        label = `读取文件: ${event.filePath || '项目配置文件'}`
      } else if (event.toolName === 'execute_command') {
        label = `执行系统命令: ${event.command || ''}`
      }

      const newNode: AgentStepNode = {
        id: event.toolId || nanoid(),
        type: 'tool_call',
        label,
        content: '',
        status: 'active',
        startTime: Date.now(),
        toolCall: {
          name: event.toolName,
          arguments: event.toolArgs || '',
          status: 'active',
          filePath: event.filePath,
          command: event.command
        }
      }
      nodes.value.push(newNode)
      activeNodeIndex = nodes.value.length - 1
    }

    // 3. 工具执行结果返回 (Tool output)
    else if (event.type === 'tool_output') {
      // 匹配对应的工具节点
      const targetNode = event.toolId 
        ? nodes.value.find(n => n.id === event.toolId)
        : nodes.value[activeNodeIndex]

      if (targetNode && targetNode.type === 'tool_call' && targetNode.toolCall) {
        targetNode.status = 'complete'
        targetNode.duration = Math.ceil((Date.now() - targetNode.startTime) / 1000)
        targetNode.toolCall.status = 'complete'
        targetNode.toolCall.output = event.delta || ''
        
        if (event.searchResults) {
          targetNode.toolCall.results = event.searchResults
        }
      }

      // 如果更新的是当前活跃节点，则重置活跃索引
      if (activeNodeIndex !== -1 && nodes.value[activeNodeIndex].id === event.toolId) {
        activeNodeIndex = -1
      }
    }

    // 4. 多模态图片生成
    else if (event.type === 'image' && event.imageUrl) {
      closeActiveNode()

      const newNode: AgentStepNode = {
        id: nanoid(),
        type: 'image',
        label: '生成多模态配图',
        content: '',
        status: 'complete',
        startTime: Date.now(),
        imageUrl: event.imageUrl,
        imageCaption: event.imageCaption
      }
      nodes.value.push(newNode)
    }

    // 5. 正文回答输出 (Markdown content)
    else if (event.type === 'content' && event.delta) {
      // 正文流一旦到来，代表思考与工具调研正式闭环
      stopGlobalTimer()
      content.value += event.delta
    }
  }

  function reset() {
    nodes.value = []
    content.value = ''
    isThinking.value = false
    totalDuration.value = 0
    totalStartTime = null
    activeNodeIndex = -1
  }

  return {
    nodes,
    content,
    isThinking,
    totalDuration,
    handleAgentChunk,
    reset
  }
}
