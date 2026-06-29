<script setup lang="ts">
import { computed } from 'vue'
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

const previewText = computed(() => {
  if (!props.content) return ''
  const lines = props.content.split('\n')
  if (lines.length > 12) {
    return lines.slice(0, 10).join('\n') + '\n\n... [其余内容已被忽略以保持页面简洁]'
  }
  return props.content
})
</script>

<template>
  <div class="yuan-file-renderer">
    <div class="file-header">
      <component :is="fileIcon" class="file-icon" :class="`icon-${fileExtension}`" />
      <span class="file-path">{{ filePath || '未知文件' }}</span>
    </div>
    <div v-if="content" class="file-content-preview">
      <pre class="content-pre"><code>{{ previewText }}</code></pre>
    </div>
  </div>
</template>

<style scoped>
.yuan-file-renderer {
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  overflow: hidden;
  font-size: 0.75rem;
  background-color: #f8fafc;
  margin-top: 0.25rem;
}

.file-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.5rem;
  background-color: #f1f5f9;
  border-bottom: 1px solid #e2e8f0;
  color: #475569;
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

.content-pre {
  margin: 0;
  padding: 0.375rem;
  background-color: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, monospace;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 160px;
  overflow-y: auto;
  color: #334155;
  scrollbar-width: thin;
}
</style>
