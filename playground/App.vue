<script setup lang="ts">
import { ref } from 'vue'
import { ShieldCheck, Terminal } from '@lucide/vue'
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
        <span class="brand-text">Yuan UI 智能体工作台</span>
      </div>
      
      <div class="header-actions">
        <div class="nav-tabs">
          <!-- 流式 VNode 渲染 (Renderer) -->
          <button
            type="button"
            class="tab-btn"
            :class="{ active: activeTab === 'streamRenderer' }"
            @click="handleTabChange('streamRenderer')"
          >
            <Terminal class="tab-icon" />
            <span>流式 VNode 渲染 (Renderer)</span>
          </button>
          <!-- 新版 AgentTrace (List) -->
          <button
            type="button"
            class="tab-btn"
            :class="{ active: activeTab === 'trace' }"
            @click="handleTabChange('trace')"
          >
            <ShieldCheck class="tab-icon" />
            <span>新版 AgentTrace (List)</span>
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
