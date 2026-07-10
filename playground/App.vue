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
    <!-- 经典的 Github Corner 挂角 -->
    <a href="https://github.com/Aoyia/aistream-vue" target="_blank" class="github-corner" aria-label="View source on GitHub">
      <svg width="80" height="80" viewBox="0 0 250 250" style="fill:#151513; color:#fff; position: absolute; top: 0; border: 0; right: 0; z-index: 1000;" aria-hidden="true">
        <path d="M0,0 L115,115 L130,115 L142,142 L250,250 L250,0 Z"></path>
        <path d="M128.3,109.0 C113.8,99.7 119.0,89.6 119.0,89.6 C122.0,82.7 120.5,78.6 120.5,78.6 C119.2,72.0 123.4,76.3 123.4,76.3 C127.3,80.9 125.5,87.3 125.5,87.3 C122.9,97.6 130.6,101.9 134.4,103.2" fill="currentColor" style="transform-origin: 130px 106px;" class="octo-arm"></path>
        <path d="M115.0,115.0 C114.9,115.1 118.7,116.5 119.8,115.4 L133.7,101.6 C136.9,99.2 139.9,98.4 142.2,98.6 C133.8,88.0 127.5,74.4 143.8,58.0 C148.5,53.4 154.0,51.2 159.7,51.0 C160.3,49.4 163.2,43.6 171.4,40.1 C171.4,40.1 176.1,42.5 178.8,56.2 C183.1,58.6 187.2,61.8 190.9,65.4 C194.5,69.0 197.7,73.2 200.1,77.6 C213.8,80.2 216.3,84.9 216.3,84.9 C212.7,93.1 206.9,96.0 205.4,97.5 C201.5,101.5 197.9,103.5 192.4,103.9 C187.1,105.0 183.4,108.6 177.2,115.0 C171.8,120.1 149.1,116.2 143.1,111.9 C138.1,116.3 125.0,118.0 105.5,108.6 C97.0,105.5 90.3,100.4 85.2,94.8 C77.9,82.0 76.7,66.3 79.4,52.8 C79.4,52.8 83.3,48.7 88.5,46.2 C94.3,42.2 97.5,44.7 97.5,44.7 C104.3,40.9 113.9,41.9 113.9,41.9 C113.9,41.9 116.7,46.8 120.9,47.8 C122.4,48.2 127.7,48.8 128.3,109.0 Z" fill="currentColor" class="octo-body"></path>
      </svg>
    </a>
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
