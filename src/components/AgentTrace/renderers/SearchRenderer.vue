<script setup lang="ts">
import { computed } from 'vue'
import { ExternalLink } from '@lucide/vue'

interface SearchResult {
  title: string
  url: string
  snippet?: string
}

interface Props {
  results: SearchResult[] | unknown
}

const props = defineProps<Props>()

const parsedResults = computed<SearchResult[]>(() => {
  if (!props.results) return []
  if (Array.isArray(props.results)) {
    return props.results.map((item: any) => ({
      title: item.title || item.name || 'Untitled',
      url: item.url || item.link || '#',
      snippet: item.snippet || item.snippetText || item.description || ''
    }))
  }
  if (typeof props.results === 'string') {
    try {
      const parsed = JSON.parse(props.results)
      if (Array.isArray(parsed)) {
        return parsed.map((item: any) => ({
          title: item.title || item.name || 'Untitled',
          url: item.url || item.link || '#',
          snippet: item.snippet || item.snippetText || item.description || ''
        }))
      }
    } catch {
      // ignore
    }
  }
  return []
})

function getDomain(urlStr: string): string {
  try {
    const url = new URL(urlStr)
    return url.hostname.replace('www.', '')
  } catch {
    return 'link'
  }
}
</script>

<template>
  <div class="yuan-search-renderer">
    <div v-if="parsedResults.length === 0" class="no-results">
      No search results found
    </div>
    <div v-else class="results-list">
      <div v-for="(item, idx) in parsedResults" :key="idx" class="result-item">
        <div class="result-header">
          <span class="footnote-index">[{{ idx + 1 }}]</span>
          <a :href="item.url" target="_blank" class="result-title-link">
            <span class="result-title">{{ item.title }}</span>
            <ExternalLink class="link-icon" />
          </a>
          <span class="result-domain">{{ getDomain(item.url) }}</span>
        </div>
        <p v-if="item.snippet" class="result-snippet">{{ item.snippet }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.yuan-search-renderer {
  margin-top: 0.25rem;
  width: 100%;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  max-height: 200px;
  overflow-y: auto;
  padding-right: 0.25rem;
  scrollbar-width: thin;
}

.result-item {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: 0.25rem 0.1rem;
}

.result-header {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.footnote-index {
  font-size: 0.68rem;
  font-weight: 600;
  color: #86868b;
  font-family: ui-monospace, monospace;
}

.dark .footnote-index {
  color: #71717a;
}

.result-title-link {
  display: inline-flex;
  align-items: center;
  gap: 0.15rem;
  color: #0071e3;
  text-decoration: none;
  font-weight: 500;
  font-size: 0.75rem;
}

.dark .result-title-link {
  color: #2997ff;
}

.result-title-link:hover {
  text-decoration: underline;
}

.link-icon {
  width: 0.65rem;
  height: 0.65rem;
  opacity: 0.8;
}

.result-domain {
  font-size: 0.65rem;
  color: #86868b;
  background-color: #f1f5f9;
  padding: 0.02rem 0.25rem;
  border-radius: 4px;
}

.dark .result-domain {
  color: #71717a;
  background-color: #27272a;
}

.result-snippet {
  margin: 0 0 0 1rem;
  font-size: 0.7rem;
  color: #515154;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.dark .result-snippet {
  color: #a1a1aa;
}

.no-results {
  font-size: 0.7rem;
  color: #86868b;
  padding: 0.35rem;
  text-align: center;
}
</style>
