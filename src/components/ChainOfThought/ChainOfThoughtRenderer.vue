<script setup lang="ts">
import { computed } from 'vue'
import type { AgentStepNode } from './types'
import { mapLegacyAgentStepNode } from '../AgentTrace/legacy'
import AgentTraceList from '../AgentTrace/AgentTraceList.vue'

interface Props {
  nodes: AgentStepNode[]
}

const props = defineProps<Props>()

const mappedNodes = computed(() => {
  return props.nodes.map(mapLegacyAgentStepNode)
})
</script>

<template>
  <div class="yuan-cot-renderer">
    <AgentTraceList :nodes="mappedNodes">
      <!-- 动态透传插槽，保证自定义工具节点功能完美兼容 -->
      <template v-for="(_, name) in $slots" :key="name" #[name]="slotData">
        <slot :name="name" v-bind="slotData || {}" />
      </template>
    </AgentTraceList>
  </div>
</template>

<style scoped>
.yuan-cot-renderer {
  display: flex;
  flex-direction: column;
  width: 100%;
}
</style>
