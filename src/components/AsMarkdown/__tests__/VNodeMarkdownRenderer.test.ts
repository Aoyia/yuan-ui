// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { VNodeMarkdownRenderer } from '../VNodeMarkdownRenderer';
import type { RendererNode } from '../types';

describe('VNodeMarkdownRenderer Component', () => {
  it('should render plain text nodes', () => {
    const nodes: RendererNode[] = [
      { type: 'text', content: 'Plain text output' }
    ];
    const wrapper = mount(VNodeMarkdownRenderer, {
      props: { nodes }
    });
    expect(wrapper.text()).toBe('Plain text output');
  });

  it('should recursively render elements like paragraph and strong text', () => {
    const nodes: RendererNode[] = [
      {
        type: 'element',
        tag: 'dxf-paragraph',
        children: [
          { type: 'text', content: 'Normal text ' },
          {
            type: 'element',
            tag: 'dxf-strong',
            children: [{ type: 'text', content: 'bold text' }]
          }
        ]
      }
    ];
    const wrapper = mount(VNodeMarkdownRenderer, {
      props: { nodes }
    });
    const p = wrapper.find('p');
    expect(p.exists()).toBe(true);
    expect(p.classes()).toContain('dxf-paragraph');
    expect(p.find('strong').exists()).toBe(true);
    expect(p.find('strong').classes()).toContain('dxf-strong');
    expect(wrapper.text()).toBe('Normal text bold text');
  });

  it('should block non-whitelisted components and show warning sandbox message', () => {
    const nodes: RendererNode[] = [
      {
        type: 'component',
        tag: 'dxf-danger-terminal',
        props: { command: 'rm -rf /' }
      }
    ];
    const wrapper = mount(VNodeMarkdownRenderer, {
      props: {
        nodes,
        allowedComponents: ['dxf-bar-chart']
      }
    });
    expect(wrapper.text()).toContain('发现非白名单未授权组件: <dxf-danger-terminal>');
  });
});
