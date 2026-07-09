<script setup lang="ts">
import { watch, onMounted } from 'vue';
import { useStreamRenderer } from './useStreamRenderer';
import { VNodeMarkdownRenderer } from './VNodeMarkdownRenderer';

interface Props {
  /** 实时传入的 Markdown 文本或流式文本段 */
  text: string;
  /** 是否处于流式生成状态（激活尾部修剪） */
  isStreaming?: boolean;
  /** 允许挂载的自定义组件白名单 */
  allowedComponents?: string[];
  /** 是否启用启发式尾部防闪烁修剪 */
  enableTailoring?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isStreaming: false,
  allowedComponents: () => ['dxf-bar-chart'],
  enableTailoring: true
});

const emit = defineEmits<{
  (e: 'feedback', errorMessage: string): void;
  (e: 'render-complete'): void;
}>();

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
    }
  }
);

onMounted(() => {
  updateStream(props.text, props.isStreaming);
});
</script>

<template>
  <div class="yuan-stream-renderer">
    <VNodeMarkdownRenderer
      :nodes="nodesTree"
      :allowed-components="allowedComponents"
      :is-streaming="isStreaming"
      @feedback="(msg: string) => emit('feedback', msg)"
    />
  </div>
</template>

<style>
/* 与 yuan-ui 主题色彩系统深度统一，支持亮色与暗色模式的平滑适配 */
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
  background: var(--yuan-bg-muted);
  border: 1px solid var(--yuan-border);
  border-radius: var(--yuan-radius-lg, 6px);
  margin: 16px 0;
  overflow: hidden;
  position: relative;
}

.yuan-stream-renderer .dxf-code-block-header {
  background: var(--yuan-border-light);
  border-bottom: 1px solid var(--yuan-border);
  padding: 8px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.yuan-stream-renderer .dxf-code-block-lang {
  font-size: 11px;
  font-family: var(--yuan-font-mono), monospace;
  font-weight: bold;
  color: var(--yuan-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.yuan-stream-renderer .dxf-code-block-pre {
  margin: 0;
  padding: 16px;
  overflow-x: auto;
  font-family: var(--yuan-font-mono), monospace;
  font-size: 13px;
  line-height: 1.5;
  color: var(--yuan-text-primary);
}
</style>
