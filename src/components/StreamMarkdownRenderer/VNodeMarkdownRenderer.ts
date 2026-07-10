import { defineComponent, h, resolveComponent, Component, ref } from 'vue';
import type { RendererNode } from './types';

// 极简正规则表达式高亮，仿字节 Doubao/Coze 的 One Dark Pro 风格
function highlightCode(code: string, lang: string): any {
  if (!code) return h('code', {}, '');
  
  const cleanLang = lang.toLowerCase();
  if (
    cleanLang !== 'javascript' && 
    cleanLang !== 'js' && 
    cleanLang !== 'typescript' && 
    cleanLang !== 'ts' && 
    cleanLang !== 'json'
  ) {
    return h('code', {}, code);
  }

  const tokens: any[] = [];
  const regex = /(\/\/.*)|("(?:\\"|[^"])*"|'(?:\\'|[^'])*'|`(?:\\`|[^`])*`)|(\b(?:const|let|var|function|return|import|export|from|default|class|extends|new|if|else|for|while|async|await|try|catch|in|of|typeof|instanceof|switch|case|break)\b)|(\b\d+\b)|([a-zA-Z_$][a-zA-Z0-9_$]*)(?=\()|([^\s\w]+)/g;

  let lastIndex = 0;
  let match;

  while ((match = regex.exec(code)) !== null) {
    const textBefore = code.slice(lastIndex, match.index);
    if (textBefore) {
      tokens.push(textBefore);
    }

    const [full, comment, stringVal, keyword, numberVal, funcName, symbol] = match;

    if (comment) {
      tokens.push(h('span', { class: 'hljs-comment', style: { color: '#8e96aa', fontStyle: 'italic' } }, comment));
    } else if (stringVal) {
      tokens.push(h('span', { class: 'hljs-string', style: { color: '#9ece6a' } }, stringVal));
    } else if (keyword) {
      tokens.push(h('span', { class: 'hljs-keyword', style: { color: '#bb9af3', fontWeight: '500' } }, keyword));
    } else if (numberVal) {
      tokens.push(h('span', { class: 'hljs-number', style: { color: '#ff9e64' } }, numberVal));
    } else if (funcName) {
      tokens.push(h('span', { class: 'hljs-function', style: { color: '#7aa2f7' } }, funcName));
    } else if (symbol) {
      tokens.push(h('span', { class: 'hljs-symbol', style: { color: '#89ddff' } }, symbol));
    } else {
      tokens.push(full);
    }

    lastIndex = regex.lastIndex;
  }

  const remaining = code.slice(lastIndex);
  if (remaining) {
    tokens.push(remaining);
  }

  return h('code', {}, tokens);
}

// === Dxf 基础 Markdown 渲染组件矩阵 ===
const DxfText = {
  props: {
    content: { type: String, required: true }
  },
  setup(props: { content: string }) {
    // 渲染为原生 TextNode，保障选区 (Selection) 划选不中断
    return () => props.content;
  }
};

const DxfParagraph = defineComponent({
  name: 'DxfParagraph',
  setup(_, { slots }) {
    return () => h('p', { class: 'dxf-paragraph' }, slots.default ? slots.default() : []);
  }
});

const DxfHeading = defineComponent({
  name: 'DxfHeading',
  props: {
    level: { type: Number, default: 1 }
  },
  setup(props, { slots }) {
    const tag = `h${props.level}`;
    return () => h(tag, { class: `dxf-heading dxf-${tag}` }, slots.default ? slots.default() : []);
  }
});

const DxfStrong = defineComponent({
  name: 'DxfStrong',
  setup(_, { slots }) {
    return () => h('strong', { class: 'dxf-strong' }, slots.default ? slots.default() : []);
  }
});

const DxfInlineCode = defineComponent({
  name: 'DxfInlineCode',
  props: {
    content: { type: String, required: true }
  },
  setup(props) {
    return () => h('code', { class: 'dxf-inline-code' }, props.content);
  }
});

const DxfCodeBlock = defineComponent({
  name: 'DxfCodeBlock',
  props: {
    code: { type: String, required: true },
    lang: { type: String, default: 'text' }
  },
  setup(props) {
    const copied = ref(false);

    const handleCopy = () => {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(props.code).then(() => {
          copied.value = true;
          setTimeout(() => {
            copied.value = false;
          }, 2000);
        });
      }
    };

    return () => {
      // 复制按钮
      const copyBtn = h('button', {
        class: ['dxf-code-block-copy', copied.value ? 'copied' : ''],
        onClick: handleCopy
      }, copied.value ? '✅ 已复制！' : '📋 复制代码');

      // 代码块头部面板
      const header = h('div', { class: 'dxf-code-block-header' }, [
        h('span', { class: 'dxf-code-block-lang' }, props.lang),
        copyBtn
      ]);

      // 代码预设与高亮内容
      const highlighted = highlightCode(props.code, props.lang);
      const pre = h('pre', { class: 'dxf-code-block-pre' }, [highlighted]);

      return h('div', { class: 'dxf-code-block' }, [header, pre]);
    };
  }
});

export const VNodeMarkdownRenderer = defineComponent({
  name: 'VNodeMarkdownRenderer',
  props: {
    nodes: {
      type: Array as () => RendererNode[],
      required: true
    },
    allowedComponents: {
      type: Array as () => string[],
      default: () => ['dxf-bar-chart']
    },
    isStreaming: {
      type: Boolean,
      default: false
    }
  },
  emits: ['feedback'],
  setup(props, { emit }) {
    return (): any => {
      if (!props.nodes) return null;

      return props.nodes.map(node => {
        // 1. 文本节点 -> 映射为 DxfText
        if (node.type === 'text') {
          return h(DxfText, { content: node.content });
        }

        // 2. 自定义标签组件节点
        if (node.type === 'component') {
          const tag = node.tag;

          // 内置的代码块与行内代码组件，直接放行
          if (tag === 'dxf-inline-code') {
            return h(DxfInlineCode, { content: node.props.content });
          }
          if (tag === 'dxf-code-block') {
            return h(DxfCodeBlock, { code: node.props.code, lang: node.props.lang });
          }

          // 🛡️ VNode 级白名单安全沙箱拦截过滤
          if (props.allowedComponents.includes(tag)) {
            // 放行：委托给 Vue 全局组件或 resolveComponent 渲染，并监听其反馈事件
            return h(tag, {
              ...node.props,
              onFeedback: (msg: string) => emit('feedback', msg)
            });
          } else {
            console.warn(`🚫 [VNode 级安全过滤拦截] 检测到非授权组件: <${tag}>`);
            
            // 降级渲染为安全隔离提示
            return h('span', {
              style: {
                color: '#ef4444',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                display: 'inline-block',
                margin: '8px 0'
              }
            }, `🚫 [VNode 拦截] 发现非白名单未授权组件: <${tag}>，已拦截挂载`);
          }
        }

        // 3. 普通 HTML / Markdown 标签元素节点 (如 p, h1, strong)
        if (node.type === 'element') {
          const tag = node.tag;
          let componentClass: any = null;

          if (tag === 'dxf-paragraph') {
            componentClass = DxfParagraph;
          } else if (tag === 'dxf-heading') {
            componentClass = DxfHeading;
          } else if (tag === 'dxf-strong') {
            componentClass = DxfStrong;
          }

          if (componentClass) {
            // 递归渲染子节点
            return h(componentClass, node.props || {}, {
              default: () => h(VNodeMarkdownRenderer as any, {
                nodes: node.children,
                allowedComponents: props.allowedComponents,
                isStreaming: props.isStreaming,
                onFeedback: (msg: string) => emit('feedback', msg)
              })
            });
          } else {
            // 降级为原生 HTML 标签
            return h(node.tag, node.props || {}, [
              h(VNodeMarkdownRenderer as any, {
                nodes: node.children,
                allowedComponents: props.allowedComponents,
                isStreaming: props.isStreaming,
                onFeedback: (msg: string) => emit('feedback', msg)
              })
            ]);
          }
        }

        return null;
      });
    };
  }
});
