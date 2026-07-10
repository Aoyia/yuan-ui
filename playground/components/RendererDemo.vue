<script setup lang="ts">
import { ref, computed, onActivated } from 'vue'
import { StreamMarkdownRenderer } from '../../src/index'
import { Play, RotateCcw, Activity, Palette, AlertCircle, Bot, Search, Terminal } from '@lucide/vue'
import { useSimulator } from '../hooks/useSimulator'
import DxfBarChart from './DxfBarChart.vue'

// 1. 引入模拟器 Engine 核心逻辑
const {
  selectedTemplate,
  streamText,
  isMarkdownStreaming,
  notification,
  streamSpeed,
  startMarkdownStream,
  resetMarkdownStream,
  handleFeedback
} = useSimulator(null)

const allowedComponents = ref(['dxf-bar-chart'])

// 提取当前文本中被识别到的组件标签，供监视器显示
const parsedComponents = computed(() => {
  if (!streamText.value) return []
  const list: { tag: string; content: string; allowed: boolean }[] = []
  
  // 简单匹配标签
  const regex = /<dxf-([a-zA-Z0-9_-]+)([^>]*)/g
  let match
  while ((match = regex.exec(streamText.value)) !== null) {
    const tag = `dxf-${match[1]}`
    const isAllowed = allowedComponents.value.includes(tag)
    list.push({
      tag,
      content: `<${tag}${match[2]}>`,
      allowed: isAllowed
    })
  }
  return list
})

onActivated(() => {
  startMarkdownStream()
})
</script>

<template>
  <!-- 左栏: 大模型模拟输出控制板 -->
  <aside class="code-panel spec-md-controls">
    <div class="code-tab-header">
      <div class="code-tab-active" style="display: flex; align-items: center; gap: 6px;">
        <Bot class="file-icon" style="width: 14px; height: 14px; color: #a855f7;" />
        <span class="file-name">大模型流式输出模拟器</span>
      </div>
    </div>
    
    <div class="md-control-panel-body">
      <div class="control-group-item">
        <label class="control-label-text">输出场景预设:</label>
        <select 
          class="control-select-box"
          v-model="selectedTemplate" 
          :disabled="isMarkdownStreaming" 
          @change="resetMarkdownStream"
        >
          <option value="stress-test">⚡ 极限测试：流式打字与划选复制</option>
          <option value="normal">✅ 正常组件渲染（数据合规）</option>
          <option value="invalid-zod">⚠️ Zod 校验失败（触发错误面板与自我纠错）</option>
          <option value="malicious-inject">🚫 恶意非法标签注入（VNode 级沙箱拦截）</option>
        </select>
      </div>

      <!-- Token 速度调节面板 -->
      <div class="control-group-item">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
          <label class="control-label-text">Token 渲染时延:</label>
          <span class="speed-value-display">{{ streamSpeed }}ms/chunk</span>
        </div>
        <div class="speed-slider-container">
          <input 
            type="range" 
            min="2" 
            max="150" 
            step="1"
            v-model.number="streamSpeed"
            :disabled="isMarkdownStreaming"
            class="speed-slider-bar"
          />
          <div class="speed-presets-labels">
            <span @click="!isMarkdownStreaming && (streamSpeed = 5)" :class="{ active: streamSpeed <= 10 }">🚀 极速</span>
            <span @click="!isMarkdownStreaming && (streamSpeed = 20)" :class="{ active: streamSpeed > 10 && streamSpeed <= 35 }">⚡ 飞快</span>
            <span @click="!isMarkdownStreaming && (streamSpeed = 50)" :class="{ active: streamSpeed > 35 && streamSpeed <= 75 }">🚶 正常</span>
            <span @click="!isMarkdownStreaming && (streamSpeed = 120)" :class="{ active: streamSpeed > 75 }">🐌 较慢</span>
          </div>
        </div>
      </div>

      <div class="control-buttons-row">
        <button 
          type="button"
          class="btn-primary" 
          @click="startMarkdownStream" 
          :disabled="isMarkdownStreaming"
        >
          <Play class="btn-icon" />
          <span>模拟流式输出</span>
        </button>
        <button 
          type="button"
          class="btn-secondary" 
          @click="resetMarkdownStream" 
          :disabled="isMarkdownStreaming && streamText.length === 0"
        >
          <RotateCcw class="btn-icon" />
          <span>重置</span>
        </button>
      </div>

      <!-- 流式原始字符缓冲区监视 -->
      <div class="raw-buffer-container">
        <div class="buffer-header-title" style="display: flex; align-items: center; gap: 6px;">
          <Terminal style="width: 12px; height: 12px; color: #64748b;" />
          <span>大模型 Raw Stream 字符缓冲区</span>
        </div>
        <div class="raw-terminal-view">
          <div class="raw-stream-text" :class="{ blinker: isMarkdownStreaming }">
            {{ streamText || '等待大模型流式信号输出...' }}
          </div>
        </div>
      </div>

      <!-- AST 拦截监视器 -->
      <div class="ast-monitor-section">
        <div class="buffer-header-title" style="display: flex; align-items: center; gap: 6px;">
          <Search style="width: 12px; height: 12px; color: #64748b;" />
          <span>AST Token 安全拦截监视器</span>
        </div>
        <div class="ast-list-box">
          <div v-if="parsedComponents.length === 0" class="ast-empty-msg">
            暂未解析到以 &lt;dxf- 开头的 HTML 标签 Token
          </div>
          <div v-else v-for="(token, index) in parsedComponents" :key="index" class="ast-item-card">
            <div class="ast-item-info">
              <span class="ast-item-tag">&lt;{{ token.tag }}&gt;</span>
              <span class="ast-item-content">{{ token.content }}</span>
            </div>
            <span class="ast-badge-status" :class="token.allowed ? 'allowed' : 'blocked'">
              {{ token.allowed ? '白名单允许 / VNode放行' : '非白名单 / VNode安全阻断' }}
            </span>
          </div>
        </div>
      </div>

    </div>
  </aside>

  <!-- 右栏: 前端运行时渲染视口 -->
  <main class="preview-panel">
    <div class="document-container">
      <div class="document-rendering-title-bar">
        <div style="display: flex; align-items: center; gap: 6px;">
          <Palette style="width: 14px; height: 14px; color: var(--yuan-text-tertiary);" />
          <span>前端运行时渲染视图 (Vue 3 VNode 递归映射)</span>
        </div>
        <span class="badge-vnode-tag">已启用：纯 VNode 映射（零 v-html）</span>
      </div>

      <div class="markdown-stream-container-card">
        <StreamMarkdownRenderer
          :text="streamText"
          :is-streaming="isMarkdownStreaming"
          :allowed-components="allowedComponents"
          :custom-components="{ 'dxf-bar-chart': DxfBarChart }"
          scroll-container=".document-container"
          @feedback="handleFeedback"
        />

        <!-- 自我纠错提示通知 -->
        <div v-if="notification" class="notification-correction-alert">
          <AlertCircle class="alert-icon" style="width: 16px; height: 16px; color: #6366f1;" />
          <div class="alert-text">{{ notification }}</div>
        </div>

        <!-- 空白时的指引 -->
        <div v-if="!streamText" class="empty-stream-placeholder">
          <div class="empty-icon-box">
            <Activity class="empty-icon" />
          </div>
          <p class="empty-title">等待 Markdown 信号输入</p>
          <p class="empty-desc">在左栏选择您感兴趣的场景模版，并点击“模拟流式输出”开始体验。</p>
        </div>
      </div>
    </div>
  </main>
</template>
