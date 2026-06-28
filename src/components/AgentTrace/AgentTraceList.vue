<script setup lang="ts">
import type { AgentTraceNode } from './types'
import ReasoningTraceNode from './renderers/ReasoningTraceNode.vue'
import ToolTraceNode from './renderers/ToolTraceNode.vue'
import ArtifactTraceNode from './renderers/ArtifactTraceNode.vue'
import TextTraceNode from './renderers/TextTraceNode.vue'

interface Props {
  nodes: AgentTraceNode[]
  maxOutputLength?: number
}

const props = withDefaults(defineProps<Props>(), {
  maxOutputLength: 1000,
})
</script>

<template>
  <div class="yuan-agent-trace-list">
    <template v-for="node in nodes" :key="node.id">
      <ReasoningTraceNode v-slot v-if="node.kind === 'reasoning'" :node="node" />
      
      <template v-else-if="node.kind === 'tool'">
        <slot :name="`tool:${node.toolName}`" :node="node">
          <ToolTraceNode :node="node" :max-output-length="maxOutputLength" />
        </slot>
      </template>
      
      <ArtifactTraceNode v-else-if="node.kind === 'artifact'" :node="node" />
      
      <TextTraceNode v-else-if="node.kind === 'text'" :node="node" />
    </template>
  </div>
</template>

<style scoped>
.yuan-agent-trace-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
}
</style>
