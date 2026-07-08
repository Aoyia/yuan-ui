<script setup lang="ts">
import { computed, ref } from 'vue'
import { Copy, Check } from '@lucide/vue'

interface Props {
  title?: string
  command?: string
  output?: string
  errorText?: string
}

const props = defineProps<Props>()

const copied = ref(false)

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).then(() => {
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  })
}

const parsedHtml = computed(() => {
  const source = props.errorText || props.output || ''
  if (!source) return ''
  
  const clean = source
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  let html = ''
  let currentClass = ''
  const regex = /\x1B\[([0-9;]*)m/g
  let lastIndex = 0
  let match

  while ((match = regex.exec(clean)) !== null) {
    const plainText = clean.slice(lastIndex, match.index)
    if (plainText) {
      html += currentClass ? `<span class="${currentClass}">${plainText}</span>` : plainText
    }
    const codes = match[1].split(';')
    for (const code of codes) {
      if (code === '0') {
        currentClass = ''
      } else if (code === '31') {
        currentClass = 'ansi-red'
      } else if (code === '32') {
        currentClass = 'ansi-green'
      } else if (code === '33') {
        currentClass = 'ansi-yellow'
      } else if (code === '34') {
        currentClass = 'ansi-blue'
      } else if (code === '35') {
        currentClass = 'ansi-magenta'
      } else if (code === '36') {
        currentClass = 'ansi-cyan'
      } else if (code === '90') {
        currentClass = 'ansi-gray'
      }
    }
    lastIndex = regex.lastIndex
  }
  const remaining = clean.slice(lastIndex)
  if (remaining) {
    html += currentClass ? `<span class="${currentClass}">${remaining}</span>` : remaining
  }
  return html
})
</script>

<template>
  <div class="yuan-terminal-renderer">
    <!-- 悬浮复制按钮，仅在 Hover 时呈现，极其雅致 -->
    <button 
      v-if="command || output || errorText"
      type="button" 
      class="hover-copy-btn" 
      @click="copyToClipboard(command || output || errorText || '')"
      title="Copy raw content"
    >
      <component :is="copied ? Check : Copy" class="copy-icon" :class="{ 'copied': copied }" />
    </button>

    <div class="terminal-body">
      <div v-if="command" class="terminal-command-line">
        <span class="prompt">$</span>
        <span class="command-text">{{ command }}</span>
      </div>
      <div v-if="parsedHtml" class="terminal-output-container">
        <pre class="terminal-output" :class="{ 'has-error': !!props.errorText }"><code v-html="parsedHtml"></code></pre>
      </div>
    </div>
  </div>
</template>

<style scoped>
.yuan-terminal-renderer {
  position: relative;
  border-radius: 6px;
  background-color: #0b0f19; /* 墨灰蓝 */
  border: 1px solid var(--yuan-border);
  overflow: hidden;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  margin-top: 0.25rem;
}

.dark .yuan-terminal-renderer {
  background-color: #11111b;
}

.hover-copy-btn {
  position: absolute;
  top: 0.35rem;
  right: 0.35rem;
  background-color: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--yuan-border-light, rgba(255, 255, 255, 0.05));
  cursor: pointer;
  color: var(--yuan-text-tertiary);
  padding: 0.2rem;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.15s ease;
  z-index: 10;
}

.yuan-terminal-renderer:hover .hover-copy-btn {
  opacity: 1;
}

.hover-copy-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.copy-icon {
  width: 0.75rem;
  height: 0.75rem;
}

.copy-icon.copied {
  color: #34c759;
}

.terminal-body {
  padding: 0.6rem;
  font-size: 0.7rem;
  line-height: 1.45;
}

.terminal-command-line {
  display: flex;
  align-items: flex-start;
  gap: 0.4rem;
  color: #f9e2af;
  margin-bottom: 0.35rem;
}

.prompt {
  color: #89b4fa;
  font-weight: 600;
  user-select: none;
}

.command-text {
  word-break: break-all;
  font-weight: 500;
}

.terminal-output-container {
  overflow-x: auto;
}

.terminal-output {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
  color: #cdd6f4;
  max-height: 180px;
  overflow-y: auto;
  scrollbar-width: thin;
}

.terminal-output.has-error {
  color: #f38ba8;
}

/* 精调 ANSI 色彩表现 */
:deep(.ansi-red) {
  color: #f38ba8;
}
:deep(.ansi-green) {
  color: #a6e3a1;
}
:deep(.ansi-yellow) {
  color: #f9e2af;
}
:deep(.ansi-blue) {
  color: #89b4fa;
}
:deep(.ansi-magenta) {
  color: #f5c2e7;
}
:deep(.ansi-cyan) {
  color: #89dceb;
}
:deep(.ansi-gray) {
  color: #6c7086;
}
</style>
