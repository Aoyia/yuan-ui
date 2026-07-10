# StreamMarkdownRenderer Markdown 语法自动补全功能设计规约

本文档定义了在大模型流式打字渲染过程中，对未闭合的 Markdown 语法进行“自动补全”的设计和实现细节。

## 1. 背景与目标
大模型在流式输出（Streaming）时，加粗（`**`）、斜体（`*`）、代码块（````` ``` `````）等成对的 Markdown 标记在未完全输出闭合标记前，会被 Markdown-it 解析为普通文本，导致页面样式频繁发生“普通文本 -> 格式化样式”的闪烁和抖动。
本功能的目标是在流式渲染文本送入 Markdown-it 解析器之前，**在字符层层面对未闭合的格式标记进行安全的自动闭合**，保证流式打字过程中的渲染连续性与视觉平滑度。

---

## 2. 用户决策与设计约束

> [!IMPORTANT]
> 根据与用户的澄清讨论，本设计严格遵守以下约束：
> 1. **仅当标记后已有内容时才补全**：若大模型刚刚输出 `**` 或 `` ` `` 等标记，其后尚未包含其他非空字符，则不进行补全，避免产生空的格式块或引发额外的渲染闪烁。
> 2. **代码块换行闭合**：如果多行代码块（````` ``` `````）在流式输出中尚未闭合，且最后一行代码尾部没有换行符，补全时**必须先插入换行符**再追加 ```（即追加 `\n````）。
> 3. **流式结束后不留存**：补全逻辑仅在 `isStreaming === true` 时生效，且补全字符不污染原始数据变量。流式结束后直接渲染 100% 原始文本。

---

## 3. 详细设计

### 3.1 渲染管道集成
在 [useStreamRenderer.ts](file:///Users/neoyuan/Desktop/aoyi/yuan-ui/src/components/StreamMarkdownRenderer/useStreamRenderer.ts) 的 `nodesTree` 计算属性中，将语法补全作为第二步：

```typescript
// 1. 启发式尾部修剪
let processedText = enableTailoring 
  ? tailorStreamText(renderedText.value, isInnerStreaming.value)
  : renderedText.value;

// 2. 语法自动补全 (新增)
if (isInnerStreaming.value && enableCompletion) {
  processedText = completeMarkdownSyntax(processedText);
}

// 3. 逻辑分块与缓存解析
const blocks = splitIntoLogicalBlocks(processedText);
```

### 3.2 语法补全核心算法 (`completeMarkdownSyntax`)
在 `src/components/StreamMarkdownRenderer/utils/autocomplete.ts` 中实现：

#### 算法细节
使用**单次字符遍历扫描器**：
- **状态寄存器**：`state` 初始为 `NORMAL`。可选状态：`IN_CODE_BLOCK`, `IN_INLINE_CODE`, `IN_MATH_BLOCK`, `IN_MATH_INLINE`。
- **嵌套样式栈**：`styleStack: string[]`（仅在 `NORMAL` 状态下收集样式标记 `**`, `__`, `*`, `_`）。

#### 状态转移逻辑
1. 当 `state === NORMAL`：
   - 遇到 ```` ``` ````：
     - 若后面紧邻字符串末尾或全是空白，忽略（不进入代码块，不补全）。
     - 否则，进入 `IN_CODE_BLOCK`，索引 `i += 3`。
   - 遇到 `` ` ``：
     - 若后面紧邻字符串末尾或全是空白，忽略。
     - 否则，进入 `IN_INLINE_CODE`，索引 `i += 1`。
   - 遇到 `$$`：
     - 若后面紧邻字符串末尾或全是空白，忽略。
     - 否则，进入 `IN_MATH_BLOCK`，索引 `i += 2`。
   - 遇到 `$`：
     - 若后面紧邻字符串末尾或全是空白/标点限制，忽略。
     - 否则，进入 `IN_MATH_INLINE`，索引 `i += 1`。
   - 遇到样式标记 `M`（`**`, `__`, `*`, `_`）：
     - 若 `M` 匹配 `styleStack` 的栈顶元素，弹出栈顶，表示样式闭合。
     - 否则，如果 `M` 后面有非空内容，则将 `M` 压入 `styleStack`。
     - 索引增加 `M` 的字符长度。
2. 当处于其他非 `NORMAL` 状态时，仅匹配对应的闭合标记：
   - `IN_CODE_BLOCK`：遇到 ```` ``` ```` 则返回 `NORMAL`。
   - `IN_INLINE_CODE`：遇到 `` ` `` 则返回 `NORMAL`。
   - `IN_MATH_BLOCK`：遇到 `$$` 则返回 `NORMAL`。
   - `IN_MATH_INLINE`：遇到 `$` 则返回 `NORMAL`。

#### 文本尾部追加逻辑
扫描结束后，若 `state !== NORMAL` 或 `styleStack` 不为空，在文本末尾追加对应字符：
- 若处于 `IN_CODE_BLOCK`：若文本不以 `\n` 结尾，追加 `\n``` `，否则追加 ```` ``` ````。
- 若处于 `IN_INLINE_CODE`：追加 `` ` ``。
- 若处于 `IN_MATH_BLOCK`：追加 `$$`。
- 若处于 `IN_MATH_INLINE`：追加 `$`。
- 若 `styleStack` 不为空：从栈顶向栈底依次弹出元素，拼接到文本末尾。

---

## 4. 验证计划

### 4.1 单元测试用例设计
在 `src/components/StreamMarkdownRenderer/__tests__/autocomplete.spec.ts` 中实现：
* **普通嵌套测试**：
  * 输入：`**粗体文本 *斜体文本` -> 输出：`**粗体文本 *斜体文本***`
* **无内容不补全测试**：
  * 输入：`这是一些文字 **` -> 输出：`这是一些文字 **`
  * 输入：`这是一些文字 ** ` -> 输出：`这是一些文字 ** `
* **代码块测试**：
  * 输入：```` ```javascript\nconst a = 1; ```` -> 输出：```` ```javascript\nconst a = 1;\n``` ```` (包含换行符)
  * 输入：```` ```javascript\nconst a = 1;\n ```` -> 输出：```` ```javascript\nconst a = 1;\n``` ````
* **LaTeX 公式测试**：
  * 输入：`$$ x = \frac{1}{2}` -> 输出：`$$ x = \frac{1}{2}$$`

### 4.2 交互测试
在 Playground 演示界面，输入测试文本并开启流式打字，观察其补全逻辑和视觉表现。
