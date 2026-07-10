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
