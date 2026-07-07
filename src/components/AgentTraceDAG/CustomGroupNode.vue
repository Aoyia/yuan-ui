<script setup lang="ts">
import { computed } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import { ChevronUp, ChevronDown } from '@lucide/vue'

interface GroupProps {
  id: string
  data: {
    id: string
    title: string
    collapsed?: boolean
  }
}

const props = defineProps<GroupProps>()

const emit = defineEmits<{
  (e: 'toggle-collapse', id: string): void
}>()

const isCollapsed = computed(() => props.data.collapsed ?? false)

function toggle() {
  emit('toggle-collapse', props.data.id)
}
</script>

<template>
  <div 
    class="custom-group-container" 
    :class="{ 'is-collapsed': isCollapsed }"
  >
    <!-- 入度手柄 (顶部) -->
    <Handle 
      type="target" 
      :position="Position.Top" 
      class="group-handle handle-top" 
    />

    <div class="group-inner">
      <!-- 组顶栏 Header -->
      <div class="group-header">
        <span class="group-title">
          <span class="folder-icon">📁</span>
          {{ data.title }}
        </span>
        <button 
          type="button" 
          class="toggle-btn" 
          @click.stop="toggle"
          :title="isCollapsed ? '展开步骤组' : '折叠步骤组'"
        >
          <ChevronUp v-if="!isCollapsed" class="btn-icon" />
          <ChevronDown v-else class="btn-icon" />
        </button>
      </div>

      <!-- 引导辅助虚线 (仅展开状态展示) -->
      <div v-if="!isCollapsed" class="group-content-area">
        <span class="dashed-guideline"></span>
      </div>
    </div>

    <!-- 出度手柄 (底部) -->
    <Handle 
      type="source" 
      :position="Position.Bottom" 
      class="group-handle handle-bottom" 
    />
  </div>
</template>

<style scoped>
.custom-group-container {
  width: 100%;
  height: 100%;
  background: rgba(241, 245, 249, 0.35);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1.5px dashed rgba(148, 163, 184, 0.45);
  border-radius: 12px;
  padding: 12px;
  box-sizing: border-box;
  position: relative;
  transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
}

.dark .custom-group-container {
  background: rgba(30, 41, 59, 0.15);
  border-color: rgba(71, 85, 105, 0.45);
}

/* 折叠状态收拢极简 */
.custom-group-container.is-collapsed {
  border-style: solid;
  border-color: rgba(148, 163, 184, 0.6);
  background: rgba(241, 245, 249, 0.9);
  height: 40px !important;
  border-radius: 8px;
  padding: 8px 10px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.dark .custom-group-container.is-collapsed {
  background: rgba(30, 41, 59, 0.85);
  border-color: rgba(71, 85, 105, 0.6);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
}

.custom-group-container:hover {
  border-color: rgba(59, 130, 246, 0.5);
}

.group-inner {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 20px;
  user-select: none;
}

.is-collapsed .group-header {
  height: 100%;
}

.group-title {
  font-size: 11px;
  font-weight: 700;
  color: #475569;
  letter-spacing: 0.05em;
  display: flex;
  align-items: center;
  gap: 5px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dark .group-title {
  color: #94a3b8;
}

.folder-icon {
  font-size: 12px;
}

.toggle-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  border-radius: 4px;
  transition: background 0.15s;
}

.toggle-btn:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #1e293b;
}

.dark .toggle-btn:hover {
  background: rgba(255, 255, 255, 0.05);
  color: #cbd5e1;
}

.btn-icon {
  width: 14px;
  height: 14px;
}

.group-content-area {
  flex: 1;
  position: relative;
  margin-top: 8px;
}

/* 多级嵌套左侧引导线 */
.dashed-guideline {
  position: absolute;
  left: 8px;
  top: 4px;
  bottom: 4px;
  border-left: 1.5px dashed rgba(148, 163, 184, 0.35);
  pointer-events: none;
}

.dark .dashed-guideline {
  border-left-color: rgba(71, 85, 105, 0.35);
}

/* 连线手柄定制 (极简化) */
.group-handle {
  width: 8px !important;
  height: 8px !important;
  border: 2px solid #ffffff !important;
  background-color: #94a3b8 !important;
  transition: all 0.2s ease;
  opacity: 0; /* 默认隐藏，只在悬浮时显现 */
}

.custom-group-container:hover .group-handle {
  opacity: 1;
}

.dark .group-handle {
  border-color: #0f172a !important;
  background-color: #475569 !important;
}
</style>
