<script setup lang="ts">
import { computed } from 'vue'
import type { AgentTraceNode, GroupTraceNode } from './types'
import ReasoningTraceNode from './renderers/ReasoningTraceNode.vue'
import ToolTraceNode from './renderers/ToolTraceNode.vue'
import ArtifactTraceNode from './renderers/ArtifactTraceNode.vue'
import TextTraceNode from './renderers/TextTraceNode.vue'
import GroupTraceNodeComponent from './renderers/GroupTraceNode.vue'

interface Props {
  nodes: AgentTraceNode[]
  maxOutputLength?: number
  parentId?: string // 当前列表的父节点ID，用于级联过滤层级
}

const props = withDefaults(defineProps<Props>(), {
  maxOutputLength: 1000,
  parentId: undefined,
})

// 根据 parentId 级联过滤出属于当前层级展示的所有节点
const currentLevelNodes = computed(() => {
  return props.nodes.filter((node) => {
    if (props.parentId === undefined || props.parentId === null || props.parentId === '') {
      return !node.parentId
    }
    return node.parentId === props.parentId
  })
})
</script>

<template>
  <TransitionGroup name="yuan-list" tag="div" class="yuan-agent-trace-list">
    <template v-for="node in currentLevelNodes" :key="node.id">
      <!-- 1. 递归 Group 节点 -->
      <GroupTraceNodeComponent 
        v-if="node.kind === 'group'" 
        v-bind="node" 
        :all-nodes="props.nodes" 
      >
        <AgentTraceList 
          :nodes="props.nodes" 
          :parent-id="node.id" 
          :max-output-length="maxOutputLength"
        />
      </GroupTraceNodeComponent>
      
      <!-- 2. 普通推理节点 -->
      <ReasoningTraceNode v-else-if="node.kind === 'reasoning'" v-bind="node" />
      
      <!-- 3. 普通工具节点 -->
      <template v-else-if="node.kind === 'tool'">
        <slot :name="`tool:${node.toolName}`" :node="node">
          <ToolTraceNode v-bind="node" :max-output-length="maxOutputLength" />
        </slot>
      </template>
      
      <!-- 4. 产物节点 -->
      <ArtifactTraceNode v-else-if="node.kind === 'artifact'" v-bind="node" />
      
      <!-- 5. 纯文本节点 -->
      <TextTraceNode v-else-if="node.kind === 'text'" v-bind="node" />
    </template>
  </TransitionGroup>
</template>

<style scoped>
.yuan-agent-trace-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
}

/* 布局移动平滑过渡 */
.yuan-list-move {
  transition: transform 0.32s cubic-bezier(0.25, 1, 0.5, 1);
}

/* 列表节点渐入动画 */
.yuan-list-enter-active {
  transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
}
.yuan-list-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

/* 列表节点离开动画 */
.yuan-list-leave-active {
  transition: all 0.25s cubic-bezier(0.25, 1, 0.5, 1);
  position: absolute;
  width: 100%;
}
.yuan-list-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
