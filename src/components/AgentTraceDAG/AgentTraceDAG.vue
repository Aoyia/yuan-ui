<script setup lang="ts">
import { computed, ref } from 'vue'
import type { DAGNode, DAGTraceStatus } from './types'
import DAGTraceNode from './DAGTraceNode.vue'
import { computeBFSLayout, getBezierPath } from './layout'
import { useDAGLayout } from './useDAGLayout'
import DAGInspector from './DAGInspector.vue'

interface Props {
  nodes: DAGNode[]
  maxOutputLength?: number
}

const props = withDefaults(defineProps<Props>(), {
  maxOutputLength: 600,
})

const emit = defineEmits<{
  (e: 'node-click', id: string): void
}>()

const containerRef = ref<HTMLElement | null>(null)
const nodeElements = ref<Record<string, HTMLElement>>({})

const selectedNodeId = ref<string>('')
const selectedNode = computed(() => props.nodes.find(node => node.id === selectedNodeId.value))

// 1. 拓扑分层布局算法 (BFS Layering)
const columns = computed(() => {
  return computeBFSLayout(props.nodes)
})

// 2. 调用连线 Hook 处理 SVG 连线和 ResizeObserver 自动重绘逻辑
const nodesRef = computed(() => props.nodes)
const { links } = useDAGLayout({
  containerRef,
  nodeElements,
  nodes: nodesRef
})

// 注册气泡节点 DOM 元素句柄
function registerNodeEl(id: string, el: any) {
  if (el) {
    // Vue 3 组件 ref 在组件上获取的是组件实例，如果是 HTML 元素则直接获取 DOM
    nodeElements.value[id] = el.$el || el
  } else {
    delete nodeElements.value[id]
  }
}

// 连线的样式类
function getLinkClass(status: DAGTraceStatus) {
  return {
    'link-complete': status === 'complete',
    'link-active': status === 'active',
    'link-pending': status === 'pending',
    'link-error': status === 'error',
    'link-cancelled': status === 'cancelled',
    'link-pruned': status === 'pruned',
  }
}

function handleNodeClick(id: string) {
  selectedNodeId.value = id
  emit('node-click', id)
}
</script>

<template>
  <div class="dag-flex-layout">
    <!-- 左栏拓扑画布 -->
    <div class="yuan-dag-container" ref="containerRef">
      <!-- 背景极简科技感的网格/渐变 -->
      <div class="dag-grid-bg"></div>

      <!-- 拓扑连接层 (SVG 画布) -->
      <svg class="dag-svg-canvas" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <!-- 激活连线的光亮点动画渐变 -->
          <linearGradient id="glow-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="rgba(59, 130, 246, 0.1)" />
            <stop offset="50%" stop-color="rgba(59, 130, 246, 1)" />
            <stop offset="100%" stop-color="rgba(59, 130, 246, 0.1)" />
          </linearGradient>
        </defs>

        <g v-for="link in links" :key="link.id">
          <!-- 底层虚化发光通道 (仅 active) -->
          <path 
            v-if="link.status === 'active'"
            :d="getBezierPath(link.x1, link.y1, link.x2, link.y2)"
            class="link-glow-underlay"
          />
          
          <!-- 基础实线/虚线 -->
          <path 
            :d="getBezierPath(link.x1, link.y1, link.x2, link.y2)"
            class="link-path"
            :class="getLinkClass(link.status)"
          />

          <!-- 顶层流光动画 (仅 active) -->
          <path 
            v-if="link.status === 'active'"
            :d="getBezierPath(link.x1, link.y1, link.x2, link.y2)"
            class="link-flow-overlay"
          />
        </g>
      </svg>

      <!-- 节点容器层 (分列布局) -->
      <div class="dag-columns-wrapper">
        <div 
          v-for="col in columns" 
          :key="col.level" 
          class="dag-column"
        >
          <div class="column-level-header">
            <span class="level-indicator">STEP {{ col.level + 1 }}</span>
          </div>
          
          <div class="column-nodes-list">
            <DAGTraceNode
              v-for="node in col.nodes"
              :key="node.id"
              :ref="(el) => registerNodeEl(node.id, el)"
              v-bind="node"
              :max-output-length="maxOutputLength"
              :is-selected="node.id === selectedNodeId"
              @click="handleNodeClick"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 右栏详情抽屉面板 (Inspector) -->
    <Transition name="slide">
      <DAGInspector
        v-if="selectedNode"
        :selected-node="selectedNode"
        :max-output-length="maxOutputLength"
        @close="selectedNodeId = ''"
      />
    </Transition>
  </div>
</template>

<style scoped>
.dag-flex-layout {
  display: flex;
  width: 100%;
  height: 100%;
  min-height: 500px;
  overflow: hidden;
  position: relative;
}

.yuan-dag-container {
  flex: 1;
  position: relative;
  overflow-x: auto;
  overflow-y: auto;
  box-sizing: border-box;
  padding: 1.5rem;
  scrollbar-width: thin;
}

/* 科技感的背景网格 */
.dag-grid-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  background-image: radial-gradient(rgba(0, 0, 0, 0.03) 1px, transparent 1px);
  background-size: 20px 20px;
  z-index: 0;
}

.dark .dag-grid-bg {
  background-image: radial-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px);
}

/* SVG SVG 连线画布 */
.dag-svg-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

/* 节点列包裹器 */
.dag-columns-wrapper {
  display: flex;
  gap: 5.5rem; /* 列间距，为 SVG 连线空出美观的宽度 */
  position: relative;
  z-index: 2;
  width: max-content;
}

.dag-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 280px;
  flex-shrink: 0;
}

.column-level-header {
  font-size: 0.6875rem;
  font-weight: 700;
  color: #64748b;
  letter-spacing: 0.05em;
  padding: 0.35rem 0.75rem;
  border-radius: 20px;
  background: rgba(0, 0, 0, 0.02);
  border: 1px solid rgba(0, 0, 0, 0.03);
  margin-bottom: 1.5rem;
  user-select: none;
}
.dark .column-level-header {
  color: #94a3b8;
  background: rgba(255, 255, 255, 0.02);
  border-color: rgba(255, 255, 255, 0.03);
}

.column-nodes-list {
  display: flex;
  flex-direction: column;
  gap: 2rem; /* 节点行间距 */
  width: 100%;
}

/* SVG 连线路径样式 */
.link-path {
  fill: none;
  stroke: #cbd5e1;
  stroke-width: 1.5px;
  transition: d 0.3s cubic-bezier(0.25, 1, 0.5, 1), stroke 0.3s ease;
}
.dark .link-path {
  stroke: #334155;
}

.link-complete {
  stroke: #94a3b8;
  stroke-width: 1.5px;
}
.dark .link-complete {
  stroke: #475569;
}

.link-active {
  stroke: #3b82f6;
  stroke-width: 2px;
}

.link-error {
  stroke: #ef4444;
  stroke-width: 2px;
}

.link-pruned {
  stroke: #e2e8f0;
  stroke-width: 1px;
  stroke-dasharray: 4;
  opacity: 0.4;
}
.dark .link-pruned {
  stroke: #1e293b;
}

/* 激活的连线流光和发光效果 */
.link-glow-underlay {
  fill: none;
  stroke: rgba(59, 130, 246, 0.25);
  stroke-width: 6px;
  filter: blur(2px);
}

.link-flow-overlay {
  fill: none;
  stroke: url(#glow-gradient);
  stroke-width: 2px;
  stroke-dasharray: 15 35;
  animation: flow-dash 1.8s infinite linear;
}

@keyframes flow-dash {
  to {
    stroke-dashoffset: -50;
  }
}



/* Transitions */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
</style>

