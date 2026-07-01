<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { GitBranch, CornerDownRight, Play } from '@lucide/vue'
import type { DAGNode, DAGEdge, DAGTraceStatus } from './types'
import DAGTraceNode from './DAGTraceNode.vue'

interface Props {
  nodes: DAGNode[]
  maxOutputLength?: number
}

const props = withDefaults(defineProps<Props>(), {
  maxOutputLength: 600,
})

const emit = defineEmits<{
  (e: 'node-click', id: string): void
  (e: 'node-fork', id: string, newInstruction: string): void
}>()

const containerRef = ref<HTMLElement | null>(null)
const nodeElements = ref<Record<string, HTMLElement>>({})

const showForkModal = ref(false)
const forkingNodeId = ref('')
const forkingNodeTitle = ref('')
const forkInstruction = ref('')

const links = ref<Array<{
  id: string
  x1: number
  y1: number
  x2: number
  y2: number
  status: DAGTraceStatus
}>>([])

// 1. 规范化节点：统一转换为 parentIds 数组以解耦
const normalizedNodes = computed(() => {
  return props.nodes.map(node => ({
    ...node,
    parentIds: node.parentIds || (node.parentId ? [node.parentId] : [])
  }))
})

// 2. 基于规范化节点自动推导边关系
const computedEdges = computed<DAGEdge[]>(() => {
  const result: DAGEdge[] = []
  normalizedNodes.value.forEach(node => {
    if (node.parentIds && node.parentIds.length > 0) {
      node.parentIds.forEach(pId => {
        result.push({
          source: pId,
          target: node.id,
          status: node.status
        })
      })
    }
  })
  return result
})

// 3. 拓扑分层布局算法 (BFS Layering)
const columns = computed(() => {
  if (normalizedNodes.value.length === 0) return []

  const nodeMap = new Map<string, typeof normalizedNodes.value[0]>()
  const childMap = new Map<string, string[]>()
  const inDegree = new Map<string, number>()
  
  // 初始化
  normalizedNodes.value.forEach(node => {
    nodeMap.set(node.id, node)
    childMap.set(node.id, [])
    inDegree.set(node.id, 0)
  })

  // 构建邻接表和入度
  computedEdges.value.forEach(edge => {
    const parentIds = childMap.get(edge.source) || []
    parentIds.push(edge.target)
    childMap.set(edge.source, parentIds)

    const deg = inDegree.get(edge.target) || 0
    inDegree.set(edge.target, deg + 1)
  })

  // BFS 计算层级
  const nodeLevels = new Map<string, number>()
  const queue: string[] = []

  // 入度为 0 的作为 Level 0
  normalizedNodes.value.forEach(node => {
    const deg = inDegree.get(node.id) || 0
    if (deg === 0 || (!node.parentIds || node.parentIds.length === 0)) {
      nodeLevels.set(node.id, 0)
      queue.push(node.id)
    }
  })

  // 队列扩散
  while (queue.length > 0) {
    const currId = queue.shift()!
    const currLevel = nodeLevels.get(currId) || 0
    const children = childMap.get(currId) || []

    children.forEach(childId => {
      const childLevel = nodeLevels.get(childId) || 0
      const targetLevel = Math.max(childLevel, currLevel + 1)
      nodeLevels.set(childId, targetLevel)
      
      if (!queue.includes(childId)) {
        queue.push(childId)
      }
    })
  }

  // 组织多列
  const maxLevel = Math.max(0, ...Array.from(nodeLevels.values()))
  const resultCols: Array<{ level: number; nodes: DAGNode[] }> = []

  for (let i = 0; i <= maxLevel; i++) {
    resultCols.push({ level: i, nodes: [] })
  }

  props.nodes.forEach(node => {
    const level = nodeLevels.get(node.id) ?? 0
    if (level < resultCols.length) {
      resultCols[level].nodes.push(node)
    } else {
      resultCols[0].nodes.push(node)
    }
  })

  return resultCols.filter(col => col.nodes.length > 0)
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

// 3. 计算连线在 SVG 坐标系中的相对位置
function updateLinks() {
  if (!containerRef.value) return
  
  const containerRect = containerRef.value.getBoundingClientRect()
  const computedLinks: typeof links.value = []

  computedEdges.value.forEach(edge => {
    const parentEl = nodeElements.value[edge.source]
    const childEl = nodeElements.value[edge.target]

    if (parentEl && childEl) {
      const parentRect = parentEl.getBoundingClientRect()
      const childRect = childEl.getBoundingClientRect()

      // 父节点右侧中心作为起点
      const x1 = parentRect.right - containerRect.left
      const y1 = parentRect.top - containerRect.top + parentRect.height / 2

      // 子节点左侧中心作为终点
      const x2 = childRect.left - containerRect.left
      const y2 = childRect.top - containerRect.top + childRect.height / 2

      // 取目标子节点的状态作为连线的展示状态，便于直观展示剪裁和激活
      const childNode = props.nodes.find(n => n.id === edge.target)
      const edgeStatus = childNode ? childNode.status : (edge.status || 'complete')

      computedLinks.push({
        id: `${edge.source}-${edge.target}`,
        x1,
        y1,
        x2,
        y2,
        status: edgeStatus
      })
    }
  })

  links.value = computedLinks
}

// 获取贝塞尔曲线路径
function getBezierPath(x1: number, y1: number, x2: number, y2: number) {
  const dx = Math.abs(x2 - x1) * 0.5
  return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`
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

// 4. 监听与生命周期处理
let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  nextTick(() => {
    updateLinks()
  })

  // 用 ResizeObserver 监听容器大小改变，实时重绘 SVG 曲线
  if (window.ResizeObserver && containerRef.value) {
    resizeObserver = new ResizeObserver(() => {
      updateLinks()
    })
    resizeObserver.observe(containerRef.value)
  }
})

watch(() => props.nodes, () => {
  nextTick(() => {
    updateLinks()
  })
}, { deep: true })

onBeforeUnmount(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
})

// 5. Fork 逻辑处理
function openForkModal(id: string) {
  const node = props.nodes.find(n => n.id === id)
  if (node) {
    forkingNodeId.value = id
    forkingNodeTitle.value = node.title
    forkInstruction.value = ''
    showForkModal.value = true
  }
}

function submitFork() {
  if (forkInstruction.value.trim()) {
    emit('node-fork', forkingNodeId.value, forkInstruction.value.trim())
    showForkModal.value = false
  }
}

function handleNodeClick(id: string) {
  emit('node-click', id)
}
</script>

<template>
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
            @click="handleNodeClick"
            @fork="openForkModal"
          />
        </div>
      </div>
    </div>

    <!-- Fork 干预模态弹窗 -->
    <Transition name="fade">
      <div v-if="showForkModal" class="fork-modal-backdrop" @click="showForkModal = false">
        <div class="fork-modal-card" @click.stopPropagation>
          <div class="modal-header">
            <GitBranch class="modal-title-icon" />
            <div class="modal-title-desc">
              <span class="modal-title">时空分叉调整</span>
              <span class="modal-subtitle">在步骤 "{{ forkingNodeTitle }}" 处插入新指令并分叉</span>
            </div>
          </div>
          
          <div class="modal-body">
            <div class="warning-alert">
              <CornerDownRight class="alert-icon" />
              <span>注：提交后，系统将废弃此节点之后的思考，并在该步骤后生成平行思路。</span>
            </div>
            
            <textarea
              v-model="forkInstruction"
              class="fork-textarea"
              placeholder="请输入您的调整意见或在此节点的新指令...（例如：不要读取这个文件了，尝试改用 analyze 脚本工具进行探索）"
              rows="4"
              @keydown.enter.meta="submitFork"
            ></textarea>
          </div>

          <div class="modal-footer">
            <button type="button" class="modal-btn cancel-btn" @click="showForkModal = false">取消</button>
            <button 
              type="button" 
              class="modal-btn confirm-btn" 
              :disabled="!forkInstruction.trim()"
              @click="submitFork"
            >
              <Play class="btn-confirm-icon" />
              <span>确认分叉执行</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.yuan-dag-container {
  display: block;
  position: relative;
  width: 100%;
  min-height: 500px;
  overflow-x: auto;
  overflow-y: hidden;
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
  transition: all 0.3s ease;
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

/* Fork Modal Backdrop */
.fork-modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.fork-modal-card {
  background: #ffffff;
  border-radius: 12px;
  width: 480px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
              0 10px 10px -5px rgba(0, 0, 0, 0.04);
  padding: 1.25rem;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  border: 1px solid rgba(0, 0, 0, 0.05);
}
.dark .fork-modal-card {
  background: #1e1e24;
  border-color: rgba(255, 255, 255, 0.05);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.4);
}

.modal-header {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.modal-title-icon {
  width: 1.75rem;
  height: 1.75rem;
  color: #3b82f6;
  padding: 0.25rem;
  border-radius: 6px;
  background: rgba(59, 130, 246, 0.08);
}

.modal-title-desc {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.modal-title {
  font-size: 0.9375rem;
  font-weight: 700;
  color: #1e293b;
}
.dark .modal-title {
  color: #f1f5f9;
}

.modal-subtitle {
  font-size: 0.75rem;
  color: #64748b;
}

.warning-alert {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(245, 158, 11, 0.06);
  border: 1px solid rgba(245, 158, 11, 0.1);
  padding: 0.5rem;
  border-radius: 6px;
  font-size: 0.7188rem;
  color: #d97706;
  margin-bottom: 0.75rem;
  line-height: 1.4;
}

.alert-icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}

.fork-textarea {
  width: 100%;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  padding: 0.5rem;
  box-sizing: border-box;
  font-family: inherit;
  font-size: 0.8125rem;
  outline: none;
  resize: vertical;
  color: #334155;
  transition: border-color 0.15s ease;
}
.dark .fork-textarea {
  background: rgba(0, 0, 0, 0.15);
  border-color: #334155;
  color: #cbd5e1;
}

.fork-textarea:focus {
  border-color: #3b82f6;
  background: #ffffff;
}
.dark .fork-textarea:focus {
  background: rgba(0, 0, 0, 0.25);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 0.25rem;
}

.modal-btn {
  font-size: 0.8125rem;
  font-weight: 500;
  padding: 0.35rem 0.75rem;
  border-radius: 6px;
  cursor: pointer;
  border: none;
  transition: all 0.15s ease;
}

.cancel-btn {
  background: #f1f5f9;
  color: #475569;
}
.dark .cancel-btn {
  background: #334155;
  color: #cbd5e1;
}
.cancel-btn:hover {
  background: #e2e8f0;
}
.dark .cancel-btn:hover {
  background: #475569;
}

.confirm-btn {
  background: #3b82f6;
  color: #ffffff;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}
.confirm-btn:hover {
  background: #2563eb;
}
.confirm-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-confirm-icon {
  width: 0.875rem;
  height: 0.875rem;
  fill: currentColor;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
