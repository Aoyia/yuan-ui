<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import LinearStepNode from './LinearStepNode.vue'
import './styles.css'

interface AgentTraceNode {
  id: string
  kind: 'reasoning' | 'tool' | 'artifact' | 'text' | 'group' | 'root'
  title: string
  status: 'pending' | 'active' | 'complete' | 'error' | 'cancelled'
  startedAt?: number
  endedAt?: number
  duration?: number
  parentId?: string
  toolName?: string
  input?: any
  output?: any
  errorText?: string
}

interface Props {
  nodes: AgentTraceNode[]
  isStreaming?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isStreaming: false
})

// 局部控制折叠状态 Map
const collapsedMap = ref<Record<string, boolean>>({})
const isVirtualRootCollapsed = ref(true)

// 当从流式运行 (isStreaming === true) 转换到运行结束时，一键自动归拢折叠
watch(() => props.isStreaming, (newVal, oldVal) => {
  if (oldVal === true && newVal === false) {
    isVirtualRootCollapsed.value = true
    // 将已产生的所有节点在本地记录为折叠归档
    props.nodes.forEach(n => {
      collapsedMap.value[n.id] = true
    })
  }
}, { immediate: true })

// ----------------------------------------------------
// 树形结构解析与流式归口逻辑 (第一性：运行期间默认保持全部展开，不进行高频折叠干扰)
// ----------------------------------------------------
const treeNodes = computed(() => {
  const list = props.nodes
  const map: Record<string, any> = {}
  
  // 1. 初始化并克隆数据
  list.forEach(node => {
    // 第一性原理：流式运行中，为了方便用户流畅扫视技术追踪和上下文：
    // - 只要用户没有主动点击过它，所有节点在运行中默认保持全部展开（collapsed: false）
    // - 仅在非 Streaming 时，或者用户有了手动的折叠意图记录时，才应用折叠
    const defaultCollapsed = props.isStreaming ? false : true

    map[node.id] = {
      ...node,
      children: [],
      collapsed: collapsedMap.value[node.id] !== undefined 
        ? collapsedMap.value[node.id] 
        : defaultCollapsed
    }
  })
  
  // 2. 层级挂载
  const roots: any[] = []
  list.forEach(node => {
    const mapped = map[node.id]
    if (node.parentId && map[node.parentId]) {
      map[node.parentId].children.push(mapped)
    } else {
      roots.push(mapped)
    }
  })
  
  // 3. 收纳封装判定
  const hasRealRoot = roots.some(r => r.kind === 'root' || r.verb === 'Worked for')
  
  if (props.isStreaming || hasRealRoot) {
    return roots
  } else {
    if (roots.length === 0) return []
    
    // 运行结束，动态封装进汇总节点
    let totalDuration = 0
    roots.forEach(r => {
      if (r.duration) totalDuration += r.duration
    })
    
    const virtualRoot = {
      id: 'virtual-root',
      kind: 'root' as const,
      title: `Worked for ${totalDuration}s`,
      status: 'complete' as const,
      verb: 'Worked for',
      object: `${totalDuration}s`,
      duration: totalDuration,
      isExpandable: true,
      collapsed: isVirtualRootCollapsed.value,
      children: roots
    }
    
    return [{
      ...virtualRoot,
      collapsed: isVirtualRootCollapsed.value
    }]
  }
})

// ----------------------------------------------------
// 一键折叠/展开全部控制
// ----------------------------------------------------
const isAllCollapsed = ref(false)

function toggleCollapseAll() {
  isAllCollapsed.value = !isAllCollapsed.value
  
  isVirtualRootCollapsed.value = isAllCollapsed.value
  props.nodes.forEach(n => {
    collapsedMap.value[n.id] = isAllCollapsed.value
  })
}

defineExpose({
  toggleCollapseAll
})
</script>

<template>
  <div class="agent-trace-linear-container">
    <!-- 顶部精美轻量控制工具条 -->
    <div class="trace-linear-toolbar">
      <button class="toolbar-btn" @click="toggleCollapseAll">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-top: -1px;">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="9" y1="3" x2="9" y2="21"></line>
        </svg>
        <span>{{ isAllCollapsed ? '展开全部' : '折叠全部' }}</span>
      </button>
    </div>

    <!-- 极致扁平追踪流主体 -->
    <div class="agent-trace-linear">
      <LinearStepNode 
        v-for="node in treeNodes" 
        :key="node.id"
        :node="node"
        :is-streaming="props.isStreaming"
      />
    </div>
  </div>
</template>

<style scoped>
.agent-trace-linear-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.trace-linear-toolbar {
  display: flex;
  justify-content: flex-end;
  border-bottom: 1px solid rgba(228, 228, 231, 0.5);
  padding-bottom: 8px;
}

.dark .trace-linear-toolbar {
  border-bottom-color: rgba(39, 39, 42, 0.5);
}

.toolbar-btn {
  background-color: transparent;
  border: 1px solid #e4e4e7;
  color: #71717a;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.15s ease;
  user-select: none;
}

.toolbar-btn:hover {
  background-color: #f4f4f5;
  color: #18181b;
  border-color: #d4d4d8;
}

.dark .toolbar-btn {
  border-color: #27272a;
  color: #a1a1aa;
}

.dark .toolbar-btn:hover {
  background-color: #1c1c1f;
  color: #fafafa;
  border-color: #3f3f46;
}
</style>
