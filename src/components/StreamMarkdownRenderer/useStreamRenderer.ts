import { ref, computed } from 'vue';
import MarkdownIt from 'markdown-it';
import type { RendererNode, UseStreamRendererOptions } from './types';
import { tailorStreamText } from './utils/tailor';
import { completeMarkdownSyntax } from './utils/autocomplete';
import { splitIntoLogicalBlocks } from './utils/block-parser';
import { treeifyTokens } from './utils/treeify';

export function useStreamRenderer(options: UseStreamRendererOptions = {}) {
  const { enableTailoring = true, enableCompletion = true } = options;

  const renderedText = ref('');
  const isInnerStreaming = ref(false);

  // --- 性能治理核心变量 ---
  // 1. WeakMap 段落 AST 缓存
  const astCache = new WeakMap<object, any[]>();
  let paragraphObjects: { text: string }[] = []; // 维护段落对象的引用列表，用于垃圾回收与 WeakMap Key 检索

  // 2. 双缓冲区非响应式字符积累 pendingText 与 RAF 调度标识
  let pendingText = '';
  let rafId: number | null = null;

  // 实例化一个标准的 Markdown-it 解析器 (作为 AST 词法生成器)
  const md = new MarkdownIt({
    html: true,
    breaks: true
  });

  // RAF 物理帧渲染回调：每物理帧检查缓冲区，合并渲染一次
  const updateFrame = () => {
    if (renderedText.value !== pendingText) {
      renderedText.value = pendingText;
    }
    if (isInnerStreaming.value) {
      if (typeof window !== 'undefined' && window.requestAnimationFrame) {
        rafId = window.requestAnimationFrame(updateFrame);
      } else {
        // Node.js 环境或不支持 RAF 的环境降级同步
        rafId = null;
      }
    } else {
      rafId = null;
    }
  };

  function updateStream(text: string, isStreaming: boolean) {
    isInnerStreaming.value = isStreaming;

    // 1. 将高频输出放入非响应式缓冲区
    pendingText = text;

    // 2. 如果是流式状态，启动 RAF 节流调度；如果是结束/非流式，立即同步
    if (isStreaming) {
      if (typeof window !== 'undefined' && window.requestAnimationFrame) {
        if (!rafId) {
          rafId = window.requestAnimationFrame(updateFrame);
        }
      } else {
        // Node.js 单元测试环境直接同步更新
        renderedText.value = pendingText;
      }
    } else {
      if (rafId && typeof window !== 'undefined') {
        window.cancelAnimationFrame(rafId);
        rafId = null;
      }
      renderedText.value = pendingText;
    }
  }

  function reset() {
    if (rafId && typeof window !== 'undefined') {
      window.cancelAnimationFrame(rafId);
      rafId = null;
    }
    pendingText = '';
    renderedText.value = '';
    isInnerStreaming.value = false;
    paragraphObjects = [];
  }

  // 3. 核心逻辑：将流式文本解析，并用 Treeify 转换得到 VNode 渲染节点树
  const nodesTree = computed<RendererNode[]>(() => {
    if (!renderedText.value) return [];

    // 【启发式尾部修剪】防止流式打字中由于残损符号引起 DOM 频繁重绘与闪烁
    let processedText = enableTailoring 
      ? tailorStreamText(renderedText.value, isInnerStreaming.value)
      : renderedText.value;

    // 【语法自动补全】在流式过程中自动对残损格式进行闭合
    if (isInnerStreaming.value && enableCompletion) {
      processedText = completeMarkdownSyntax(processedText);
    }

    // 将文本合理切割为逻辑段落块 (防 Multiline Blocks 解析破损)
    const blocks = splitIntoLogicalBlocks(processedText);
    const finalTokens: any[] = [];

    blocks.forEach((blockText, index) => {
      const isLastBlock = index === blocks.length - 1;
      // 只有当大模型正在流式输出，且为最后一个段落时，判定为 Active 状态（暂不使用/存入缓存）
      const finalized = !(isInnerStreaming.value && isLastBlock);

      if (finalized) {
        // 在段落维护列表中查找或实例化唯一的 Key 对象
        let pObj = paragraphObjects[index];
        if (!pObj || pObj.text !== blockText) {
          pObj = { text: blockText };
          paragraphObjects[index] = pObj;
          astCache.delete(pObj);
        }

        // 尝试读取 WeakMap 缓存
        const cachedTokens = astCache.get(pObj);
        if (cachedTokens) {
          finalTokens.push(...cachedTokens);
        } else {
          const pTokens = md.parse(blockText, {});
          astCache.set(pObj, pTokens);
          finalTokens.push(...pTokens);
        }
      } else {
        // 处于 Active 中间态的段落文本，执行实时编译，绝不缓存
        const pTokens = md.parse(blockText, {});
        finalTokens.push(...pTokens);
      }
    });

    // 将扁平 Tokens 树形化重组为 VNode 渲染树
    const nodes = treeifyTokens(finalTokens);
    if (isInnerStreaming.value && nodes.length > 0) {
      const lastNode = nodes[nodes.length - 1];
      nodes[nodes.length - 1] = { ...lastNode, isActive: true };
    }
    return nodes;
  });

  return {
    nodesTree,
    renderedText,
    isStreaming: isInnerStreaming,
    updateStream,
    reset
  };
}
