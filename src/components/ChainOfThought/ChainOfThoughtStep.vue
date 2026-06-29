<script setup lang="ts">
import { Check, Loader2, Circle } from '@lucide/vue'
import { computed } from 'vue'

interface Props {
  label: string
  status?: 'complete' | 'active' | 'pending'
  duration?: number
}

const props = withDefaults(defineProps<Props>(), {
  status: 'complete',
  duration: undefined,
})

const statusClass = computed(() => {
  return {
    'status-complete': props.status === 'complete',
    'status-active': props.status === 'active',
    'status-pending': props.status === 'pending',
  }
})
</script>

<template>
  <div class="yuan-cot-step" :class="statusClass">
    <!-- 左侧 Timeline 连接链 -->
    <div class="timeline-container">
      <div class="icon-bubble">
        <slot name="icon">
          <div v-if="props.status === 'complete'" class="bubble-complete">
            <Check class="icon-check" />
          </div>
          <Loader2 v-else-if="props.status === 'active'" class="icon-active spin" />
          <Circle v-else class="icon-pending" />
        </slot>
      </div>
      <!-- 垂直细线 -->
      <div class="vertical-line" />
    </div>

    <!-- 右侧步骤详情 -->
    <div class="step-details">
      <div class="step-header">
        <span class="step-label">{{ props.label }}</span>
        <span v-if="props.duration !== undefined" class="step-duration">
          ({{ props.duration }}秒)
        </span>
      </div>
      <div class="step-body">
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped>
.yuan-cot-step {
  display: flex;
  position: relative;
  width: 100%;
  font-size: 0.875rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  animation: slideInFromTop 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideInFromTop {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 左侧时间线 */
.timeline-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-right: 0.75rem;
  width: 1.25rem;
  position: relative;
  flex-shrink: 0;
}

.icon-bubble {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  z-index: 2;
  background-color: #fff;
  transition: all 0.3s ease;
}

.bubble-complete {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1rem;
  height: 1rem;
  border-radius: 50%;
  background-color: #e2e8f0; /* 灰底，低对比度，淡出焦点 */
  color: #64748b; /* 灰勾 */
  transition: all 0.3s ease;
}

.icon-check {
  width: 0.7rem;
  height: 0.7rem;
  stroke-width: 3;
}

.icon-active {
  width: 0.875rem;
  height: 0.875rem;
  color: #7c3aed; /* 高亮紫色 */
}

.icon-pending {
  width: 0.75rem;
  height: 0.75rem;
  color: #e2e8f0;
}

.vertical-line {
  position: absolute;
  top: 1.25rem;
  bottom: 0;
  width: 1px;
  background-color: #e2e8f0; /* 极简实线 */
  z-index: 1;
}

.yuan-cot-step:last-child .vertical-line {
  display: none;
}

/* 右侧内容 */
.step-details {
  flex: 1;
  padding-bottom: 1rem;
}

.step-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  line-height: 1.25rem;
}

.step-label {
  font-size: 0.875rem;
  font-weight: 500;
  transition: color 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.step-duration {
  font-size: 0.75rem;
  color: #94a3b8;
}

.step-body {
  font-size: 0.8125rem;
  line-height: 1.5;
  margin-top: 0.25rem;
  transition: color 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 状态样式过渡 - 思考完毕变淡出视觉中心 */
.status-complete .step-label {
  color: #94a3b8; /* 思考完的步骤自动暗淡 */
}

.status-complete .step-body {
  color: #94a3b8;
}

.status-active .step-label {
  color: #1e293b; /* 活跃的步骤显示为高亮黑色 */
  font-weight: 600;
}

.status-active .step-body {
  color: #475569;
}

.status-pending .step-label {
  color: #cbd5e1; /* 未开始的步骤极淡 */
}

.status-pending .step-body {
  color: #cbd5e1;
}

/* 旋转 */
.spin {
  animation: spin 1s infinite linear;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
