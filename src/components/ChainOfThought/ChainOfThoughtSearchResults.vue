<script setup lang="ts">
// 网页搜索结果卡片的包装容器
</script>

<template>
  <div class="yuan-cot-search-results">
    <slot />
  </div>
</template>

<style scoped>
.yuan-cot-search-results {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.375rem;
  margin-bottom: 0.375rem;
}
</style>
