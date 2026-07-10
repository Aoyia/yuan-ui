import { ref } from 'vue'
import { mockBasicFlow, mockIntermediateFlow, mockAdvancedFlow } from '../mockData'
import { TEMPLATES } from '../constants/templates'

export function useSimulator(traceParser: any) {
  const isStreaming = ref(false)
  const pendingApproval = ref<{ resolve: (approved: boolean) => void; id: string } | null>(null)

  // Markdown 流式渲染器测试状态
  const selectedTemplate = ref<'normal' | 'invalid-zod' | 'malicious-inject' | 'stress-test'>('stress-test')
  const streamText = ref('')
  const isMarkdownStreaming = ref(false)
  const notification = ref('')
  const streamSpeed = ref(25) // 默认 25ms (对应 80 tokens/s)
  let markdownTimer: ReturnType<typeof setTimeout> | null = null

  function onUserApprove(nodeId: string) {
    if (pendingApproval.value && pendingApproval.value.id === nodeId) {
      traceParser.handleTraceEvent({ type: 'tool-approval-response', id: nodeId, approved: true })
      pendingApproval.value.resolve(true)
      pendingApproval.value = null
    }
  }

  function onUserReject(payload: { nodeId: string; reason?: string }) {
    if (pendingApproval.value && pendingApproval.value.id === payload.nodeId) {
      traceParser.handleTraceEvent({
        type: 'tool-approval-response',
        id: payload.nodeId,
        approved: false,
        reason: payload.reason,
      })
      pendingApproval.value.resolve(false)
      pendingApproval.value = null
    }
  }

  function onUserToggleCollapse(nodeId: string) {
    traceParser.handleTraceEvent({ type: 'toggle-collapse', id: nodeId })
  }

  async function startSimulation(currentScenario: 'basic' | 'intermediate' | 'advanced') {
    if (isStreaming.value) return
    isStreaming.value = true
    pendingApproval.value = null

    traceParser.reset()

    let targetFlow = mockAdvancedFlow
    if (currentScenario === 'basic') {
      targetFlow = mockBasicFlow
    } else if (currentScenario === 'intermediate') {
      targetFlow = mockIntermediateFlow
    }

    for (let i = 0; i < targetFlow.length; i++) {
      if (!isStreaming.value) break

      const chunk = targetFlow[i]

      if (chunk.type === 'tool-approval-request') {
        traceParser.handleTraceEvent(chunk)

        const approved = await new Promise<boolean>((resolve) => {
          pendingApproval.value = { resolve, id: chunk.id }
        })

        if (!approved) {
          i++
          await new Promise(resolve => setTimeout(resolve, 500))
          continue
        }
        await new Promise(resolve => setTimeout(resolve, 500))
        continue
      }

      traceParser.handleTraceEvent(chunk)

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

  function startMarkdownStream() {
    resetMarkdownStream()
    isMarkdownStreaming.value = true
    const fullText = TEMPLATES[selectedTemplate.value]
    let index = 0

    markdownTimer = setInterval(() => {
      if (index < fullText.length) {
        streamText.value += fullText.slice(index, index + 4)
        index += 4
      } else {
        if (markdownTimer) {
          clearInterval(markdownTimer)
        }
        streamText.value = fullText
        isMarkdownStreaming.value = false
      }
    }, streamSpeed.value)
  }

  function resetMarkdownStream() {
    if (markdownTimer) {
      clearInterval(markdownTimer)
      markdownTimer = null
    }
    streamText.value = ''
    isMarkdownStreaming.value = false
    notification.value = ''
  }

  function handleFeedback(errorMsg: string) {
    notification.value = "🔌 已捕获 Zod 报错，正在回喂给大模型触发 Self-Correction 闭环..."
    isMarkdownStreaming.value = true
    streamText.value = ''

    setTimeout(() => {
      streamText.value = `抱歉，刚才 values 输出的参数 structure 存在校验问题（Zod 报错已捕获回喂）。我已经对其进行了修正，已重新输出符合 Schema 规格的数据：\n\n<df-bar-chart dataset='{"title":"季度已修正数据（自我纠错成功）","values":[95, 140, 185]}'></df-bar-chart>\n\n数据现在已经过 Zod Schema 规则的强校对，原生 Vue 组件已被安全挂载上屏。`
      isMarkdownStreaming.value = false
      notification.value = "✅ 大模型自我纠错成功！新数据已完美渲染。"
      setTimeout(() => {
        notification.value = ''
      }, 3000)
    }, 1500)
  }

  return {
    isStreaming,
    pendingApproval,
    selectedTemplate,
    streamText,
    isMarkdownStreaming,
    notification,
    streamSpeed,
    onUserApprove,
    onUserReject,
    onUserToggleCollapse,
    startSimulation,
    handleReset,
    startMarkdownStream,
    resetMarkdownStream,
    handleFeedback,
  }
}
