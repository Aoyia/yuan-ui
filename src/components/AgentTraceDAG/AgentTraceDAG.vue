<script setup lang="ts">
import { ref, computed, watch, shallowRef, nextTick, onBeforeUnmount } from 'vue'
import { VueFlow, useVueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import type { DAGNode } from './types'
import { transformFlatToFlowElements } from './adapter'
import { computeDagreLayout } from './layout'
import CustomStepNode from './CustomStepNode.vue'
import CustomGroupNode from './CustomGroupNode.vue'
import DAGInspector from './DAGInspector.vue'

// 引入 Vue Flow 所需的主题及核心 CSS
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'

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

const selectedNodeId = ref<string>('')
const selectedNode = computed(() => props.nodes.find(node => node.id === selectedNodeId.value))

// 用 shallowRef 优化大图的响应式性能，避免 Vue 深入递归代理巨大的 Vue Flow 图对象
const flowNodes = shallowRef<any[]>([])
const flowEdges = shallowRef<any[]>([])

// 保存各步骤组的展开/收缩折叠映射表
const collapsedGroups = ref<Record<string, boolean>>({})

// 提取 Vue Flow 画布控制器实例
const { fitView, setCenter } = useVueFlow()

const nodeTypes = {
  step: CustomStepNode as any,
  group: CustomGroupNode as any
}

// 核心排版与重绘算法
function updateGraph() {
  // 1. 构建最新的节点属性（附带当前 UI 响应的折叠属性）
  const rawFlat = props.nodes.map(n => ({
    ...n,
    collapsed: collapsedGroups.value[n.id] ?? false
  }))

  // 2. 递归标记所有被折叠父节点所包裹的隐藏子节点
  const hiddenNodeIds = new Set<string>()
  rawFlat.forEach(node => {
    if (node.parentId) {
      // 如果其直接父级已折叠，或者其父级已被祖先折叠隐蔽，则该节点一并隐藏
      if (collapsedGroups.value[node.parentId] || hiddenNodeIds.has(node.parentId)) {
        hiddenNodeIds.add(node.id)
      }
    }
  })

  // 3. 将扁平数据结构映射适配为 Vue Flow elements
  const { nodes: parsedNodes, edges: parsedEdges } = transformFlatToFlowElements(rawFlat)

  // 4. 将隐藏状态附着到对应的节点和连线上
  const filteredNodes = parsedNodes.map(node => ({
    ...node,
    hidden: hiddenNodeIds.has(node.id)
  }))
  const filteredEdges = parsedEdges.map(edge => ({
    ...edge,
    hidden: hiddenNodeIds.has(edge.source) || hiddenNodeIds.has(edge.target)
  }))

  // 5. 调用 Dagre 自动排版引擎分配自上而下对齐坐标，并更新 Group 尺寸
  const positionedNodes = computeDagreLayout(filteredNodes, filteredEdges, true)

  flowNodes.value = positionedNodes
  flowEdges.value = filteredEdges
}

let updateTimeout: any = null

function debouncedUpdateGraph() {
  clearTimeout(updateTimeout)
  updateTimeout = setTimeout(() => {
    updateGraph()
    updateTimeout = null
  }, 60)
}

onBeforeUnmount(() => {
  clearTimeout(updateTimeout)
})

// 深度监听传入 nodes 数据变动，防抖缓冲重绘图结构
watch(() => props.nodes, debouncedUpdateGraph, { deep: true, immediate: true })

// 点击步骤节点聚焦事件
function handleNodeClick({ node }: { node: any }) {
  // 分组容器节点不支持 Inspector 详情及定位聚焦
  if (node.type === 'group') return

  selectedNodeId.value = node.id
  emit('node-click', node.id)

  // 平滑平移至视口中心，并保持 1.1x 缩放比例
  nextTick(() => {
    setCenter(node.position.x, node.position.y, { zoom: 1.1, duration: 800 })
  })
}

// 展开/收回步骤组事件
function handleToggleCollapse(id: string) {
  collapsedGroups.value[id] = !collapsedGroups.value[id]
  updateGraph()

  // 延时等待重排完成后平滑自适应画布视口
  setTimeout(() => {
    fitView({ duration: 600 })
  }, 100)
}
</script>

<template>
  <div class="dag-flex-layout">
    <!-- 主体 Vue Flow 拓扑画布 -->
    <div class="vue-flow-wrapper">
      <VueFlow
        v-model:nodes="flowNodes"
        v-model:edges="flowEdges"
        :node-types="nodeTypes"
        @node-click="handleNodeClick"
        :fit-view-on-init="true"
        class="yuan-flow-canvas"
      >
        <!-- 精致淡网格背景层 -->
        <Background pattern-color="#ccc" :gap="18" class="canvas-grid-bg" />

        <!-- 浮动多功能操控盘 -->
        <Controls class="canvas-controls-panel" />

        <!-- 针对 Group 组件节点自定义绑定插槽，实现事件冒泡通信 -->
        <template #node-group="slotProps">
          <CustomGroupNode
            :id="slotProps.id"
            :data="{ id: slotProps.id, title: slotProps.data.title, collapsed: slotProps.data.collapsed }"
            @toggle-collapse="handleToggleCollapse"
          />
        </template>
      </VueFlow>
    </div>

    <!-- 右侧联动详情抽屉 -->
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

.vue-flow-wrapper {
  flex: 1;
  height: 100%;
  background-color: #fafafa;
  position: relative;
  transition: all 0.3s ease;
}

.dark .vue-flow-wrapper {
  background-color: #09090b;
}

.yuan-flow-canvas {
  width: 100%;
  height: 100%;
}

/* 连线与特效美化 */
:deep(.vue-flow__edge-path) {
  stroke: #cbd5e1;
  stroke-width: 2px;
  transition: stroke 0.3s ease;
}

.dark :deep(.vue-flow__edge-path) {
  stroke: #334155;
}

/* 状态高亮与流光动效 (利用 Vue Flow 默认 animated 类) */
:deep(.vue-flow__edge-path.animated) {
  stroke: #3b82f6 !important;
  stroke-dasharray: 8 16 !important;
  animation: edge-flow-scrolling 1.5s infinite linear !important;
  filter: drop-shadow(0 0 4px rgba(59, 130, 246, 0.65));
}

.dark :deep(.vue-flow__edge-path.animated) {
  filter: drop-shadow(0 0 5px rgba(59, 130, 246, 0.9));
}

@keyframes edge-flow-scrolling {
  to {
    stroke-dashoffset: -24;
  }
}

/* 控制台微小美化 */
:deep(.vue-flow__controls) {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05) !important;
  border: 1px solid rgba(0, 0, 0, 0.06) !important;
  background: rgba(255, 255, 255, 0.8) !important;
  backdrop-filter: blur(8px) !important;
  border-radius: 8px !important;
  overflow: hidden;
  padding: 2px;
}

.dark :deep(.vue-flow__controls) {
  background: rgba(24, 24, 37, 0.8) !important;
  border-color: rgba(255, 255, 255, 0.06) !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4) !important;
}

:deep(.vue-flow__controls-button) {
  border-bottom: none !important;
  border-right: 1px solid rgba(0, 0, 0, 0.04) !important;
  background: transparent !important;
  fill: #64748b !important;
  transition: all 0.2s !important;
  width: 24px !important;
  height: 24px !important;
}

.dark :deep(.vue-flow__controls-button) {
  border-right-color: rgba(255, 255, 255, 0.04) !important;
  fill: #94a3b8 !important;
}

:deep(.vue-flow__controls-button:hover) {
  background: rgba(0, 0, 0, 0.04) !important;
}

.dark :deep(.vue-flow__controls-button:hover) {
  background: rgba(255, 255, 255, 0.04) !important;
}

/* Transition slide */
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
