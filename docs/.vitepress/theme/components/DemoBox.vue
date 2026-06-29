<script setup lang="ts">
import { ref } from 'vue'
import { Code, Copy, Check, ChevronDown, ChevronUp } from '@lucide/vue'

interface Props {
  title?: string
  description?: string
  code?: string // 展示的组件源码文本
}

const props = defineProps<Props>()

const isCollapsed = ref(true)
const copied = ref(false)

function toggleCode() {
  isCollapsed.value = !isCollapsed.value
}

function handleCopy() {
  if (!props.code) return
  navigator.clipboard.writeText(props.code).then(() => {
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 1800)
  })
}
</script>

<template>
  <div class="yuan-demo-box">
    <!-- 1. 标题与说明区域 -->
    <div v-if="title || description" class="demo-info-section">
      <div v-if="title" class="demo-title">{{ title }}</div>
      <div v-if="description" class="demo-description" v-html="description"></div>
    </div>

    <!-- 2. 组件实时交互运行槽 (Live Slot) -->
    <div class="demo-runtime-stage">
      <slot />
    </div>

    <!-- 3. 操作控制条 -->
    <div class="demo-control-bar">
      <button 
        type="button" 
        class="control-btn toggle-code-btn" 
        @click="toggleCode"
        :title="isCollapsed ? '展开源码' : '折叠源码'"
      >
        <Code class="ctrl-icon" />
        <span>{{ isCollapsed ? '查看代码' : '收起代码' }}</span>
        <component :is="isCollapsed ? ChevronDown : ChevronUp" class="chevron-icon" />
      </button>
      <button 
        v-if="code"
        type="button" 
        class="control-btn copy-code-btn" 
        @click="handleCopy"
        :title="copied ? '已复制' : '复制源码'"
      >
        <component :is="copied ? Check : Copy" class="ctrl-icon" :class="{ 'text-success': copied }" />
        <span>{{ copied ? '已复制' : '复制代码' }}</span>
      </button>
    </div>

    <!-- 4. 源码折叠块 (CSS Grid 高度过渡) -->
    <div v-if="code" class="demo-code-wrapper" :class="{ 'is-expanded': !isCollapsed }">
      <div class="demo-code-inner">
        <div class="code-container">
          <pre class="syntax-pre"><code>{{ code }}</code></pre>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.yuan-demo-box {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background-color: #fff;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
  margin: 1.5rem 0;
  overflow: hidden;
}

.dark .yuan-demo-box {
  border-color: #313244;
  background-color: #1e1e2e;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

/* 标题与描述 */
.demo-info-section {
  padding: 0.75rem 1rem;
  border-bottom: 1px dashed #e2e8f0;
  background-color: rgba(248, 250, 252, 0.5);
}

.dark .demo-info-section {
  border-bottom-color: #313244;
  background-color: rgba(24, 24, 37, 0.2);
}

.demo-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #0f172a;
}

.dark .demo-title {
  color: #cdd6f4;
}

.demo-description {
  font-size: 0.75rem;
  color: #64748b;
  margin-top: 0.25rem;
  line-height: 1.4;
}

.dark .demo-description {
  color: #a6adc8;
}

/* 组件运行时交互区 */
.demo-runtime-stage {
  padding: 1.5rem 1rem;
  display: flex;
  justify-content: center;
  align-items: center;
  background-image: radial-gradient(rgba(0, 0, 0, 0.03) 1px, transparent 1px);
  background-size: 16px 16px;
  background-color: #fff;
  min-height: 100px;
}

.dark .demo-runtime-stage {
  background-image: radial-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  background-color: #1e1e2e;
}

/* 底部操作面板 */
.demo-control-bar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 0.5rem 1rem;
  background-color: #f8fafc;
  border-top: 1px solid #e2e8f0;
  user-select: none;
}

.dark .demo-control-bar {
  background-color: #181825;
  border-top-color: #313244;
}

.control-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.75rem;
  color: #64748b;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.dark .control-btn {
  color: #a6adc8;
}

.control-btn:hover {
  background-color: rgba(0, 0, 0, 0.04);
  color: #0f172a;
}

.dark .control-btn:hover {
  background-color: rgba(255, 255, 255, 0.04);
  color: #cdd6f4;
}

.ctrl-icon {
  width: 0.85rem;
  height: 0.85rem;
}

.text-success {
  color: #10b981 !important;
}

.chevron-icon {
  width: 0.8rem;
  height: 0.8rem;
  margin-left: 0.1rem;
}

/* Grid 高度折叠动画 */
.demo-code-wrapper {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.28s cubic-bezier(0.4, 0, 0.2, 1);
  border-top: 1px solid transparent;
}

.demo-code-wrapper.is-expanded {
  grid-template-rows: 1fr;
  border-top: 1px solid #e2e8f0;
}

.dark .demo-code-wrapper.is-expanded {
  border-top-color: #313244;
}

.demo-code-inner {
  overflow: hidden;
}

.code-container {
  padding: 1rem;
  background-color: #0f172a; /* 统一暗色高亮背景 */
}

.dark .code-container {
  background-color: #11111b;
}

.syntax-pre {
  margin: 0;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.72rem;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-all;
  color: #f8fafc;
  max-height: 280px;
  overflow-y: auto;
  scrollbar-width: thin;
}

.dark .syntax-pre {
  color: #cdd6f4;
}
</style>
