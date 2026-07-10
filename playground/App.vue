<script setup lang="ts">
import { ref } from 'vue'
import { FileText, Brain } from '@lucide/vue'
import TraceDemo from './components/TraceDemo.vue'
import RendererDemo from './components/RendererDemo.vue'

const activeTab = ref<'trace' | 'streamRenderer'>('streamRenderer')

function handleTabChange(tab: 'trace' | 'streamRenderer') {
  activeTab.value = tab
}
</script>

<template>
  <div class="demo-workbench">
    <!-- 全局顶栏 Header -->
    <header class="demo-header">
      <div class="header-brand">
        <span class="brand-dot" />
        <span class="brand-text">AiStream-vue - 思维链与 Markdown 流式渲染</span>
      </div>
      
      <div class="header-actions">
        <div class="nav-tabs">
          <!-- AsMarkdown -->
          <button
            type="button"
            class="tab-btn"
            :class="{ active: activeTab === 'streamRenderer' }"
            @click="handleTabChange('streamRenderer')"
          >
            <FileText class="tab-icon" />
            <span>AsMarkdown</span>
          </button>
          <!-- AsThoughtChain -->
          <button
            type="button"
            class="tab-btn"
            :class="{ active: activeTab === 'trace' }"
            @click="handleTabChange('trace')"
          >
            <Brain class="tab-icon" />
            <span>AsThoughtChain</span>
          </button>
        </div>

        <a
          href="https://github.com/Aoyia/aistream-vue"
          target="_blank"
          rel="noopener noreferrer"
          class="github-link-btn"
          title="查看 GitHub 仓库"
        >
          <svg class="github-icon" viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
          </svg>
        </a>
      </div>
    </header>

    <!-- 主工作区 Workspace -->
    <div class="workspace">
      <!-- 动态视图切换，带渐隐渐现过渡 -->
      <Transition name="tab-fade">
        <KeepAlive>
          <div v-if="activeTab === 'trace'" class="tab-view-container" key="trace">
            <TraceDemo />
          </div>
          <div v-else class="tab-view-container" key="streamRenderer">
            <RendererDemo />
          </div>
        </KeepAlive>
      </Transition>
    </div>
  </div>
</template>
