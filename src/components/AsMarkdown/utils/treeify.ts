import type { RendererNode, RendererElementNode } from '../types';

// 辅助函数：解析叶子节点 (检查并识别 HTML 自定义标签)
export function parseLeafToken(token: any): RendererNode {
  const content = token.content ? token.content.trim() : '';

  // 解析以 <df- 开头的开标签，例如 <df-bar-chart dataset='...'> 或 <df-bar-chart dataset='...' />
  const match = content.match(/^<df-([a-zA-Z0-9_-]+)([^>]*)/);
  if (match) {
    const tag = `df-${match[1]}`;
    const attrStr = match[2];
    const props: Record<string, any> = {};

    // 正则提取 dataset 等键值属性 (支持单双引号嵌套)
    const attrRegex = /([a-zA-Z0-9_-]+)=(['"])(.*?)\2/g;
    let attrMatch;
    while ((attrMatch = attrRegex.exec(attrStr)) !== null) {
      props[attrMatch[1]] = attrMatch[3];
    }

    return {
      type: 'component',
      tag: tag,
      props: props
    };
  }

  // 普通纯文本节点
  return {
    type: 'text',
    content: token.content
  };
}

export function treeifyTokens(tokens: any[]): RendererNode[] {
  const root: RendererElementNode = { type: 'element', tag: 'root', children: [], props: {} };
  const stack: RendererElementNode[] = [root];

  tokens.forEach(token => {
    const currentParent = stack[stack.length - 1];
    if (!currentParent) return; // 安全防护

    const content = token.content ? token.content.trim() : '';

    // 1. 前置过滤自定义闭标签 (例如 </df-bar-chart>)：因为开标签已包含全部属性且已渲染，闭标签直接忽略防重叠
    if ((token.type === 'html_inline' || token.type === 'html_block') && content.startsWith('</df-')) {
      return;
    }

    // 2. 前置处理自定义开标签 (例如 <df-bar-chart dataset='...'>)
    if ((token.type === 'html_inline' || token.type === 'html_block') && content.startsWith('<df-')) {
      const leaf = parseLeafToken(token);
      if (leaf) {
        currentParent.children.push(leaf);
      }
      return; // 自定义组件作为原子叶子节点，不需要压栈，直接返回
    }

    // 3. 处理大代码块 (fence 或是 code_block) -> 直接包装为 df-code-block 组件
    if (token.type === 'fence' || token.type === 'code_block') {
      const leaf = {
        type: 'component' as const,
        tag: 'df-code-block',
        props: {
          code: token.content,
          lang: token.info || 'text'
        }
      };
      currentParent.children.push(leaf);
      return;
    }

    // 4. 行内代码 code_inline -> 映射为 df-inline-code 组件
    if (token.type === 'code_inline') {
      const leaf = {
        type: 'component' as const,
        tag: 'df-inline-code',
        props: { content: token.content }
      };
      currentParent.children.push(leaf);
      return;
    }

    if (token.nesting === 1) {
      // 5. 开启节点标签：映射为 dxf 专属组件类型
      let compTag = token.tag;
      const props: Record<string, any> = {};

      if (token.tag === 'p') {
        compTag = 'df-paragraph';
      } else if (token.tag.match(/^h[1-6]$/)) {
        compTag = 'df-heading';
        props.level = parseInt(token.tag.slice(1));
      } else if (token.tag === 'strong') {
        compTag = 'df-strong';
      }

      const node: RendererElementNode = {
        tag: compTag,
        type: 'element',
        props: props,
        children: []
      };
      currentParent.children.push(node);
      stack.push(node);
    } else if (token.nesting === -1) {
      // 6. 关闭节点标签，出栈回到父节点级别
      if (stack.length > 1) {
        stack.pop();
      }
    } else {
      // 7. 自闭合或行内内容节点处理
      if (token.type === 'inline') {
        if (token.children) {
          // 核心改进：深度递归 treeifyTokens 重构行内扁平的子 Token 链
          const inlineChildren = treeifyTokens(token.children);
          currentParent.children.push(...inlineChildren);
        }
      } else {
        currentParent.children.push(parseLeafToken(token));
      }
    }
  });

  return root.children;
}
