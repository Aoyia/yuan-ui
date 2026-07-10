# 流式渲染配置面板亮色化与去 Emoji 重构 实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 将 Playground 中流式渲染 Tab 栏左侧配置面板重构为符合字节 Arco Design 的白色主题，去除所有 Emoji，且保持暗黑模式兼容。

**架构：**
- 修改 `playground/components/RendererDemo.vue` 去除所有 Emoji，使配置面板的文案更加严谨。
- 修改 `playground/style.css` 重构 `.code-panel` 样式。在亮色模式（默认）下，配置面板主体、页签头部、下拉框、大模型原始字符缓冲区、AST 监视器均改用白色/淡灰色调，而在暗色模式下（`.dark`）保持原有的暗色美学。

**技术栈：** Vue 3, CSS (Vanilla CSS), Vite

---

## 文件职责
- [RendererDemo.vue](file:///Users/neoyuan/Desktop/aoyi/yuan-ui/playground/components/RendererDemo.vue)： Playground 大模型流式输出模拟器 Demo 页面，负责渲染左侧配置面板和右侧 Markdown 运行时预览视图。
- [style.css](file:///Users/neoyuan/Desktop/aoyi/yuan-ui/playground/style.css)： 游乐场（Playground）专属全局样式表，负责整体布局风格、交互样式。

---

### 任务 1：结构与文案调整（去除 Emoji）

**文件：**
- 修改：`playground/components/RendererDemo.vue`

- [ ] **步骤 1：去除场景预设下拉选项中的 Emoji**
  修改 `playground/components/RendererDemo.vue` 中 60-70 行左右的选项文本：
  * `⚡ 极限测试：流式打字与划选复制` ➡️ `极限测试：流式打字与划选复制`
  * `✅ 正常组件渲染（数据合规）` ➡️ `正常组件渲染（数据合规）`
  * `⚠️ Zod 校验失败（触发错误面板与自我纠错）` ➡️ `Zod 校验失败（触发错误面板与自我纠错）`
  * `🚫 恶意非法标签注入（VNode 级沙箱拦截）` ➡️ `恶意非法标签注入（VNode 级沙箱拦截）`

- [ ] **步骤 2：去除速度预设标签中的 Emoji**
  修改 `playground/components/RendererDemo.vue` 中 89-94 行左右的速度预设文案：
  * `🚀 极速` ➡️ `极速`
  * `⚡ 飞快` ➡️ `飞快`
  * `🚶 正常` ➡️ `正常`
  * `🐌 较慢` ➡️ `较慢`

- [ ] **步骤 3：提交文案修改**
  ```bash
  git add playground/components/RendererDemo.vue
  git commit -m "style: remove emojis from config panel options and speed presets"
  ```

---

### 任务 2：样式与色彩重构（Arco 亮色风）

**文件：**
- 修改：`playground/style.css`

- [ ] **步骤 1：面板背景与分割线亮色化**
  在 `playground/style.css` 中修改：
  * `.code-panel` 在亮色模式下的背景色改为 `#ffffff`，右侧边框改为 `1px solid var(--yuan-border)`。
  * `.code-tab-header` 在亮色模式下的背景色改为 `#ffffff`，底部加一像素灰色边框 `1px solid var(--yuan-border-light)`。页签内文字 `.file-name` 颜色改为 `var(--yuan-text-primary)`。

- [ ] **步骤 2：下拉选择框与控制标签亮色化**
  在 `playground/style.css` 中修改：
  * 亮色模式下 `.control-select-box` 的背景色为 `#ffffff`，边框为 `var(--yuan-border)`，文字颜色为 `var(--yuan-text-primary)`；当悬浮/聚焦时，边框过渡为 `var(--yuan-primary)` (即蓝色 `#165dff`)。
  * 暗色模式（`.dark .control-select-box`）保持原有的 `#0f172a` 背景及深色边框。
  * 控制标签 `.control-label-text` 颜色在亮色下改为 `var(--yuan-text-secondary)` (即 `#4e5969`)，字重调为 `500`。

- [ ] **步骤 3：滑块调节容器与标签背景重置**
  在 `playground/style.css` 中修改：
  * 调节滑块容器 `.speed-slider-container` 亮色模式背景色改为 `var(--yuan-bg-muted)`。
  * 悬浮于未选中速度档位时背景色由紫色改为淡蓝色 `rgba(22, 93, 255, 0.05)`，选中状态的背景改为亮蓝色 `rgba(22, 93, 255, 0.1)` 且文本显色为 `var(--yuan-primary)`。

- [ ] **步骤 4：缓冲区终端（Terminal）与 AST 监视器卡片亮色化**
  在 `playground/style.css` 中修改：
  * 缓冲区 `.raw-terminal-view` 在亮色模式下的背景色改为 `var(--yuan-bg-muted)`，文本颜色改为 `#334155`，`blinker` 光标动画的颜色改为 `var(--yuan-primary)`。
  * AST 拦截监视卡片 `.ast-item-card` 亮色模式下的背景色改为 `#ffffff`，边框设为 `1px solid var(--yuan-border)`。其中的组件标签 `.ast-item-tag` 颜色改为 `var(--yuan-text-primary)`，内容 `.ast-item-content` 颜色改为 `var(--yuan-text-secondary)`。

- [ ] **步骤 5：提交样式修改**
  ```bash
  git add playground/style.css
  git commit -m "style: theme config panel as Arco-style light theme"
  ```

---

## 验证计划

### 自动化测试
运行本地的 Unit 测试确保没有任何逻辑破坏：
```bash
npm run test
```

### 手动验证
1. 启动本地开发服务：
   ```bash
   npm run dev
   ```
2. 在浏览器中访问本地 Playground，检查配置面板亮色和暗色主题下的切换效果，确认：
   * 亮色模式下，面板为纯白色背景，下拉框与滑块容器颜色柔和精致，缓冲区为灰蓝色大模型调试台，排版美观且符合 Arco Design。
   * 暗色模式下，面板及各组件能够自适应恢复为纯黑/暗灰色的高冷极客风格。
   * 所有场景选项和速度选择档位没有遗留任何 Emoji。
