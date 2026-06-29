<script setup lang="ts">
import { computed } from 'vue'
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
</script>

<template>
  <div class="yuan-diff-renderer">
    <div v-if="filePath" class="diff-file-header">
      <FileCode class="file-icon" />
      <span class="file-path">{{ filePath }}</span>
    </div>
    <div class="diff-body">
      <div 
        v-for="line in parsedLines" 
        :key="line.id" 
        class="diff-line" 
        :class="`diff-${line.type}`"
      >
        <span class="line-content">{{ line.content }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.yuan-diff-renderer {
  border: 1px solid #f1f5f9;
  border-radius: 6px;
  overflow: hidden;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.7rem;
  background-color: #fafafa;
  margin-top: 0.25rem;
}

.dark .yuan-diff-renderer {
  border-color: #27272a;
  background-color: #181825;
}

.diff-file-header {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.3rem 0.5rem;
  border-bottom: 1px dashed #f1f5f9;
  color: #86868b;
  font-weight: 600;
  font-size: 0.7rem;
}

.dark .diff-file-header {
  border-bottom-color: #27272a;
  color: #a1a1aa;
}

.file-icon {
  width: 0.75rem;
  height: 0.75rem;
  color: #86868b;
}

.dark .file-icon {
  color: #a1a1aa;
}

.file-path {
  word-break: break-all;
}

.diff-body {
  max-height: 200px;
  overflow-y: auto;
  padding: 0.15rem 0;
  scrollbar-width: thin;
}

.diff-line {
  padding: 0.05rem 0.5rem;
  white-space: pre;
  display: flex;
  align-items: center;
}

.diff-add {
  background-color: rgba(52, 199, 89, 0.05); /* 3% 极淡的苹果绿微透明 */
  color: #248a3d;
  border-left: 2px solid #34c759;
}

.dark .diff-add {
  background-color: rgba(52, 199, 89, 0.1);
  color: #30d158;
}

.diff-delete {
  background-color: rgba(255, 59, 48, 0.05); /* 3% 极淡的苹果红微透明 */
  color: #b3261e;
  border-left: 2px solid #ff3b30;
}

.dark .diff-delete {
  background-color: rgba(255, 59, 48, 0.1);
  color: #ff453a;
}

.diff-info {
  background-color: rgba(0, 113, 227, 0.04);
  color: #0071e3;
  border-left: 2px solid #0071e3;
  font-weight: 500;
  opacity: 0.9;
}

.dark .diff-info {
  background-color: rgba(41, 151, 255, 0.08);
  color: #2997ff;
  border-left: 2px solid #2997ff;
}

.diff-normal {
  color: #86868b;
  border-left: 2px solid transparent;
}

.dark .diff-normal {
  color: #a1a1aa;
}
</style>
