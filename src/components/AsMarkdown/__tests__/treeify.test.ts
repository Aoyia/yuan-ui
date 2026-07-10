import { describe, it, expect } from 'vitest';
import { treeifyTokens } from '../utils/treeify';

describe('treeifyTokens', () => {
  it('should transform plain text token', () => {
    const tokens = [
      { type: 'text', content: 'hello world' }
    ];
    const nodes = treeifyTokens(tokens);
    expect(nodes).toEqual([
      { type: 'text', content: 'hello world' }
    ]);
  });

  it('should transform custom components and parse properties', () => {
    const tokens = [
      {
        type: 'html_inline',
        content: '<dxf-bar-chart dataset=\'{"title":"chart","values":[1,2]}\'></dxf-bar-chart>'
      }
    ];
    const nodes = treeifyTokens(tokens);
    expect(nodes).toEqual([
      {
        type: 'component',
        tag: 'dxf-bar-chart',
        props: {
          dataset: '{"title":"chart","values":[1,2]}'
        }
      }
    ]);
  });

  it('should transform code block fence to dxf-code-block component', () => {
    const tokens = [
      {
        type: 'fence',
        tag: 'code',
        info: 'typescript',
        content: 'const a = 1;'
      }
    ];
    const nodes = treeifyTokens(tokens);
    expect(nodes).toEqual([
      {
        type: 'component',
        tag: 'dxf-code-block',
        props: {
          code: 'const a = 1;',
          lang: 'typescript'
        }
      }
    ]);
  });

  it('should transform inline code to dxf-inline-code component', () => {
    const tokens = [
      {
        type: 'code_inline',
        content: 'const b = 2;'
      }
    ];
    const nodes = treeifyTokens(tokens);
    expect(nodes).toEqual([
      {
        type: 'component',
        tag: 'dxf-inline-code',
        props: {
          content: 'const b = 2;'
        }
      }
    ]);
  });

  it('should construct nesting tree for elements like paragraph or headings', () => {
    const tokens = [
      {
        type: 'paragraph_open',
        tag: 'p',
        nesting: 1
      },
      {
        type: 'inline',
        content: 'inner text',
        children: [
          { type: 'text', content: 'inner text' }
        ]
      },
      {
        type: 'paragraph_close',
        tag: 'p',
        nesting: -1
      }
    ];
    const nodes = treeifyTokens(tokens);
    expect(nodes).toEqual([
      {
        type: 'element',
        tag: 'dxf-paragraph',
        props: {},
        children: [
          { type: 'text', content: 'inner text' }
        ]
      }
    ]);
  });
});
