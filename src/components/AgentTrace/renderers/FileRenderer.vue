<script setup lang="ts">
import { ref, computed } from 'vue'
import { File, FileJson, FileText, FileCode } from '@lucide/vue'

interface Props {
  filePath?: string
  content?: string
}

const props = defineProps<Props>()

const fileExtension = computed(() => {
  if (!props.filePath) return ''
  const parts = props.filePath.split('.')
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : ''
})

const fileIcon = computed(() => {
  const ext = fileExtension.value
  if (['json'].includes(ext)) return FileJson
  if (['js', 'ts', 'vue', 'html', 'css', 'go', 'rs', 'py'].includes(ext)) return FileCode
  if (['txt', 'md', 'log'].includes(ext)) return FileText
  return File
})

const isExpanded = ref(false)
const currentMaxHeight = ref<string | null>(null)
const contentWrapper = ref<HTMLElement | null>(null)

const totalLines = computed(() => props.content ? props.content.split('\n').length : 0)
const hasMore = computed(() => totalLines.value > 12)

const wrapperStyle = computed(() => {
  if (!hasMore.value) {
    return {}
  }
  if (isExpanded.value) {
    return { maxHeight: currentMaxHeight.value || 'none' }
  }
  return { maxHeight: '160px' }
})

const handleExpand = () => {
  if (!contentWrapper.value) return
  // 1. 获取真实 scrollHeight
  const scrollHeight = contentWrapper.value.scrollHeight
  currentMaxHeight.value = `${scrollHeight}px`
  isExpanded.value = true
}

const handleTransitionEnd = (event: TransitionEvent) => {
  if (event.propertyName === 'max-height' && isExpanded.value) {
    currentMaxHeight.value = null
  }
}
</script>

<template>
  <div class="yuan-file-renderer">
    <div class="file-header">
      <component :is="fileIcon" class="file-icon" :class="`icon-${fileExtension}`" />
      <span class="file-path">{{ filePath || '未知文件' }}</span>
    </div>
    <div v-if="content" class="file-content-preview">
      <div 
        ref="contentWrapper"
        class="content-wrapper" 
        :class="{ 'collapsible': hasMore, 'collapsed': !isExpanded }"
        :style="wrapperStyle"
        @transitionend="handleTransitionEnd"
      >
        <pre class="content-pre"><code>{{ content }}</code></pre>
        <div v-if="hasMore && !isExpanded" class="fade-mask">
          <button type="button" class="expand-btn" @click="handleExpand">
            展开全文 (共 {{ totalLines }} 行)
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.yuan-file-renderer {
  border: 1px solid var(--yuan-border);
  border-radius: 6px;
  overflow: hidden;
  font-size: 0.75rem;
  background-color: var(--yuan-bg);
  margin-top: 0.25rem;
}

.file-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.5rem;
  background-color: var(--yuan-bg-muted);
  border-bottom: 1px solid var(--yuan-border);
  color: var(--yuan-text-secondary);
  font-weight: 600;
}

.file-icon {
  width: 0.875rem;
  height: 0.875rem;
}

.icon-vue {
  color: #42b883;
}
.icon-js, .icon-ts {
  color: #eab308;
}
.icon-json {
  color: #a855f7;
}

.file-path {
  word-break: break-all;
  font-family: monospace;
}

.file-content-preview {
  padding: 0.5rem;
}

.content-wrapper {
  position: relative;
}

.content-wrapper.collapsible {
  transition: max-height 0.3s cubic-bezier(0.25, 1, 0.5, 1);
  overflow: hidden;
}

.content-pre {
  margin: 0;
  padding: 0.375rem;
  background-color: var(--yuan-bg-muted);
  border: none;
  border-radius: 4px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, monospace;
  white-space: pre-wrap;
  word-break: break-all;
  color: var(--yuan-text-primary);
  scrollbar-width: thin;
}

.fade-mask {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 48px;
  background: linear-gradient(to bottom, transparent, var(--yuan-bg-muted) 100%);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 8px;
  pointer-events: none;
}

.expand-btn {
  pointer-events: auto;
  font-family: inherit;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--yuan-text-primary);
  background-color: var(--yuan-bg);
  border: 1px solid var(--yuan-border);
  border-radius: 4px;
  padding: 4px 12px;
  cursor: pointer;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
}

.expand-btn:hover {
  background-color: var(--yuan-bg-muted);
  border-color: var(--yuan-text-secondary);
}
</style>
