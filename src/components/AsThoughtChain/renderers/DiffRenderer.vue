<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { FileCode } from '@lucide/vue'

interface Props {
  filePath?: string
  diff?: string
}

const props = defineProps<Props>()

const parsedLines = computed(() => {
  if (!props.diff) return []
  const lines = props.diff.split('\n')
  return lines.map((line, index) => {
    let type = 'normal'
    if (line.startsWith('+') && !line.startsWith('+++')) {
      type = 'add'
    } else if (line.startsWith('-') && !line.startsWith('---')) {
      type = 'delete'
    } else if (line.startsWith('@@')) {
      type = 'info'
    }
    return {
      id: index,
      content: line,
      type
    }
  })
})

const isExpanded = ref(false)
const contentWrapper = ref<HTMLElement | null>(null)
const dynamicMaxHeight = ref('160px')
const hasMore = computed(() => parsedLines.value.length > 15)

const handleExpand = () => {
  if (!contentWrapper.value) return
  dynamicMaxHeight.value = '160px'
  nextTick(() => {
    if (contentWrapper.value) {
      // Force repaint to ensure the transition is triggered
      contentWrapper.value.getBoundingClientRect()
      dynamicMaxHeight.value = `${contentWrapper.value.scrollHeight}px`
    }
    isExpanded.value = true
  })
}

const handleTransitionEnd = (event: TransitionEvent) => {
  if (event.propertyName === 'max-height' && isExpanded.value) {
    dynamicMaxHeight.value = 'none'
  }
}
</script>

<template>
  <div class="yuan-diff-renderer">
    <div v-if="filePath" class="diff-file-header">
      <FileCode class="file-icon" />
      <span class="file-path">{{ filePath }}</span>
    </div>
    <div 
      ref="contentWrapper"
      class="diff-body" 
      :class="{ 'collapsible': hasMore, 'collapsed': !isExpanded }"
      :style="hasMore ? { maxHeight: dynamicMaxHeight } : {}"
      @transitionend="handleTransitionEnd"
    >
      <div 
        v-for="line in parsedLines" 
        :key="line.id" 
        class="diff-line" 
        :class="`diff-${line.type}`"
      >
        <span class="line-content">{{ line.content }}</span>
      </div>
      <div v-if="hasMore && !isExpanded" class="diff-fade-mask">
        <button type="button" class="expand-btn" @click="handleExpand">
          展开全部代码修改 (共 {{ parsedLines.length }} 行)
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.yuan-diff-renderer {
  border: 1px solid var(--yuan-border);
  border-radius: 6px;
  overflow: hidden;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.7rem;
  background-color: var(--yuan-bg);
  margin-top: 0.25rem;
}

.yuan-diff-renderer pre {
  border: none;
}

.diff-file-header {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.3rem 0.5rem;
  border-bottom: 1px solid var(--yuan-border);
  color: var(--yuan-text-secondary);
  background-color: var(--yuan-bg-muted);
  font-weight: 600;
  font-size: 0.7rem;
}

.file-icon {
  width: 0.75rem;
  height: 0.75rem;
  color: var(--yuan-text-secondary);
}

.file-path {
  word-break: break-all;
}

.diff-body {
  position: relative;
  padding: 0.15rem 0;
}

.diff-body.collapsible {
  transition: max-height 0.3s cubic-bezier(0.25, 1, 0.5, 1);
  overflow: hidden;
}

.diff-line {
  padding: 0.05rem 0.5rem;
  white-space: pre;
  display: flex;
  align-items: center;
}

.diff-add {
  background-color: rgba(0, 180, 42, 0.08);
  color: var(--yuan-success);
  border-left: 3px solid var(--yuan-success);
}

.diff-delete {
  background-color: rgba(245, 63, 63, 0.08);
  color: var(--yuan-error);
  border-left: 3px solid var(--yuan-error);
}

.diff-info {
  background-color: var(--yuan-primary-light);
  color: var(--yuan-primary);
  border-left: 3px solid var(--yuan-primary);
  font-weight: 500;
}

.diff-normal {
  color: var(--yuan-text-tertiary);
  border-left: 3px solid transparent;
}

.diff-fade-mask {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 48px;
  background: linear-gradient(to bottom, transparent, var(--yuan-bg) 100%);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 8px;
  pointer-events: none;
}

.expand-btn {
  pointer-events: auto;
  font-family: inherit;
  font-size: 0.7rem;
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

