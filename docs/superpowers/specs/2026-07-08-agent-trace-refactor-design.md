# AgentTrace 视觉与内容精炼设计规范 (字节 Semi Design 风格)

本文档定义了 `AgentTrace` 组件的视觉配色重构以及 Diff & File 渲染器的第一性与剃刀原理打磨方案。

## 1. 配色系统重构 (仿字节 Semi Design / Lark)

我们将全面清理原组件中硬编码的各类十六进制颜色，统一规范并映射到全局 CSS 自定义变量。

### 1.1 亮色模式 (Light Mode) 变量
定义在 `src/styles/theme.css` 的 `:root` 选择器中：
```css
:root {
  /* 字节 Semi 蓝主色调 */
  --yuan-primary: #165dff;
  --yuan-primary-hover: #4080ff;
  --yuan-primary-light: #e8f3ff;
  
  /* 辅助状态色 (Semi Design 标准) */
  --yuan-success: #00b42a;
  --yuan-success-hover: #23c343;
  --yuan-success-light: #e8ffeb;
  
  --yuan-error: #f53f3f;
  --yuan-error-hover: #f76560;
  --yuan-error-light: #ffeceb;
  
  --yuan-warning: #ff7d00;
  --yuan-warning-hover: #ff9a2e;
  --yuan-warning-light: #fff7e8;
  
  /* 中性色与边框 */
  --yuan-border: #e5e6eb;
  --yuan-border-light: #f2f3f5;
  --yuan-bg: #ffffff;
  --yuan-bg-muted: #f7f8fa;
  
  /* 精确控制文字颜色体系 */
  --yuan-text-primary: #1d2129;
  --yuan-text-secondary: #4e5969;
  --yuan-text-tertiary: #86909c;
  
  /* 统一圆角 */
  --yuan-radius: 4px; /* 字节风格偏硬朗，采用 4px 微圆角 */
  --yuan-radius-sm: 2px;
  --yuan-radius-lg: 6px;
}
```

### 1.2 暗色模式 (Dark Mode) 变量
定义在 `src/styles/theme.css` 的 `.dark` 选择器中：
```css
.dark {
  /* 字节 Semi 暗色主色调 */
  --yuan-primary: #3c7eff;
  --yuan-primary-hover: #689eff;
  --yuan-primary-light: #161b26;
  
  /* 辅助状态色 */
  --yuan-success: #00b42a;
  --yuan-success-light: #142416;
  
  --yuan-error: #f53f3f;
  --yuan-error-light: #2c1616;
  
  --yuan-warning: #ff7d00;
  --yuan-warning-light: #2c1e14;
  
  /* 暗色中性底 */
  --yuan-border: #303030;
  --yuan-border-light: #232324;
  --yuan-bg: #16161a;
  --yuan-bg-muted: #1d1d1f;
  
  /* 暗色文字 */
  --yuan-text-primary: #f2f3f5;
  --yuan-text-secondary: #a6a9ad;
  --yuan-text-tertiary: #797a7d;
}
```

### 1.3 组件内硬编码样式清理
将清除以下组件内的硬编码颜色：
- `FileRenderer.vue`: 清理 `#f8fafc`、`#f1f5f9`、`#e2e8f0`、`#334155`，全部映射到相应的全局 `var(--yuan-...)` 变量。
- `DiffRenderer.vue`: 清理 `#fafafa`、`#f1f5f9` 等。将 `diff-add` 和 `diff-delete` 背景改为带 alpha 通道的透亮颜色：
  - 新增行：`background-color: rgba(0, 180, 42, 0.08); color: var(--yuan-success);`
  - 删除行：`background-color: rgba(245, 63, 63, 0.08); color: var(--yuan-error);`
- `TerminalRenderer.vue`: 保持终端背景 `#0b0f19` (深邃极客墨绿黑) 亮暗一致，以维护终端沉浸感，但悬浮复制按钮和微边框样式改用全局变量。
- `ArtifactTraceNode.vue` & `TextTraceNode.vue` & `ReasoningTraceNode.vue`: 清理所有与文本、边框相关的硬编码色彩，使其自动随暗黑模式平滑换肤。

---

## 2. File 渲染器 (`FileRenderer.vue`) 打磨

从第一性原理出发，文件阅读的目的是为了说明 AI 读取了什么内容。太长时折叠可以剔除无关视觉噪音。

### 2.1 状态与逻辑
- 内部引入响应式变量 `isExpanded = ref(false)`。
- 计算属性判断文件行数是否超过 12 行。
- 如果超过 12 行且 `!isExpanded`：
  - 只渲染前 10 行。
  - 在代码展示区域（`pre` 标签）下方覆盖一层绝对定位的渐变遮罩。
- 渐变遮罩使用混合背景色，从 `transparent` 渐变至当前背景色 `var(--yuan-bg)` (在 `pre` 内部是 `var(--yuan-bg-muted)`)。
- 遮罩层中放置一个极其轻量化、极细边框的 Semi 按钮 `展开全文 (共 N 行)`。
- 点击按钮，`isExpanded.value = true`，平滑渐入显示全文。

### 2.2 视觉降噪
- 删除内部 `pre` 的嵌套 border，使 `pre` 与卡片本身边框融合，减少线条嵌套带来的杂乱感。

---

## 3. Diff 差异渲染器 (`DiffRenderer.vue`) 打磨

Diff 的本质是让用户迅速审查修改。若修改过多，默认全铺会严重破坏时间线紧凑度。

### 3.1 状态与逻辑
- 同 File 渲染器类似，引入 `isExpanded = ref(false)` 状态。
- 若 Diff 的总行数大于 15 行，默认折叠，仅展示前 12 行。
- 提供底部的平滑渐变渐出蒙层，并渲染 `查看全部代码修改` 按钮。
- 点击时平滑展开。

### 3.2 边缘与线条表现
- 改动指示线：删除行与新增行左侧的 `border-left` 加粗为 `3px`，提升侧边引导条的高亮清晰度。
- 修改背景对比度：使用完全透明化配置，保证亮色模式和暗色模式下改动背景纯净、不脏。

---

## 4. 验证计划

- **模拟运行验证**：运行本地 `Vite` 端口 `http://localhost:5174/`，在工作台触发“高阶智能体”模拟，验证在亮暗色模式下，当 AI 执行大文件读取（`read_file`）和代码应用（`write_file`）时，File 和 Diff 渲染器的折叠样式、渐变蒙层表现，以及点击“展开全文”的动画流畅性。
- **单元测试验证**：确保现存的 `reducer.test.ts` 测试及渲染逻辑不受折叠状态影响。
