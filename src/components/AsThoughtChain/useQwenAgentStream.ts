import { computed, ref } from 'vue'
import { useAgentTraceStream } from './useAgentTraceStream'

export interface QwenChunkDelta {
  choices?: Array<{
    delta?: {
      reasoning_content?: string
      content?: string
      tool_calls?: Array<{
        index: number
        id?: string
        type?: string
        function?: {
          name?: string
          arguments?: string
        }
      }>
    }
    finish_reason?: string | null
  }>
}

/**
 * 通义千问 (Qwen) / OpenAI SSE 流式 Chunk 前端适配器
 * 自动拼装推理字符、工具调用参数片段，并映射为组件可识别的事件。
 */
export function useQwenAgentStream(options?: {
  sensitiveTools?: string[]
}) {
  const traceStream = useAgentTraceStream()
  const sensitiveTools = options?.sensitiveTools || ['execute_command']

  // 内部追踪当前流式输入中的工具状态
  const activeTools = new Map<string, {
    id: string
    toolName: string
    title: string
    argBuffer: string
    hasStarted: boolean
  }>()

  // 追踪当前推理节点的 id
  let activeReasoningId: string | null = null

  function handleQwenChunk(chunk: QwenChunkDelta) {
    if (!chunk.choices || chunk.choices.length === 0) return
    const choice = chunk.choices[0]
    const delta = choice.delta
    if (!delta) return

    // 1. 推理思考流式渲染 (Reasoning)
    if (delta.reasoning_content) {
      if (!activeReasoningId) {
        activeReasoningId = 'qwen-reasoning-' + Date.now()
        traceStream.handleTraceEvent({
          type: 'reasoning-delta',
          id: activeReasoningId,
          title: '思考中...',
          delta: delta.reasoning_content
        })
      } else {
        traceStream.handleTraceEvent({
          type: 'reasoning-delta',
          id: activeReasoningId,
          delta: delta.reasoning_content
        })
      }
    }

    // 2. 工具调用流式渲染 (Tool Calls)
    if (delta.tool_calls && delta.tool_calls.length > 0) {
      activeReasoningId = null // 推理结束，关闭推理追踪

      for (const rawCall of delta.tool_calls) {
        const indexKey = String(rawCall.index)
        
        // 如果是新工具开启的首帧，包含 id 和 function name
        if (rawCall.id && rawCall.function?.name) {
          const toolName = rawCall.function.name
          const title = toolName === 'execute_command' 
            ? '执行系统命令' 
            : toolName === 'google_search' 
              ? '谷歌网页搜索' 
              : `调用工具 ${toolName}`

          activeTools.set(indexKey, {
            id: rawCall.id,
            toolName,
            title,
            argBuffer: '',
            hasStarted: false
          })
        }

        const currentTool = activeTools.get(indexKey)
        if (currentTool) {
          const argDelta = rawCall.function?.arguments || ''
          currentTool.argBuffer += argDelta

          if (!currentTool.hasStarted) {
            // 首帧触发输入开始
            traceStream.handleTraceEvent({
              type: 'tool-input-start',
              id: currentTool.id,
              toolName: currentTool.toolName,
              title: currentTool.title,
              input: argDelta
            })
            currentTool.hasStarted = true
          } else if (argDelta) {
            // 后续帧触发参数累加 delta
            traceStream.handleTraceEvent({
              type: 'tool-input-delta',
              id: currentTool.id,
              inputDelta: argDelta
            })
          }
        }
      }
    }

    // 3. 正文文本流式追加 (Content)
    if (delta.content) {
      activeReasoningId = null
      
      // 在正文输出前，如果是敏感工具（如 execute_command）且参数刚刚接收完毕，触发拦截审批
      for (const [indexKey, tool] of activeTools.entries()) {
        if (sensitiveTools.includes(tool.toolName)) {
          traceStream.handleTraceEvent({
            type: 'tool-approval-request',
            id: tool.id
          })
        }
        activeTools.delete(indexKey)
      }

      // 文本流式追加
      traceStream.handleTraceEvent({
        type: 'text-delta',
        delta: delta.content
      })
    }

    // 4. 流式结束处理 (Finish)
    if (choice.finish_reason === 'stop') {
      traceStream.handleTraceEvent({ type: 'finish' })
    }
  }

  return {
    ...traceStream,
    handleQwenChunk
  }
}
