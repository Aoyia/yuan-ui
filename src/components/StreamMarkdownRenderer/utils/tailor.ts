export function tailorStreamText(text: string, isStreaming: boolean): string {
  if (!isStreaming || !text) return text;

  // 1. 过滤行尾残欠的 HTML 自定义标签声明 (如 '<dxf-' 还没有输出到 '>')
  const tagIndex = text.lastIndexOf('<dxf-');
  if (tagIndex !== -1) {
    const remaining = text.slice(tagIndex);
    if (!remaining.includes('>')) {
      // 截断该残缺标签，等打字机完全输出闭合时再进行组件挂载
      return text.slice(0, tagIndex);
    }
  }

  let tailored = text;

  // 2.1 引用块修剪：行尾孤立的 '>'，临时剔除，防空引用突现
  if (tailored.endsWith('\n>') || tailored.endsWith('\r>')) {
    tailored = tailored.slice(0, -1);
  } else if (tailored.endsWith('\n> ') || tailored.endsWith('\r> ')) {
    tailored = tailored.slice(0, -2);
  }

  // 2.2 无序列表修剪：行尾孤立的 '-' 或 '*'，临时剔除，防列表点抖动
  if (tailored.endsWith('\n-') || tailored.endsWith('\n*')) {
    tailored = tailored.slice(0, -1);
  } else if (tailored.endsWith('\n- ') || tailored.endsWith('\n* ')) {
    tailored = tailored.slice(0, -2);
  }

  // 2.3 代码块符号修剪：根据连续反引号数量判断，如果不是 3 的整数倍，说明末尾的反引号残缺，需裁剪至 3 的整数倍
  const backtickMatch = tailored.match(/`+$/);
  if (backtickMatch) {
    const count = backtickMatch[0].length;
    const trimCount = count % 3;
    if (trimCount > 0) {
      tailored = tailored.slice(0, -trimCount);
    }
  }

  return tailored;
}
