<script setup lang="ts">
import { useAgentTraceContext } from './context'

const { isOpen } = useAgentTraceContext()
</script>

<template>
  <div class="yuan-agent-trace__content" :class="{ 'yuan-agent-trace__content--open': isOpen }">
    <div class="yuan-agent-trace__content-inner">
      <div class="yuan-agent-trace__content-body">
        <slot />
      </div>
    </div>
  </div>
</template>

<style>
/* 外层容器使用 Grid 实现高度伸缩过渡 */
.yuan-agent-trace__content {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.32s cubic-bezier(0.25, 1, 0.5, 1);
}

.yuan-agent-trace__content--open {
  grid-template-rows: 1fr;
}

/* 内层容器提供物理淡入淡出动效，折叠时快速淡出防止字符挤压变形 */
.yuan-agent-trace__content-inner {
  overflow: hidden;
  opacity: 0;
  transform: translateY(-4px);
  transition: opacity 0.15s cubic-bezier(0.25, 1, 0.5, 1),
              transform 0.15s cubic-bezier(0.25, 1, 0.5, 1);
}

.yuan-agent-trace__content--open .yuan-agent-trace__content-inner {
  opacity: 1;
  transform: translateY(0);
  transition: opacity 0.3s cubic-bezier(0.25, 1, 0.5, 1),
              transform 0.3s cubic-bezier(0.25, 1, 0.5, 1);
}

.yuan-agent-trace__content-body {
  padding: 0.5rem 0.2rem 0.2rem 0.2rem;
  display: flex;
  flex-direction: column;
  gap: 0;
}
</style>
