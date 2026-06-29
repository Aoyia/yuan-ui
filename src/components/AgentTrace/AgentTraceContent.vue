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
  transition: grid-template-rows 0.32s cubic-bezier(0.25, 1, 0.5, 1);
}

.yuan-agent-trace-content-wrapper.is-open {
  grid-template-rows: 1fr;
}

/* 内层容器提供物理淡入淡出动效，折叠时快速淡出防止字符挤压变形 */
.yuan-agent-trace-content-inner {
  overflow: hidden;
  opacity: 0;
  transform: translateY(-4px);
  transition: opacity 0.15s cubic-bezier(0.25, 1, 0.5, 1),
              transform 0.15s cubic-bezier(0.25, 1, 0.5, 1);
}

.yuan-agent-trace-content-wrapper.is-open .yuan-agent-trace-content-inner {
  opacity: 1;
  transform: translateY(0);
  transition: opacity 0.3s cubic-bezier(0.25, 1, 0.5, 1),
              transform 0.3s cubic-bezier(0.25, 1, 0.5, 1);
}

.yuan-agent-trace-content {
  padding: 0.5rem 0.2rem 0.2rem 0.2rem;
  display: flex;
  flex-direction: column;
  gap: 0;
}
</style>
