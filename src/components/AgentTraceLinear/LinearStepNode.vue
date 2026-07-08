<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue'

interface TreeNode {
  id: string
  kind: 'reasoning' | 'tool' | 'artifact' | 'text' | 'group' | 'root'
  title: string
  status: 'pending' | 'active' | 'complete' | 'error' | 'cancelled'
  startedAt?: number
  endedAt?: number
  duration?: number
  parentId?: string
  toolName?: string
  input?: any
  output?: any
  errorText?: string
  children?: TreeNode[]
  collapsed?: boolean
}

interface Props {
  node: TreeNode
  isStreaming?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isStreaming: false
})

const isCollapsed = ref(props.node.collapsed ?? false)
const contentRef = ref<HTMLElement | null>(null)
const childrenRef = ref<HTMLElement | null>(null)

const contentHeight = ref<string>('none')
const childrenHeight = ref<string>('none')

// 监听外界对折叠属性的修改 (例如一键折叠全部，或最终归口瞬间折叠)
watch(() => props.node.collapsed, (val) => {
  if (val !== undefined) {
    isCollapsed.value = val
  }
})

// 流式运行时，当前新产生的活动节点，默认保持展开
watch(() => props.node.status, (newStatus) => {
  if (newStatus === 'active') {
    isCollapsed.value = false
  }
})

// CSS transition 缓动高度管理器
watch(isCollapsed, async (newVal) => {
  await nextTick()
  const contentEl = contentRef.value
  const childrenEl = childrenRef.value

  if (!newVal) {
    // 展开: 先给定具体 px，过渡动画结束后释放为 none 自适应高度
    if (contentEl) contentHeight.value = contentEl.scrollHeight + 'px'
    if (childrenEl) childrenHeight.value = childrenEl.scrollHeight + 'px'
    
    setTimeout(() => {
      if (!isCollapsed.value) {
        contentHeight.value = 'none'
        childrenHeight.value = 'none'
      }
    }, 250)
  } else {
    // 折叠: 必须从 none 先转为 px 激活过渡，再设为 0px 闭合
    if (contentEl) {
      contentHeight.value = contentEl.scrollHeight + 'px'
      contentEl.offsetHeight // Force Reflow
      contentHeight.value = '0px'
    }
    if (childrenEl) {
      childrenHeight.value = childrenEl.scrollHeight + 'px'
      childrenEl.offsetHeight // Force Reflow
      childrenHeight.value = '0px'
    }
  }
}, { immediate: true })

// ----------------------------------------------------
// 终端控制台与 Diff 解析（第一性：防爆大文本渲染性能）
// ----------------------------------------------------
const isDiffTool = computed(() => ['write_file', 'replace_file_content', 'multi_replace_file_content', 'apply_patch'].includes(props.node.toolName || ''))
const isTerminalTool = computed(() => ['execute_command', 'run_command'].includes(props.node.toolName || ''))
const isFileTool = computed(() => ['read_file', 'view_file'].includes(props.node.toolName || ''))
const isSearchTool = computed(() => ['google_search', 'web_search'].includes(props.node.toolName || ''))

const terminalCommand = computed(() => {
  const input = props.node.input
  if (typeof input === 'string') return input
  if (input && typeof input === 'object') {
    return input.CommandLine || input.command || ''
  }
  return ''
})

const terminalOutput = computed(() => {
  const out = props.node.output
  if (typeof out === 'string') return out
  if (out && typeof out === 'object') {
    return out.content || out.stdout || JSON.stringify(out, null, 2)
  }
  return ''
})

const isLogCollapsed = ref(true)
function toggleLogExpand() {
  isLogCollapsed.value = !isLogCollapsed.value
}

// 智能判定是否有真正的 Diff 差异行，而非全量文件覆写
const diffInfo = computed(() => {
  const input = props.node.input as any
  const output = props.node.output as any
  
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
  
  const lines = diffText ? diffText.split('\n') : []
  // 第一性：若行数过多且全无增删标志，判定为全文本覆盖，退化为普通代码槽以防止 DOM 撑爆
  const hasDiffMarks = lines.some(line => line.startsWith('+') || line.startsWith('-') || line.startsWith('@@'))
  
  if (!hasDiffMarks) {
    return { diffText: '', parsedLines: [], rawContent: diffText }
  }

  const parsedLines = lines.map(line => {
    let type = 'normal'
    let sign = ' '
    let text = line

    if (line.startsWith('+')) {
      type = 'add'
      sign = '+'
      text = line.slice(1)
    } else if (line.startsWith('-')) {
      type = 'del'
      sign = '-'
      text = line.slice(1)
    } else if (line.startsWith('@@')) {
      type = 'info'
      sign = ' '
    }
    
    return { type, sign, text }
  })

  return { diffText, parsedLines, rawContent: '' }
})

// 判定节点是否包含可折叠的内容
const isExpandable = computed(() => {
  if (props.node.children && props.node.children.length > 0) return true
  if (props.node.kind === 'reasoning' && thoughtContent.value) return true
  if (isTerminalTool.value && (terminalCommand.value || terminalOutput.value)) return true
  if (isDiffTool.value && (diffInfo.value.diffText || diffInfo.value.rawContent)) return true
  if (isFileTool.value && fileContent.value) return true
  return false
})

function toggleCollapse() {
  if (isExpandable.value) {
    isCollapsed.value = !isCollapsed.value
  }
}

// ----------------------------------------------------
// 动词与宾语智能映射 (Typographic Contrast Parser)
// ----------------------------------------------------
const verb = computed(() => {
  const node = props.node
  if (node.kind === 'root') return 'Worked for'
  if (node.kind === 'group') return 'Worked for'
  if (node.kind === 'reasoning') return 'Thought for'
  
  if (node.kind === 'tool' && node.toolName) {
    const name = node.toolName
    if (['read_file', 'view_file'].includes(name)) return 'Explored'
    if (['write_file', 'replace_file_content', 'multi_replace_file_content', 'apply_patch'].includes(name)) return 'Edited'
    if (['execute_command', 'run_command'].includes(name)) return 'Ran'
    if (['google_search', 'web_search'].includes(name)) return 'Searched'
    return 'Analyzed'
  }
  
  return 'Used'
})

const object = computed(() => {
  const node = props.node
  if (node.kind === 'root' || node.kind === 'group') {
    return node.duration !== undefined ? `${node.duration}s` : '...'
  }
  if (node.kind === 'reasoning') {
    return node.duration !== undefined ? `${node.duration}s` : 'Thinking...'
  }
  
  if (node.kind === 'tool') {
    const input = node.input as any
    if (['read_file', 'view_file'].includes(node.toolName || '')) {
      const path = input?.path || input?.TargetFile || input?.AbsolutePath || ''
      return getBasename(path) || 'file'
    }
    if (['write_file', 'replace_file_content', 'multi_replace_file_content', 'apply_patch'].includes(node.toolName || '')) {
      const path = input?.TargetFile || input?.path || input?.AbsolutePath || ''
      return getBasename(path) || 'codebase'
    }
    if (['execute_command', 'run_command'].includes(node.toolName || '')) {
      return '1 command'
    }
    if (['google_search', 'web_search'].includes(node.toolName || '')) {
      return `"${input?.query || 'web'}"`
    }
    return node.title || node.toolName || 'tool'
  }
  
  return node.title || 'step'
})

function getBasename(path: string): string {
  if (!path) return ''
  const parts = path.split(/[/\\]/)
  return parts[parts.length - 1]
}

const icon = computed(() => {
  if (isDiffTool.value || isFileTool.value) return '📄'
  if (isSearchTool.value) return '🔍'
  return ''
})

// 思维文本
const thoughtContent = computed(() => {
  return props.node.output || props.node.input || ''
})

// 纯文本/文件内容兜底
const fileContent = computed(() => {
  const out = props.node.output
  if (typeof out === 'string') return out
  if (out && typeof out === 'object') {
    return (out as any).content || JSON.stringify(out, null, 2)
  }
  const input = props.node.input as any
  if (input && typeof input === 'object' && typeof input.CodeContent === 'string') {
    return input.CodeContent
  }
  return ''
})
</script>

<template>
  <div class="v2-item" :class="[node.status, { 'active': node.status === 'active', 'collapsed': isCollapsed }]">
    <!-- 头部行内样式：动词 + 图标 + 宾语 -->
    <div class="v2-header" @click="toggleCollapse">
      <span class="v2-verb">{{ verb }}</span>
      
      <!-- 文件或搜索图标 -->
      <span v-if="icon" class="v2-inline-icon">{{ icon }}</span>
      
      <!-- MCP 连线图标 -->
      <span v-else-if="node.kind === 'tool' && !isTerminalTool && !isDiffTool && !isFileTool" class="v2-inline-icon v2-icon-mcp">⇄</span>
      
      <!-- 终端命令行参数截断 -->
      <span v-if="isTerminalTool && terminalCommand" class="v2-cmd-param">{{ terminalCommand }}</span>
      <span v-else class="v2-object">{{ object }}</span>
      
      <!-- 活动中的蓝色 Spinner -->
      <span v-if="node.status === 'active'" class="v2-spinner"></span>
      
      <!-- 静态折叠箭头 -->
      <span v-else-if="isExpandable" class="v2-arrow">˅</span>
    </div>

    <!-- 展开详情区域 (第一性: 移除了 v-if 保证 DOM 稳定与 ScrollHeight 取值准确) -->
    <div 
      ref="contentRef"
      class="v2-content" 
      :style="{ maxHeight: contentHeight }"
    >
      <!-- A. 思维链 CoT 渲染 -->
      <div v-if="node.kind === 'reasoning' && thoughtContent" class="v2-CoT-text">
        <span v-html="thoughtContent"></span>
        <span v-if="node.status === 'active'" class="v2-cursor"></span>
      </div>

      <!-- B. Git Diff 差异渲染 -->
      <div v-else-if="isDiffTool && diffInfo.diffText" class="v2-tech-box">
        <div class="v2-diff-box">
          <div 
            v-for="(line, idx) in diffInfo.parsedLines" 
            :key="idx" 
            class="v2-diff-line" 
            :class="line.type"
          >
            <span class="v2-diff-sign">{{ line.sign }}</span>
            <span>{{ line.text }}</span>
          </div>
        </div>
      </div>

      <!-- C. 终端控制台 / 兜底普通全量代码槽 -->
      <div v-else-if="(isTerminalTool && terminalOutput) || (isDiffTool && diffInfo.rawContent) || (isFileTool && fileContent)" class="v2-tech-box">
        <pre 
          class="v2-tech-code"
          :style="{ maxHeight: isLogCollapsed ? '80px' : 'none', overflow: 'hidden' }"
        ><code>{{ terminalOutput || diffInfo.rawContent || fileContent }}</code></pre>
        <span class="v2-more-link" @click.stop="toggleLogExpand">
          {{ isLogCollapsed ? '展开全部日志' : '收起日志' }}
        </span>
      </div>
    </div>

    <!-- 子步骤递归渲染 (第一性: 移除了 v-if 保证层级参考线渲染绝对完整，且折叠动画不出现重绘抖动) -->
    <div 
      ref="childrenRef"
      class="v2-children"
      :style="{ maxHeight: childrenHeight }"
    >
      <LinearStepNode 
        v-for="subNode in node.children" 
        :key="subNode.id"
        :node="subNode"
        :is-streaming="isStreaming"
      />
    </div>
  </div>
</template>
