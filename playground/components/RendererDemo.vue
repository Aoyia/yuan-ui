<script setup lang="ts">
import { ref, computed, onActivated, onMounted, watch, nextTick } from 'vue'
import { AsMarkdown } from '../../src/index'
import { Play, RotateCcw, Activity, Palette, AlertCircle, Bot, Search, Terminal } from '@lucide/vue'
import { useSimulator } from '../hooks/useSimulator'
import DxfBarChart from './DxfBarChart.vue'

// 1. 引入模拟器 Engine 核心 logic
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

const tokensPerSecond = ref(80)
watch(tokensPerSecond, (newVal) => {
  streamSpeed.value = Math.round(2000 / newVal)
}, { immediate: true })

watch(streamSpeed, (newVal) => {
  const calculated = Math.round(2000 / newVal)
  if (tokensPerSecond.value !== calculated) {
    tokensPerSecond.value = calculated
  }
})

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

let hasMounted = false

onMounted(() => {
  hasMounted = true
  nextTick(() => {
    // 延迟 150ms 等待 Transition 过渡和 DOM 稳定，防止高度计算为 0 导致吸底失效
    setTimeout(() => {
      startMarkdownStream()
    }, 150)
  })
})

onActivated(() => {
  if (!hasMounted) return
  nextTick(() => {
    setTimeout(() => {
      startMarkdownStream()
    }, 150)
  })
})

// ─── FPS 帧率计数器 ───────────────────────────────────────────────────────────
const fps = ref(0)
const fpsVisible = ref(false)
let fpsRafId: number | null = null
let fpsFrameCount = 0
let fpsLastTime = 0
let fpsHideTimer: ReturnType<typeof setTimeout> | null = null

const fpsColor = computed(() => {
  if (fps.value >= 50) return '#10b981' // 绿色：流畅
  if (fps.value >= 30) return '#f59e0b' // 黄色：一般
  return '#ef4444'                      // 红色：卡顿
})

function startFpsCounter() {
  if (fpsRafId !== null) return
  fpsFrameCount = 0
  fpsLastTime = performance.now()
  fpsVisible.value = true
  if (fpsHideTimer !== null) {
    clearTimeout(fpsHideTimer)
    fpsHideTimer = null
  }

  const tick = (now: number) => {
    fpsFrameCount++
    const elapsed = now - fpsLastTime
    if (elapsed >= 500) {
      fps.value = Math.round((fpsFrameCount / elapsed) * 1000)
      fpsFrameCount = 0
      fpsLastTime = now
    }
    fpsRafId = requestAnimationFrame(tick)
  }
  fpsRafId = requestAnimationFrame(tick)
}

function stopFpsCounter() {
  if (fpsRafId !== null) {
    cancelAnimationFrame(fpsRafId)
    fpsRafId = null
  }
  // 延迟 1 秒后隐藏，让用户看到最终帧率
  fpsHideTimer = setTimeout(() => {
    fpsVisible.value = false
    fps.value = 0
    fpsHideTimer = null
  }, 1000)
}

watch(isMarkdownStreaming, (newVal) => {
  if (newVal) {
    startFpsCounter()
  } else {
    stopFpsCounter()
  }
}, { immediate: true })

import { onUnmounted } from 'vue'
onUnmounted(() => {
  if (fpsRafId !== null) {
    cancelAnimationFrame(fpsRafId)
  }
  if (fpsHideTimer !== null) {
    clearTimeout(fpsHideTimer)
  }
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
          <option value="stress-test">极限测试：流式打字与划选复制</option>
          <option value="normal">正常组件渲染（数据合规）</option>
          <option value="invalid-zod">Zod 校验失败（触发错误面板与自我纠错）</option>
          <option value="malicious-inject">恶意非法标签注入（VNode 级沙箱拦截）</option>
        </select>
      </div>

      <!-- Token 速度调节面板 -->
      <div class="control-group-item">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
          <label class="control-label-text">Token 渲染速度:</label>
          <span class="speed-value-display">{{ tokensPerSecond }} tokens/s</span>
        </div>
        <div class="speed-slider-container">
          <input 
            type="range" 
            min="10" 
            max="500" 
            step="5"
            v-model.number="tokensPerSecond"
            :disabled="isMarkdownStreaming"
            class="speed-slider-bar"
          />
          <div class="speed-presets-labels">
            <span @click="!isMarkdownStreaming && (tokensPerSecond = 16)" :class="{ active: tokensPerSecond < 30 }">较慢</span>
            <span @click="!isMarkdownStreaming && (tokensPerSecond = 40)" :class="{ active: tokensPerSecond >= 30 && tokensPerSecond < 80 }">正常</span>
            <span @click="!isMarkdownStreaming && (tokensPerSecond = 100)" :class="{ active: tokensPerSecond >= 80 && tokensPerSecond < 300 }">飞快</span>
            <span @click="!isMarkdownStreaming && (tokensPerSecond = 400)" :class="{ active: tokensPerSecond >= 300 }">极速</span>
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
        <!-- FPS 帧率角标 (Playground 特色，不污染组件) -->
        <Transition name="yuan-fps-fade">
          <div v-if="fpsVisible" class="yuan-fps-badge" :style="{ '--fps-color': fpsColor }">
            <span class="yuan-fps-dot"></span>
            <span class="yuan-fps-value">{{ fps }}</span>
            <span class="yuan-fps-unit">fps</span>
          </div>
        </Transition>

        <AsMarkdown
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

<style scoped>
.markdown-stream-container-card {
  position: relative; /* 确保 FPS 限制在卡片内部绝对定位 */
}

/* ── FPS 帧率角标 ──────────────────────────────────────────────── */
.yuan-fps-badge {
  position: absolute;
  bottom: 16px;
  right: 16px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px 3px 6px;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  font-family: var(--yuan-font-mono, 'SFMono-Regular', Menlo, monospace);
  font-size: 11px;
  line-height: 1;
  color: #e5e7eb;
  z-index: 10;
  pointer-events: none;
  user-select: none;
}

.yuan-fps-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--fps-color, #10b981);
  box-shadow: 0 0 4px var(--fps-color, #10b981);
  animation: yuan-fps-pulse 1s ease-in-out infinite;
  flex-shrink: 0;
}

.yuan-fps-value {
  font-weight: 700;
  color: var(--fps-color, #10b981);
  min-width: 2ch;
  text-align: right;
}

.yuan-fps-unit {
  color: #9ca3af;
  font-weight: 400;
}

@keyframes yuan-fps-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.yuan-fps-fade-enter-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.yuan-fps-fade-leave-active {
  transition: opacity 0.6s ease, transform 0.4s ease;
}
.yuan-fps-fade-enter-from {
  opacity: 0;
  transform: translateY(-4px) scale(0.92);
}
.yuan-fps-fade-leave-to {
  opacity: 0;
  transform: translateY(-2px) scale(0.95);
}
</style>
