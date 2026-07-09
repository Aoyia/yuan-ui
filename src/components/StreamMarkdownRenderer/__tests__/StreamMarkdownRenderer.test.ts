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
});
