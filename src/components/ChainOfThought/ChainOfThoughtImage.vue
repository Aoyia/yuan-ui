<script setup lang="ts">
interface Props {
  caption?: string
}

const props = defineProps<Props>()
</script>

<template>
  <div class="yuan-cot-image">
    <div class="image-container">
      <slot />
    </div>
    <p v-if="props.caption" class="caption-text">
      {{ props.caption }}
    </p>
  </div>
</template>

<style scoped>
.yuan-cot-image {
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  width: 100%;
}

.image-container {
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 8px;
  background-color: #f3f4f6;
  border: 1px solid #e5e7eb;
  padding: 0.5rem;
  max-width: 100%;
  max-height: 20rem;
}

.caption-text {
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0;
}
</style>
