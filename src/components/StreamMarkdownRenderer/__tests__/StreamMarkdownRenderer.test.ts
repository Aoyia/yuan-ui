// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import StreamMarkdownRenderer from '../StreamMarkdownRenderer.vue';

describe('StreamMarkdownRenderer Wrapper Component', () => {
  it('should compile and render dynamic text', async () => {
    const wrapper = mount(StreamMarkdownRenderer, {
      props: {
        text: 'Initial Text',
        isStreaming: false
      }
    });

    // 占位阶段必然是空的，我们将随着具体实现的加入看到它通过
    expect(wrapper.text()).toBe('Initial Text');

    // 改变 props 并观察响应
    await wrapper.setProps({ text: 'Updated Text' });
    expect(wrapper.text()).toBe('Updated Text');
  });

  it('should emit render-complete when streaming finishes', async () => {
    const wrapper = mount(StreamMarkdownRenderer, {
      props: {
        text: 'Streaming content...',
        isStreaming: true
      }
    });

    expect(wrapper.emitted('render-complete')).toBeUndefined();

    // 流式结束
    await wrapper.setProps({ isStreaming: false });
    expect(wrapper.emitted('render-complete')).toBeDefined();
  });

  it('should auto-scroll to bottom when streaming and was at bottom', async () => {
    const container = document.createElement('div');
    Object.defineProperties(container, {
      scrollHeight: { writable: true, value: 100 },
      clientHeight: { writable: true, value: 50 },
      scrollTop: { writable: true, value: 50 }, // scrollTop (50) + clientHeight (50) = scrollHeight (100)
    });

    const wrapper = mount(StreamMarkdownRenderer, {
      props: {
        text: 'Hello',
        isStreaming: true,
        scrollContainer: container,
        scrollOffset: 10,
      }
    });

    // 模拟由于 DOM 改变导致的高度增长，同时在 pre-watch 之前保持在底部（scrollTop 设为 100，距离底部 0 <= 10）
    (container as any).scrollHeight = 150;
    container.scrollTop = 100;
    
    await wrapper.setProps({ text: 'Hello World' });
    await nextTick();

    // 验证是否已自动滚动到最新的 scrollHeight
    expect(container.scrollTop).toBe(150);
  });

  it('should NOT auto-scroll when user is not at bottom', async () => {
    const container = document.createElement('div');
    Object.defineProperties(container, {
      scrollHeight: { writable: true, value: 100 },
      clientHeight: { writable: true, value: 50 },
      scrollTop: { writable: true, value: 10 }, // 距离底部 40px > scrollOffset (20)
    });

    const wrapper = mount(StreamMarkdownRenderer, {
      props: {
        text: 'Hello',
        isStreaming: true,
        scrollContainer: container,
        scrollOffset: 20,
      }
    });

    // 模拟由于 DOM 改变导致的高度增长，但保持不在底部（scrollTop 设为 50，距离底部 50 > 20）
    (container as any).scrollHeight = 150;
    container.scrollTop = 50;

    await wrapper.setProps({ text: 'Hello World' });
    await nextTick();

    expect(container.scrollTop).toBe(50);
  });

  it('should NOT auto-scroll when autoScroll is disabled', async () => {
    const container = document.createElement('div');
    Object.defineProperties(container, {
      scrollHeight: { writable: true, value: 100 },
      clientHeight: { writable: true, value: 50 },
      scrollTop: { writable: true, value: 50 },
    });

    const wrapper = mount(StreamMarkdownRenderer, {
      props: {
        text: 'Hello',
        isStreaming: true,
        scrollContainer: container,
        autoScroll: false,
      }
    });

    (container as any).scrollHeight = 150;
    container.scrollTop = 100;

    await wrapper.setProps({ text: 'Hello World' });
    await nextTick();

    expect(container.scrollTop).toBe(100);
  });
});
