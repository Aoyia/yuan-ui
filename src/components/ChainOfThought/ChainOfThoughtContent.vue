<script setup lang="ts">
import { useChainOfThoughtContext } from './context'

const { isOpen } = useChainOfThoughtContext()
</script>

<template>
  <div class="yuan-cot-content-wrapper" :class="{ 'is-open': isOpen }">
    <div class="yuan-cot-content-inner">
      <div class="yuan-cot-content">
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 外层容器使用 Grid 实现高度伸缩过渡 */
.yuan-cot-content-wrapper {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.yuan-cot-content-wrapper.is-open {
  grid-template-rows: 1fr;
}

/* 内层容器提供淡入淡出、上下滑出滑入的物理质感动效 */
.yuan-cot-content-inner {
  overflow: hidden;
  opacity: 0;
  transform: translateY(-8px);
  transition: opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1),
              transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.yuan-cot-content-wrapper.is-open .yuan-cot-content-inner {
  opacity: 1;
  transform: translateY(0);
  transition: opacity 0.28s cubic-bezier(0.4, 0, 0.2, 1),
              transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
}

.yuan-cot-content {
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
.yuan-cot-content::-webkit-scrollbar {
  width: 4px;
}

.yuan-cot-content::-webkit-scrollbar-track {
  background: transparent;
}

.yuan-cot-content::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.08);
  border-radius: 9999px;
  transition: background 0.2s ease;
}

.yuan-cot-content:hover::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.18);
}
</style>
