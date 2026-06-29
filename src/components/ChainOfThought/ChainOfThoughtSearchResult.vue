<script setup lang="ts">
import { Globe } from '@lucide/vue'

interface Props {
  href?: string
}

const props = defineProps<Props>()
</script>

<template>
  <a 
    :href="props.href" 
    target="_blank" 
    rel="noopener noreferrer" 
    class="yuan-cot-search-result"
  >
    <Globe class="icon-globe" />
    <span class="result-text">
      <slot />
    </span>
  </a>
</template>

<style scoped>
.yuan-cot-search-result {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  color: #4b5563;
  background-color: #f3f4f6;
  border-radius: 9999px;
  text-decoration: none;
  border: 1px solid transparent;
  transition: all 0.2s ease;
  max-width: 200px;
}

.yuan-cot-search-result:hover {
  background-color: #e5e7eb;
  color: #1f2937;
  border-color: #d1d5db;
}

.icon-globe {
  width: 0.75rem;
  height: 0.75rem;
  flex-shrink: 0;
  color: #6b7280;
}

.result-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
