import { describe, it, expect } from 'vitest';
import { useStreamRenderer } from '../useStreamRenderer';

describe('useStreamRenderer Composable', () => {
  it('should parse simple text to node tree', () => {
    const { nodesTree, renderedText, updateStream } = useStreamRenderer();
    
    updateStream('Hello Paragraph', false);

    expect(renderedText.value).toBe('Hello Paragraph');
    expect(nodesTree.value.length).toBeGreaterThan(0);
    expect(nodesTree.value[0]).toEqual({
      type: 'element',
      tag: 'df-paragraph',
      props: {},
      children: [
        { type: 'text', content: 'Hello Paragraph' }
      ]
    });
  });

  it('should apply stream tailoring when isStreaming is true', () => {
    const { nodesTree, renderedText, updateStream } = useStreamRenderer();
    
    updateStream('Hello Paragraph\n-', true);

    // renderedText.value 仍然保留原始打字流数据，保障数据链完整
    expect(renderedText.value).toBe('Hello Paragraph\n-');
    
    // 裁剪机制仅影响生成的 VNode 节点树，使其临时去除残破的尾部列表符号
    expect(nodesTree.value.length).toBeGreaterThan(0);
    expect(nodesTree.value[0]).toEqual({
      type: 'element',
      tag: 'df-paragraph',
      props: {},
      isActive: true,
      children: [
        { type: 'text', content: 'Hello Paragraph' }
      ]
    });
  });

  it('should clean state when reset is called', () => {
    const { nodesTree, renderedText, updateStream, reset } = useStreamRenderer();
    
    updateStream('Hello Paragraph', false);
    expect(renderedText.value).toBe('Hello Paragraph');

    reset();
    expect(renderedText.value).toBe('');
    expect(nodesTree.value.length).toBe(0);
  });

  it('should apply stream autocompletion when enabled and isStreaming is true', () => {
    const { nodesTree, renderedText, updateStream } = useStreamRenderer({ enableCompletion: true });
    
    updateStream('Hello **bold text', true);

    expect(renderedText.value).toBe('Hello **bold text'); // 原始值不变
    
    // nodesTree 应该渲染加粗样式
    expect(nodesTree.value.length).toBeGreaterThan(0);
    expect(nodesTree.value[0]).toEqual({
      type: 'element',
      tag: 'df-paragraph',
      props: {},
      isActive: true,
      children: [
        { type: 'text', content: 'Hello ' },
        {
          type: 'element',
          tag: 'df-strong',
          props: {},
          children: [
            { type: 'text', content: 'bold text' }
          ]
        },
        { type: 'text', content: '' }
      ]
    });
  });

  it('should not autocomplete when enableCompletion is false', () => {
    const { nodesTree, renderedText, updateStream } = useStreamRenderer({ enableCompletion: false });
    
    updateStream('Hello **bold text', true);

    expect(renderedText.value).toBe('Hello **bold text');
    
    // 未补全，应该直接被解析为普通的文本
    expect(nodesTree.value.length).toBeGreaterThan(0);
    expect(nodesTree.value[0]).toEqual({
      type: 'element',
      tag: 'df-paragraph',
      props: {},
      isActive: true,
      children: [
        { type: 'text', content: 'Hello **bold text' }
      ]
    });
  });
});
