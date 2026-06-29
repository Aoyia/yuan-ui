<script setup lang="ts">
import { Image, FileText, ExternalLink } from '@lucide/vue'
import type { TraceStatus } from '../types'

interface Props {
  title: string
  artifactType: 'image' | 'file' | 'link'
  url?: string
  caption?: string
  status?: TraceStatus
}

const props = defineProps<Props>()
</script>

<template>
  <div class="yuan-trace-node artifact-node status-complete">
    <div class="timeline-container">
      <div class="icon-bubble">
        <slot name="icon">
          <div class="bubble-complete">
            <Image v-if="props.artifactType === 'image'" class="icon-artifact" />
            <FileText v-else-if="props.artifactType === 'file'" class="icon-artifact" />
            <ExternalLink v-else class="icon-artifact" />
          </div>
        </slot>
      </div>
    </div>

    <div class="step-details">
      <div class="step-header">
        <span class="step-label">
          {{ props.title }}
        </span>
      </div>

      <div class="step-body">
        <!-- Image display -->
        <template v-if="props.artifactType === 'image'">
          <div class="image-wrapper">
            <img :src="props.url" :alt="props.caption || 'Generated image'" class="artifact-image" />
            <p v-if="props.caption" class="caption-text">
              {{ props.caption }}
            </p>
          </div>
        </template>

        <!-- File download/preview link -->
        <template v-else-if="props.artifactType === 'file'">
          <a :href="props.url || '#'" class="file-link" target="_blank" rel="noopener noreferrer">
            <FileText class="icon-file" />
            <span class="file-name">{{ props.caption || '查看文件' }}</span>
            <ExternalLink class="icon-ext" />
          </a>
        </template>

        <!-- External link -->
        <template v-else>
          <a :href="props.url || '#'" class="external-link" target="_blank" rel="noopener noreferrer">
            <span class="link-text">{{ props.caption || props.url }}</span>
            <ExternalLink class="icon-ext" />
          </a>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.yuan-trace-node {
  display: flex;
  position: relative;
  width: 100%;
  font-size: 0.875rem;
  animation: yuan-slide-in 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes yuan-slide-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.timeline-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-right: 0.75rem;
  width: 1.25rem;
  position: relative;
  flex-shrink: 0;
}

.icon-bubble {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  z-index: 2;
  background-color: #fff;
  transition: all 0.3s ease;
}

.bubble-complete {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1rem;
  height: 1rem;
  border-radius: 50%;
  background-color: #f1f5f9;
  color: #64748b;
}

.icon-artifact {
  width: 0.65rem;
  height: 0.65rem;
}



.step-details {
  flex: 1;
  padding-bottom: 1rem;
}

.step-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  line-height: 1.25rem;
}

.step-label {
  font-weight: 500;
  color: #64748b;
}

.step-body {
  margin-top: 0.375rem;
}

/* Image wrapper */
.image-wrapper {
  margin-top: 0.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  width: 100%;
}

.artifact-image {
  max-width: 100%;
  max-height: 15rem;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  object-fit: contain;
  background-color: #f8fafc;
}

.caption-text {
  font-size: 0.75rem;
  color: #64748b;
  margin: 0;
}

/* File link */
.file-link {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.625rem;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  color: #2563eb;
  text-decoration: none;
  font-size: 0.8125rem;
  transition: all 0.2s ease;
}

.file-link:hover {
  background-color: #eff6ff;
  border-color: #bfdbfe;
}

.icon-file {
  width: 0.875rem;
  height: 0.875rem;
  color: #64748b;
}

.icon-ext {
  width: 0.75rem;
  height: 0.75rem;
}

/* External Link */
.external-link {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  color: #2563eb;
  text-decoration: none;
  font-size: 0.8125rem;
}

.external-link:hover {
  text-decoration: underline;
}

.link-text {
  word-break: break-all;
}
</style>
