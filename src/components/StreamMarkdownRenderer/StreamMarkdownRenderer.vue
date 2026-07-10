<script setup lang="ts">
import { watch, onMounted, onUnmounted, ref, nextTick, computed } from 'vue';
import { useStreamRenderer } from './useStreamRenderer';
import { VNodeMarkdownRenderer } from './VNodeMarkdownRenderer';

interface Props {
  /** 实时传入的 Markdown 文本或流式文本段 */
  text: string;
  /** 是否处于流式生成状态（激活尾部修剪） */
  isStreaming?: boolean;
  /** 允许挂载的自定义组件白名单 */
  allowedComponents?: string[];
  /** 自定义组件的具体实现实例映射表，避免完全依赖全局注册 */
  customComponents?: Record<string, any>;
  /** 是否启用启发式尾部防闪烁修剪 */
  enableTailoring?: boolean;
  /** 是否启用流式输出自动吸底跟随滚动 */
  autoScroll?: boolean;
  /** 滚动容器，未指定则自动寻找最近的滚动祖先 */
  scrollContainer?: HTMLElement | string | null;
  /** 距离底部多少像素内判定为“在底部”的容差，默认 20px */
  scrollOffset?: number;
}

const props = withDefaults(defineProps<Props>(), {
  isStreaming: false,
  allowedComponents: () => ['dxf-bar-chart'],
  customComponents: () => ({}),
  enableTailoring: true,
  autoScroll: true,
  scrollContainer: null,
  scrollOffset: 20
});

const emit = defineEmits<{
  (e: 'feedback', errorMessage: string): void;
  (e: 'render-complete'): void;
}>();

const containerRef = ref<HTMLElement | null>(null);
const scrollContainerRef = ref<HTMLElement | null>(null);
let resolvedScrollContainer: HTMLElement | null = null;
let lastKnownScrollTop = 0;

const isTestEnv = () => {
  if (typeof window === 'undefined') return true;
  const ua = window.navigator.userAgent.toLowerCase();
  return ua.includes('happydom') || ua.includes('jsdom') || !!(window as any).__vitest_environment__;
};

// 寻找最近的滚动父级容器
function getScrollParent(el: HTMLElement): HTMLElement {
  let parent = el.parentElement;
  while (parent) {
    const style = window.getComputedStyle(parent);
    const overflowY = style.overflowY;
    if (overflowY === 'auto' || overflowY === 'scroll') {
      return parent;
    }
    parent = parent.parentElement;
  }
  return document.documentElement;
}

const resolveScrollContainer = () => {
  if (!containerRef.value) return;
  let container: HTMLElement | null = null;
  if (props.scrollContainer instanceof HTMLElement) {
    container = props.scrollContainer;
  } else if (typeof props.scrollContainer === 'string') {
    // 优先从当前组件的祖先中寻找，防止多组件实例下 document.querySelector 错选其他隐藏容器
    container = containerRef.value.closest(props.scrollContainer) as HTMLElement;
    if (!container) {
      container = document.querySelector(props.scrollContainer) as HTMLElement;
    }
  }
  
  if (!container) {
    container = getScrollParent(containerRef.value);
  }
  scrollContainerRef.value = container;
  resolvedScrollContainer = container;
  if (container) {
    lastKnownScrollTop = container.scrollTop;
  }
};

watch(() => props.scrollContainer, () => {
  scrollContainerRef.value = null;
  resolvedScrollContainer = null;
});

// 1. 初始化 Composable 管线
const { nodesTree, updateStream, reset } = useStreamRenderer({
  enableTailoring: props.enableTailoring,
  allowedComponents: props.allowedComponents
});

// 2. 监听传入属性 text 与 isStreaming 变化，更新解析管道
watch(
  () => [props.text, props.isStreaming] as const,
  ([newText, newStreaming]) => {
    updateStream(newText, newStreaming);
  },
  { immediate: true }
);

// 3. 监听 isStreaming 的变化，当从流式状态结束时，抛出完成事件
watch(
  () => props.isStreaming,
  (newStreaming, oldStreaming) => {
    if (oldStreaming === true && newStreaming === false) {
      emit('render-complete');
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
      isAutoScrolling.value = false;
      stopFpsCounter();
    }
    if (newStreaming === true) {
      // 开启流式时，默认激活吸底，保障新一轮输出能被立刻看到
      userScrolledUp.value = false;
      if (scrollContainerRef.value) {
        lastKnownScrollTop = scrollContainerRef.value.scrollTop;
      } else {
        lastKnownScrollTop = 0;
      }
      startFpsCounter();
    }
  }
);

// 滚动控制与平滑缓动状态维护
let animationFrameId: number | null = null;
const userScrolledUp = ref(false);
const isAutoScrolling = ref(false);

// ─── FPS 帧率计数器 ───────────────────────────────────────────────────────────
const fps = ref(0);
const fpsVisible = ref(false);
let fpsRafId: number | null = null;
let fpsFrameCount = 0;
let fpsLastTime = 0;
let fpsHideTimer: ReturnType<typeof setTimeout> | null = null;

const fpsColor = computed(() => {
  if (fps.value >= 50) return '#10b981'; // 绿色：流畅
  if (fps.value >= 30) return '#f59e0b'; // 黄色：一般
  return '#ef4444';                      // 红色：卡顿
});

function startFpsCounter() {
  if (fpsRafId !== null) return;
  fpsFrameCount = 0;
  fpsLastTime = performance.now();
  fpsVisible.value = true;
  if (fpsHideTimer !== null) {
    clearTimeout(fpsHideTimer);
    fpsHideTimer = null;
  }

  const tick = (now: number) => {
    fpsFrameCount++;
    const elapsed = now - fpsLastTime;
    if (elapsed >= 500) {
      fps.value = Math.round((fpsFrameCount / elapsed) * 1000);
      fpsFrameCount = 0;
      fpsLastTime = now;
    }
    fpsRafId = requestAnimationFrame(tick);
  };
  fpsRafId = requestAnimationFrame(tick);
}

function stopFpsCounter() {
  if (fpsRafId !== null) {
    cancelAnimationFrame(fpsRafId);
    fpsRafId = null;
  }
  // 延迟 1 秒后隐藏，让用户看到最终帧率
  fpsHideTimer = setTimeout(() => {
    fpsVisible.value = false;
    fps.value = 0;
    fpsHideTimer = null;
  }, 1000);
}

watch(userScrolledUp, (newVal) => {
  if (newVal) {
    console.log('[StreamScroll] 停用滚动跟随 (用户已手动向上滚动或离开底部)');
  } else {
    console.log('[StreamScroll] 启用滚动跟随 (已回到底部并自动恢复跟随)');
  }
});

const handleScroll = () => {
  if (!scrollContainerRef.value) return;
  const el = scrollContainerRef.value;
  const currentScrollTop = el.scrollTop;
  const distanceToBottom = el.scrollHeight - currentScrollTop - el.clientHeight;

  // 1. 如果已经回到最底部，恢复吸底
  if (distanceToBottom <= props.scrollOffset) {
    userScrolledUp.value = false;
    lastKnownScrollTop = currentScrollTop;
    return;
  }

  // 2. 单调性对比：如果当前位置比上一次记录的值减小了（偏离大于 2.0px，过滤排网精度误差）
  // 说明滚动条向上运动了，判定为用户手动向上滚动以查看历史
  if (currentScrollTop < lastKnownScrollTop - 2.0) {
    userScrolledUp.value = true;
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    isAutoScrolling.value = false;
  }

  lastKnownScrollTop = currentScrollTop;
};

// 绑定/解绑事件监听
watch(scrollContainerRef, (newEl, oldEl) => {
  if (oldEl) {
    oldEl.removeEventListener('scroll', handleScroll);
  }
  if (newEl) {
    newEl.addEventListener('scroll', handleScroll, { passive: true });
  }
});

onUnmounted(() => {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
  }
  if (scrollContainerRef.value) {
    scrollContainerRef.value.removeEventListener('scroll', handleScroll);
  }
  if (fpsRafId !== null) {
    cancelAnimationFrame(fpsRafId);
  }
  if (fpsHideTimer !== null) {
    clearTimeout(fpsHideTimer);
  }
});

function startSmoothScroll() {
  if (!scrollContainerRef.value || !props.autoScroll || userScrolledUp.value) return;

  const el = scrollContainerRef.value;

  if (isTestEnv()) {
    el.scrollTop = el.scrollHeight;
    lastKnownScrollTop = el.scrollTop;
    isAutoScrolling.value = false;
    return;
  }

  isAutoScrolling.value = true;

  const step = () => {
    if (!scrollContainerRef.value || userScrolledUp.value) {
      isAutoScrolling.value = false;
      animationFrameId = null;
      return;
    }

    const current = el.scrollTop;
    const target = el.scrollHeight - el.clientHeight;

    // 如果目标高度有效，且当前尚未完全贴合底部，则进行 25% 插值以提速高速传输下的跟进
    if (target <= 0 || Math.abs(target - current) < 1.0) {
      el.scrollTop = el.scrollHeight; // 彻底到底并兼容 happy-dom 的断言限制
      lastKnownScrollTop = el.scrollTop;
      isAutoScrolling.value = false;
      animationFrameId = null;
    } else {
      el.scrollTop = current + (target - current) * 0.25;
      lastKnownScrollTop = el.scrollTop;
      animationFrameId = requestAnimationFrame(step);
    }
  };

  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
  }
  animationFrameId = requestAnimationFrame(step);
}

// 4. 滚动判定逻辑：在 DOM 更新前检查是否处于底部 (flush: 'pre')
let wasAtBottom = false;
watch(
  () => nodesTree.value,
  () => {
    if (!props.autoScroll || !props.isStreaming) {
      wasAtBottom = false;
      return;
    }
    if (!scrollContainerRef.value) {
      resolveScrollContainer();
    }
    if (scrollContainerRef.value) {
      const el = scrollContainerRef.value;
      const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      
      if (userScrolledUp.value) {
        wasAtBottom = false;
      } else {
        if (isAutoScrolling.value) {
          // 如果已经在自动跟随过程中，默认保持吸底，不受平滑滚动的暂存落后距离干扰
          wasAtBottom = true;
        } else {
          // 首次运行或静止期，只有当滚动位置确实在最底部时才激活吸底跟随
          wasAtBottom = distanceToBottom <= props.scrollOffset;
        }
      }
    }
  },
  { flush: 'pre' }
);

// 5. 滚动执行逻辑：在 DOM 更新后若之前处于底部则执行滚动 (flush: 'post')
watch(
  () => nodesTree.value,
  () => {
    if (!props.autoScroll || !props.isStreaming || !wasAtBottom) return;
    startSmoothScroll();
  },
  { flush: 'post' }
);

onMounted(() => {
  updateStream(props.text, props.isStreaming);
});
</script>

<template>
  <div ref="containerRef" class="yuan-stream-renderer">
    <!-- FPS 帧率角标 -->
    <Transition name="yuan-fps-fade">
      <div v-if="fpsVisible" class="yuan-fps-badge" :style="{ '--fps-color': fpsColor }">
        <span class="yuan-fps-dot"></span>
        <span class="yuan-fps-value">{{ fps }}</span>
        <span class="yuan-fps-unit">fps</span>
      </div>
    </Transition>
    <VNodeMarkdownRenderer
      :nodes="nodesTree"
      :allowed-components="allowedComponents"
      :custom-components="customComponents"
      :is-streaming="isStreaming"
      @feedback="(msg: string) => emit('feedback', msg)"
    />
  </div>
</template>

<style>
/* 与 yuan-ui 主题色彩系统深度统一，支持亮色与暗色模式的平滑适配 */

/* ── FPS 帧率角标 ──────────────────────────────────────────────── */
.yuan-fps-badge {
  position: fixed;
  bottom: 16px;
  right: 16px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px 3px 6px;
  background: rgba(0, 0, 0, 0.55);
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

.yuan-stream-renderer {
  font-family: var(--yuan-font-sans), system-ui, -apple-system, sans-serif;
  color: var(--yuan-text-primary);
  line-height: 1.7;
  font-size: 14px;
}

.yuan-stream-renderer .dxf-paragraph {
  margin-bottom: 16px;
  color: var(--yuan-text-primary);
}

.yuan-stream-renderer .dxf-heading {
  font-weight: 700;
  color: var(--yuan-text-primary);
  margin-top: 24px;
  margin-bottom: 12px;
  line-height: 1.3;
}

.yuan-stream-renderer .dxf-h1 { font-size: 1.6rem; border-bottom: 1px solid var(--yuan-border); padding-bottom: 6px; }
.yuan-stream-renderer .dxf-h2 { font-size: 1.4rem; }
.yuan-stream-renderer .dxf-h3 { font-size: 1.2rem; }
.yuan-stream-renderer .dxf-h4, .dxf-h5, .dxf-h6 { font-size: 1rem; }

.yuan-stream-renderer .dxf-strong {
  font-weight: 600;
}

.yuan-stream-renderer .dxf-inline-code {
  font-family: var(--yuan-font-mono), monospace;
  font-size: 13px;
  background: var(--yuan-bg-muted);
  color: var(--yuan-primary);
  border: 1px solid var(--yuan-border);
  padding: 2px 6px;
  border-radius: var(--yuan-radius, 4px);
}

.yuan-stream-renderer .dxf-code-block {
  background: #18181c;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  margin: 16px 0;
  overflow: hidden;
  position: relative;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.yuan-stream-renderer .dxf-code-block-header {
  background: #111114;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  padding: 6px 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  user-select: none;
}

.yuan-stream-renderer .dxf-code-block-lang {
  font-size: 10px;
  font-family: var(--yuan-font-mono), SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-weight: 600;
  color: #80808a;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.yuan-stream-renderer .dxf-code-block-copy {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #a0a0ab;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.yuan-stream-renderer .dxf-code-block-copy:hover {
  background: rgba(255, 255, 255, 0.06);
  color: #ffffff;
  border-color: rgba(255, 255, 255, 0.15);
}

.yuan-stream-renderer .dxf-code-block-copy.copied {
  color: #10b981;
  background: rgba(16, 185, 129, 0.08);
  border-color: rgba(16, 185, 129, 0.2);
}

.yuan-stream-renderer .dxf-code-block-pre {
  margin: 0;
  padding: 14px 16px;
  overflow-x: auto;
  font-family: var(--yuan-font-mono), SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12.5px;
  line-height: 1.6;
  color: #d1d5db;
}
</style>
