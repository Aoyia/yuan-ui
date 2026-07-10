# Markdown 语法自动补全 实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 在流式打字渲染过程中，对未闭合的 Markdown 语法进行自动补全，避免样式闪烁。

**架构：** 
在 [useStreamRenderer.ts](file:///Users/neoyuan/Desktop/aoyi/yuan-ui/src/components/StreamMarkdownRenderer/useStreamRenderer.ts) 内部计算属性 `nodesTree` 中，对经过残损修剪后的文本（`tailoredText`）调用 `completeMarkdownSyntax` 进行补全处理。补全函数基于单次遍历扫描器和状态栈，动态追踪未闭合标记，在尾部按嵌套次序追加闭合标记。

**技术栈：** Vue 3, TypeScript, Vitest

---

### 任务 1：创建 Markdown 语法自动补全工具函数

**文件：**
- 创建：`src/components/StreamMarkdownRenderer/utils/autocomplete.ts`
- 测试：`src/components/StreamMarkdownRenderer/__tests__/autocomplete.test.ts`

- [ ] **步骤 1：编写失败的测试**

创建 `src/components/StreamMarkdownRenderer/__tests__/autocomplete.test.ts`，写入以下测试：

```typescript
import { describe, it, expect } from 'vitest';
import { completeMarkdownSyntax } from '../utils/autocomplete';

describe('completeMarkdownSyntax', () => {
  it('should complete simple styles like bold and italic', () => {
    expect(completeMarkdownSyntax('**bold text')).toBe('**bold text**');
    expect(completeMarkdownSyntax('**bold *italic text')).toBe('**bold *italic text***');
    expect(completeMarkdownSyntax('__bold __italic text')).toBe('__bold __italic text____');
  });

  it('should not complete when there is no text content after the tag', () => {
    expect(completeMarkdownSyntax('normal text **')).toBe('normal text **');
    expect(completeMarkdownSyntax('normal text ** ')).toBe('normal text ** ');
    expect(completeMarkdownSyntax('normal text `')).toBe('normal text `');
  });

  it('should complete inline code and math formulas', () => {
    expect(completeMarkdownSyntax('`const a = 1')).toBe('`const a = 1`');
    expect(completeMarkdownSyntax('$x + y = z')).toBe('$x + y = z$');
    expect(completeMarkdownSyntax('$$E = mc^2')).toBe('$$E = mc^2$$');
  });

  it('should complete multi-line code blocks and insert a newline if missing', () => {
    expect(completeMarkdownSyntax('```javascript\nconst a = 1;')).toBe('```javascript\nconst a = 1;\n```');
    expect(completeMarkdownSyntax('```javascript\nconst a = 1;\n')).toBe('```javascript\nconst a = 1;\n```');
  });

  it('should ignore formatting tags inside code blocks and inline code', () => {
    expect(completeMarkdownSyntax('```javascript\nconst **a** = 1;')).toBe('```javascript\nconst **a** = 1;\n```');
    expect(completeMarkdownSyntax('`const **a** = 1')).toBe('`const **a** = 1`');
  });
});
```

- [ ] **步骤 2：运行测试验证失败**

运行：`npx vitest run src/components/StreamMarkdownRenderer/__tests__/autocomplete.test.ts`
预期：FAIL（文件不存在或模块未导出）

- [ ] **步骤 3：编写最少实现代码**

创建 `src/components/StreamMarkdownRenderer/utils/autocomplete.ts`：

```typescript
export function completeMarkdownSyntax(text: string): string {
  if (!text) return text;

  const len = text.length;
  let state: 'NORMAL' | 'CODE_BLOCK' | 'INLINE_CODE' | 'MATH_BLOCK' | 'MATH_INLINE' = 'NORMAL';
  const styleStack: string[] = [];

  let i = 0;
  while (i < len) {
    const char = text[i];
    const nextChar = i + 1 < len ? text[i + 1] : '';

    if (state === 'NORMAL') {
      // 1. 代码块
      if (char === '`' && nextChar === '`' && i + 2 < len && text[i + 2] === '`') {
        const remaining = text.slice(i + 3);
        const hasContent = remaining.trim().length > 0;
        if (hasContent) {
          state = 'CODE_BLOCK';
          i += 3;
        } else {
          // 末尾孤立的 ```，不触发状态
          i += 3;
        }
        continue;
      }

      // 2. 行内代码
      if (char === '`') {
        const remaining = text.slice(i + 1);
        const hasContent = remaining.trim().length > 0;
        if (hasContent) {
          state = 'INLINE_CODE';
          i += 1;
        } else {
          i += 1;
        }
        continue;
      }

      // 3. LaTeX 块公式
      if (char === '$' && nextChar === '$') {
        const remaining = text.slice(i + 2);
        const hasContent = remaining.trim().length > 0;
        if (hasContent) {
          state = 'MATH_BLOCK';
          i += 2;
        } else {
          i += 2;
        }
        continue;
      }

      // 4. LaTeX 行内公式
      if (char === '$') {
        const remaining = text.slice(i + 1);
        const hasContent = remaining.trim().length > 0;
        if (hasContent) {
          state = 'MATH_INLINE';
          i += 1;
        } else {
          i += 1;
        }
        continue;
      }

      // 5. 样式标记：**, __
      if ((char === '*' && nextChar === '*') || (char === '_' && nextChar === '_')) {
        const marker = char + nextChar;
        const top = styleStack[styleStack.length - 1];
        if (top === marker) {
          styleStack.pop();
        } else {
          const remaining = text.slice(i + 2);
          if (remaining.trim().length > 0) {
            styleStack.push(marker);
          }
        }
        i += 2;
        continue;
      }

      // 6. 样式标记：*, _
      if (char === '*' || char === '_') {
        const marker = char;
        const top = styleStack[styleStack.length - 1];
        if (top === marker) {
          styleStack.pop();
        } else {
          const remaining = text.slice(i + 1);
          if (remaining.trim().length > 0) {
            styleStack.push(marker);
          }
        }
        i += 1;
        continue;
      }

      i++;
    } else if (state === 'CODE_BLOCK') {
      if (char === '`' && nextChar === '`' && i + 2 < len && text[i + 2] === '`') {
        state = 'NORMAL';
        i += 3;
      } else {
        i++;
      }
    } else if (state === 'INLINE_CODE') {
      if (char === '`') {
        state = 'NORMAL';
        i += 1;
      } else {
        i++;
      }
    } else if (state === 'MATH_BLOCK') {
      if (char === '$' && nextChar === '$') {
        state = 'NORMAL';
        i += 2;
      } else {
        i++;
      }
    } else if (state === 'MATH_INLINE') {
      if (char === '$') {
        state = 'NORMAL';
        i += 1;
      } else {
        i++;
      }
    }
  }

  // 追加闭合标记
  let appended = '';
  if (state === 'CODE_BLOCK') {
    if (text[len - 1] === '\n') {
      appended = '```';
    } else {
      appended = '\n```';
    }
  } else if (state === 'INLINE_CODE') {
    appended = '`';
  } else if (state === 'MATH_BLOCK') {
    appended = '$$';
  } else if (state === 'MATH_INLINE') {
    appended = '$';
  } else {
    // 普通状态下，闭合栈中所有未闭合样式
    while (styleStack.length > 0) {
      appended += styleStack.pop();
    }
  }

  return text + appended;
}
```

- [ ] **步骤 4：运行测试验证通过**

运行：`npx vitest run src/components/StreamMarkdownRenderer/__tests__/autocomplete.test.ts`
预期：PASS

- [ ] **步骤 5：Commit**

```bash
git add src/components/StreamMarkdownRenderer/utils/autocomplete.ts src/components/StreamMarkdownRenderer/__tests__/autocomplete.test.ts
git commit -m "feat: add markdown autocompletion parser and tests"
```

---

### 任务 2：将补全逻辑集成到 StreamMarkdownRenderer 中

**文件：**
- 修改：`src/components/StreamMarkdownRenderer/types.ts`
- 修改：`src/components/StreamMarkdownRenderer/useStreamRenderer.ts`
- 测试：`src/components/StreamMarkdownRenderer/__tests__/useStreamRenderer.test.ts`

- [ ] **步骤 1：增加测试用例并定义 options 配置**

在 `src/components/StreamMarkdownRenderer/__tests__/useStreamRenderer.test.ts` 中增加两个测试用例：

```typescript
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
      children: [
        { type: 'text', content: 'Hello ' },
        {
          type: 'element',
          tag: 'df-strong',
          props: {},
          children: [
            { type: 'text', content: 'bold text' }
          ]
        }
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
      children: [
        { type: 'text', content: 'Hello **bold text' }
      ]
    });
  });
```

- [ ] **步骤 2：运行测试验证失败**

运行：`npx vitest run src/components/StreamMarkdownRenderer/__tests__/useStreamRenderer.test.ts`
预期：FAIL (类型报错且新增测试用例失败)

- [ ] **步骤 3：实现代码**

1. 修改 `src/components/StreamMarkdownRenderer/types.ts`，为 `UseStreamRendererOptions` 接口增加 `enableCompletion?: boolean;`：

```typescript
export interface UseStreamRendererOptions {
  enableTailoring?: boolean;
  enableCompletion?: boolean; // 新增
}
```

2. 修改 `src/components/StreamMarkdownRenderer/useStreamRenderer.ts`，导入 `completeMarkdownSyntax` 并集成到渲染管道：

```typescript
// 修改导入
import { tailorStreamText } from './utils/tailor';
import { completeMarkdownSyntax } from './utils/autocomplete'; // 新增

// 修改 useStreamRenderer 的实现
export function useStreamRenderer(options: UseStreamRendererOptions = {}) {
  const { enableTailoring = true, enableCompletion = true } = options; // 解构新增项
  
  // ...
  
  const nodesTree = computed<RendererNode[]>(() => {
    if (!renderedText.value) return [];

    // 【启发式尾部修剪】防止流式打字中由于残损符号引起 DOM 频繁重绘与闪烁
    let processedText = enableTailoring 
      ? tailorStreamText(renderedText.value, isInnerStreaming.value)
      : renderedText.value;

    // 【新增语法补全】在流式过程中自动对残损格式进行闭合
    if (isInnerStreaming.value && enableCompletion) {
      processedText = completeMarkdownSyntax(processedText);
    }

    // 将文本合理切割为逻辑段落块
    const blocks = splitIntoLogicalBlocks(processedText);
    // ... 后续逻辑保持不变
```

- [ ] **步骤 4：运行测试验证通过**

运行：`npm test` 确认所有测试全部 PASS。

- [ ] **步骤 5：Commit**

```bash
git add src/components/StreamMarkdownRenderer/types.ts src/components/StreamMarkdownRenderer/useStreamRenderer.ts src/components/StreamMarkdownRenderer/__tests__/useStreamRenderer.test.ts
git commit -m "feat: integrate autocomplete utility into useStreamRenderer and add pipeline tests"
```

---

### 任务 3：本地运行 Playground 手动验证

- [ ] **步骤 1：启动开发服务器**

在项目根目录下运行 `npm run dev`，启动 Vite 端口。

- [ ] **步骤 2：在浏览器中输入测试语法并观察其渲染状态**

在 Playground 测试输入框中开启打字流模拟：
1. 输入 `**加粗文本` 观察其是否即时呈现为加粗组件。
2. 输入 ```` ```js\nconst a = 1; ```` 观察是否自动出现代码块包裹器。
3. 关闭打字流，确保渲染结果与原始文本保持一致，没有任何副作用。
