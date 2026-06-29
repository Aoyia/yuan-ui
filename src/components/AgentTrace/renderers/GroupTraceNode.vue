<script setup lang="ts">
import { computed } from 'vue'
import { ChevronDown, ChevronRight, Loader2, Folder, FolderOpen } from '@lucide/vue'
import type { AgentTraceNode, TraceStatus } from '../types'
import { useAgentTraceContext } from '../context'

interface Props {
  id: string
  title: string
  status?: TraceStatus
  duration?: number
  isCollapsed?: boolean
  allNodes?: AgentTraceNode[]
}

const props = withDefaults(defineProps<Props>(), {
  status: 'pending',
  isCollapsed: true,
  allNodes: () => [],
})

const emit = defineEmits<{
  (e: 'toggle'): void
  (e: 'update:isCollapsed', collapsed: boolean): void
}>()

const statusClass = computed(() => {
  return {
    'status-complete': props.status === 'complete',
    'status-active': props.status === 'active',
    'status-pending': props.status === 'pending',
    'status-error': props.status === 'error',
    'status-cancelled': props.status === 'cancelled',
  }
})

const hasActiveChildren = computed(() => {
  return props.allNodes.some(
    child => child.parentId === props.id && child.status === 'active'
  )
})

const childStepsCount = computed(() => {
  return props.allNodes.filter(n => n.parentId === props.id).length
})

const { toggleCollapse } = useAgentTraceContext()

function handleToggle() {
  if (toggleCollapse && props.id) {
    toggleCollapse(props.id)
  }
  emit('toggle')
  emit('update:isCollapsed', !props.isCollapsed)
}
</script>

<template>
  <div class="yuan-trace-node group-node" :class="[statusClass, { 'is-active-group': props.status === 'active' || hasActiveChildren }]">
    <div class="timeline-container">
      <div class="icon-bubble" @click="handleToggle">
        <slot name="icon">
          <Loader2 v-if="props.status === 'active'" class="icon-active spin" />
          <FolderOpen v-else-if="!props.isCollapsed" class="icon-folder" />
          <Folder v-else class="icon-folder" />
        </slot>
      </div>
    </div>

    <div class="step-details">
      <!-- 头部折叠控制条 -->
      <button type="button" class="group-header-bar" @click="handleToggle">
        <div class="header-left-info">
          <span class="group-label">{{ props.title }}</span>
          <span v-if="props.duration !== undefined" class="group-duration">
            {{ props.duration }}s
          </span>
        </div>
        <div class="header-right-controls">
          <span class="group-child-count">
            {{ childStepsCount }} steps
          </span>
          <component :is="props.isCollapsed ? ChevronRight : ChevronDown" class="toggle-chevron" />
        </div>
      </button>

      <!-- 子节点折叠层级容器 -->
      <div class="grid-transition" :class="{ 'is-expanded': !props.isCollapsed }">
        <div class="grid-transition-inner">
          <div class="group-children-list">
            <slot />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.yuan-trace-node {
  display: flex;
  position: relative;
  width: 100%;
  font-size: 0.78rem;
  animation: yuan-slide-in 0.22s cubic-bezier(0.4, 0, 0.2, 1);
  padding: 0.2rem 0;
}

@keyframes yuan-slide-in {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.timeline-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-right: 0.65rem;
  width: 1.1rem;
  position: relative;
  flex-shrink: 0;
}

.icon-bubble {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.1rem;
  height: 1.1rem;
  z-index: 3;
  background-color: transparent;
  cursor: pointer;
  transition: transform 0.15s ease;
}

.icon-bubble:hover {
  transform: scale(1.05);
}

.icon-active {
  width: 0.75rem;
  height: 0.75rem;
  color: #0071e3;
}

.icon-folder {
  width: 0.75rem;
  height: 0.75rem;
  color: #86868b;
}

.dark .icon-folder {
  color: #71717a;
}



.step-details {
  flex: 1;
}

/* 极简折叠栏 */
.group-header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  text-align: left;
  background: transparent;
  border: none;
  padding: 0 0 0.15rem 0;
  cursor: pointer;
  outline: none;
  font-family: inherit;
  user-select: none;
}

.header-left-info {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.group-label {
  font-weight: 600;
  color: #1d1d1f;
  font-size: 0.82rem;
}

.dark .group-label {
  color: #f4f4f5;
}

.group-duration {
  font-size: 0.7rem;
  color: #86868b;
}

.header-right-controls {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: #86868b;
}

.group-child-count {
  font-size: 0.7rem;
  color: #86868b;
  font-weight: 500;
}

.toggle-chevron {
  width: 0.75rem;
  height: 0.75rem;
  color: #86868b;
  transition: transform 0.15s ease;
}

/* 移去引导线，仅保留左缩进以最克制的形式表达层级 */
.group-children-list {
  padding-left: 0.85rem;
  margin-left: 0.55rem;
  margin-top: 0.15rem;
  margin-bottom: 0.35rem;
  position: relative;
}

/* Grid 折叠高度过渡动画 */
.grid-transition {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.28s cubic-bezier(0.4, 0, 0.2, 1);
}
.grid-transition.is-expanded {
  grid-template-rows: 1fr;
}
.grid-transition-inner {
  overflow: hidden;
}

/* 状态修饰 */
.status-complete .group-label {
  color: #515154;
}
.dark .status-complete .group-label {
  color: #a1a1aa;
}

.status-complete .icon-folder {
  color: #a1a1aa;
}
.dark .status-complete .icon-folder {
  color: #52525b;
}

.status-active .group-label {
  color: #0071e3;
}
.dark .status-active .group-label {
  color: #2997ff;
}

.status-pending .group-label {
  color: #d1d1d6;
}
.dark .status-pending .group-label {
  color: #3f3f46;
}
</style>
