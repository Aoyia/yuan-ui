import { ref, watch, computed, type Ref } from 'vue'
import { nanoid } from 'nanoid'
import type { ChainOfThoughtStepItem } from './context'

export interface QwenParserOptions {
  streamingReasoningText?: Ref<string>
  streamingContentText?: Ref<string>
  autoSplit?: boolean // 是否自动根据换行段落切分
}

export function useQwenReasoningParser(options: QwenParserOptions = {}) {
  const steps = ref<ChainOfThoughtStepItem[]>([])
  const content = ref('')
  const isReasoning = ref(false)
  const totalDuration = ref(0)

  const autoSplit = options.autoSplit ?? true

  let totalStartTime: number | null = null
  let activeStepIndex = -1

  const accumulatedReasoning = ref('')

  function startReasoningTimer() {
    if (!totalStartTime) {
      totalStartTime = Date.now()
      isReasoning.value = true
    }
  }

  function stopReasoningTimer() {
    if (totalStartTime) {
      totalDuration.value = Math.ceil((Date.now() - totalStartTime) / 1000)
      totalStartTime = null
      isReasoning.value = false

      steps.value.forEach(step => {
        if (step.status === 'active') {
          step.status = 'complete'
          step.duration = Math.ceil((Date.now() - step.startTime) / 1000)
        }
      })
      activeStepIndex = -1
    }
  }

  function handleChunk(delta: { reasoning_content?: string; content?: string }) {
    if (delta.reasoning_content) {
      startReasoningTimer()
      appendReasoningText(delta.reasoning_content)
    } else if (delta.content) {
      stopReasoningTimer()
      content.value += delta.content
    }
  }

  function appendReasoningText(text: string) {
    accumulatedReasoning.value += text

    if (steps.value.length === 0) {
      const newStep: ChainOfThoughtStepItem = {
        id: nanoid(),
        label: '开始分析问题',
        content: '',
        status: 'active',
        startTime: Date.now()
      }
      steps.value.push(newStep)
      activeStepIndex = 0
    }

    const currentStep = steps.value[activeStepIndex]
    if (!currentStep) return

    if (autoSplit) {
      const splitTriggers = ['\n\n', '\n* ', '\n- ', '\n1. ', '\n2. ', '\n3. ', '\n4. ', '\n5. ']
      let shouldSplit = false
      let matchedTrigger = ''

      for (const trigger of splitTriggers) {
        if (text.includes(trigger)) {
          shouldSplit = true
          matchedTrigger = trigger
          break
        }
      }

      if (shouldSplit && currentStep.content.trim().length > 10) {
        currentStep.status = 'complete'
        currentStep.duration = Math.ceil((Date.now() - currentStep.startTime) / 1000)

        const stepIndex = steps.value.length + 1
        let nextLabel = `阶段 ${stepIndex}：深入探讨`
        if (matchedTrigger.trim().length > 0 && matchedTrigger.startsWith('\n')) {
          const parts = text.split(matchedTrigger)
          if (parts.length > 1 && parts[1].trim().length > 0) {
            nextLabel = parts[1].trim().substring(0, 15)
          }
        }

        const newStep: ChainOfThoughtStepItem = {
          id: nanoid(),
          label: nextLabel,
          content: text.replace(matchedTrigger, '').trim(),
          status: 'active',
          startTime: Date.now()
        }
        steps.value.push(newStep)
        activeStepIndex = steps.value.length - 1
        return
      }
    }

    currentStep.content += text
  }

  function reset() {
    steps.value = []
    content.value = ''
    isReasoning.value = false
    totalDuration.value = 0
    totalStartTime = null
    activeStepIndex = -1
    accumulatedReasoning.value = ''
  }

  if (options.streamingReasoningText) {
    watch(options.streamingReasoningText, (newVal, oldVal) => {
      if (newVal) {
        startReasoningTimer()
        const newTokens = oldVal ? newVal.substring(oldVal.length) : newVal
        if (newTokens) {
          appendReasoningText(newTokens)
        }
      }
    })
  }

  if (options.streamingContentText) {
    watch(options.streamingContentText, (newVal, oldVal) => {
      if (newVal) {
        stopReasoningTimer()
        const newTokens = oldVal ? newVal.substring(oldVal.length) : newVal
        if (newTokens) {
          content.value += newTokens
        }
      }
    })
  }

  return {
    steps,
    content,
    isReasoning,
    totalDuration,
    handleChunk,
    reset
  }
}
