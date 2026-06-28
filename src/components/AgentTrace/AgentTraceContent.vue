<script setup lang="ts">
import { useAgentTraceContext } from './context'

const { isOpen } = useAgentTraceContext()
</script>

<template>
  <div class="yuan-agent-trace-content-wrapper" :class="{ 'is-open': isOpen }">
    <div class="yuan-agent-trace-content-inner">
      <div class="yuan-agent-trace-content">
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 外层容器使用 Grid 实现高度伸缩过渡 */
.yuan-agent-trace-content-wrapper {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.yuan-agent-trace-content-wrapper.is-open {
  grid-template-rows: 1fr;
}

/* 内层容器提供淡入淡出、上下滑出滑入的物理质感动效 */
.yuan-agent-trace-content-inner {
  overflow: hidden;
  opacity: 0;
  transform: translateY(-8px);
  transition: opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1),
              transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.yuan-agent-trace-content-wrapper.is-open .yuan-agent-trace-content-inner {
  opacity: 1;
  transform: translateY(0);
  transition: opacity 0.28s cubic-bezier(0.4, 0, 0.2, 1),
              transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
}

.yuan-agent-trace-content {
  padding: 0.75rem 0.5rem 0.5rem 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0;
  max-height: 280px; /* 限制超长链的最大高度 */
  overflow-y: auto;  /* 允许内部滑动 */
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.1) transparent;
  -webkit-overflow-scrolling: touch;
}

/* 极简隐藏式滚动条，平时隐藏，Hover 时呈现微浅轨道，极具 Apple 质感 */
.yuan-agent-trace-content::-webkit-scrollbar {
  width: 4px;
}

.yuan-agent-trace-content::-webkit-scrollbar-track {
  background: transparent;
}

.yuan-agent-trace-content::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.08);
  border-radius: 9999px;
  transition: background 0.2s ease;
}

.yuan-agent-trace-content:hover::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.18);
}
</style>
