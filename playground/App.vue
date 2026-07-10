<script setup lang="ts">
import { ref } from 'vue'
import { Loading } from '../src/index'
import { ShieldCheck, Terminal } from '@lucide/vue'
import TraceDemo from './components/TraceDemo.vue'
import RendererDemo from './components/RendererDemo.vue'

const activeTab = ref<'trace' | 'streamRenderer'>('trace')
const isSwitching = ref(false)

function handleTabChange(tab: 'trace' | 'streamRenderer') {
  if (isSwitching.value) return
  isSwitching.value = true
  setTimeout(() => {
    activeTab.value = tab
    isSwitching.value = false
  }, 150) // 缩短加载延迟至 150ms，更加轻快
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
          <template v-if="activeTab === 'trace'">
            <!-- 激活态：新版 AgentTrace -->
            <button
              type="button"
              class="tab-btn active"
              style="cursor: default;"
            >
              <ShieldCheck class="tab-icon" />
              <span>新版 AgentTrace (List)</span>
            </button>
            <!-- 未激活态：流式 VNode 渲染，点击切换 -->
            <button
              type="button"
              class="tab-btn"
              @click="handleTabChange('streamRenderer')"
              :disabled="isSwitching"
            >
              <Terminal class="tab-icon" />
              <span>流式 VNode 渲染 (Renderer)</span>
            </button>
          </template>
          <template v-else>
            <!-- 激活态：流式 VNode 渲染 -->
            <button
              type="button"
              class="tab-btn active"
              style="cursor: default;"
            >
              <Terminal class="tab-icon" />
              <span>流式 VNode 渲染 (Renderer)</span>
            </button>
            <!-- 未激活态：新版 AgentTrace，点击切换 -->
            <button
              type="button"
              class="tab-btn"
              @click="handleTabChange('trace')"
              :disabled="isSwitching"
            >
              <ShieldCheck class="tab-icon" />
              <span>新版 AgentTrace (List)</span>
            </button>
          </template>
        </div>
      </div>
    </header>

    <!-- 主工作区 Workspace -->
    <div class="workspace">
      <!-- 极客美学 Loading 遮罩层 -->
      <Transition name="fade">
        <div v-if="isSwitching" class="workspace-loading-overlay">
          <Loading size="sm" text="正在切换视图..." />
        </div>
      </Transition>

      <!-- 动态视图切换 -->
      <KeepAlive>
        <TraceDemo v-if="activeTab === 'trace'" />
        <RendererDemo v-else />
      </KeepAlive>
    </div>
  </div>
</template>
