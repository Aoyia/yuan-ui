# AgentTrace 视觉与内容打磨实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 将 `AgentTrace` 的视觉设计仿字节 Semi Design 规范重构，并对 `FileRenderer` 和 `DiffRenderer` 在长文本下的信息剪裁折叠功能进行精炼。

**架构：**
1. 统一在 `src/styles/theme.css` 中重定义字节规范的全局 CSS 自定义变量。
2. 彻底剥离各子渲染器组件中硬编码的各类十六进制背景色与边框色，引入 `var(--yuan-...)`。
3. 依靠 `isExpanded` 状态逻辑及 CSS 高度 Grid 过渡动画，在 File 和 Diff 渲染器中支持超过上限时的“渐变渐出蒙层”和“展开全文”按钮。

**技术栈：** Vue 3 (Composition API), CSS Variables, Lucide icons, Vitest

---

## 拟修改与新增文件

- [MODIFY] [theme.css](file:///Users/neoyuan/Desktop/aoyi/yuan-ui/src/styles/theme.css)
- [MODIFY] [FileRenderer.vue](file:///Users/neoyuan/Desktop/aoyi/yuan-ui/src/components/AgentTrace/renderers/FileRenderer.vue)
- [MODIFY] [DiffRenderer.vue](file:///Users/neoyuan/Desktop/aoyi/yuan-ui/src/components/AgentTrace/renderers/DiffRenderer.vue)
- [MODIFY] [TerminalRenderer.vue](file:///Users/neoyuan/Desktop/aoyi/yuan-ui/src/components/AgentTrace/renderers/TerminalRenderer.vue)
- [MODIFY] [ArtifactTraceNode.vue](file:///Users/neoyuan/Desktop/aoyi/yuan-ui/src/components/AgentTrace/renderers/ArtifactTraceNode.vue)
- [MODIFY] [TextTraceNode.vue](file:///Users/neoyuan/Desktop/aoyi/yuan-ui/src/components/AgentTrace/renderers/TextTraceNode.vue)
- [MODIFY] [ReasoningTraceNode.vue](file:///Users/neoyuan/Desktop/aoyi/yuan-ui/src/components/AgentTrace/renderers/ReasoningTraceNode.vue)
- [MODIFY] [ToolTraceNode.vue](file:///Users/neoyuan/Desktop/aoyi/yuan-ui/src/components/AgentTrace/renderers/ToolTraceNode.vue)
- [MODIFY] [GroupTraceNode.vue](file:///Users/neoyuan/Desktop/aoyi/yuan-ui/src/components/AgentTrace/renderers/GroupTraceNode.vue)

---

## 详细任务步骤

### 任务 1：重构全局主题 CSS 变量 (`src/styles/theme.css`)

**文件：**
- 修改：`src/styles/theme.css`

- [ ] **步骤 1：复写亮暗双色模式下的自定义变量**
  将 `src/styles/theme.css` 中的全局变量调整为字节 Semi Design / Lark 的色彩映射。

- [ ] **步骤 2：验证基本的 CSS 加载**
  运行命令行，确认项目构建无语法错误：
  运行：`npm run test`
  预期：测试通过

- [ ] **步骤 3：Commit**
  ```bash
  git add src/styles/theme.css
  git commit -m "style: map theme.css custom variables to Semi Design system"
  ```

---

### 任务 2：打磨 File 渲染器 (`FileRenderer.vue`)

**文件：**
- 修改：`src/components/AgentTrace/renderers/FileRenderer.vue`

- [ ] **步骤 1：引入 `isExpanded` 折叠状态，移除硬编码颜色**
  清理内部硬编码的 `#f8fafc`、`#f1f5f9`、`#e2e8f0` 等，换为 CSS 变量。定义 `isExpanded` 状态，控制当文件行数大与 12 行时是否进行切片。
  
- [ ] **步骤 2：添加渐变蒙层及展开按钮**
  在 `file-content-preview` 的外层加上 `position: relative`；在未展开且行数较长时，渲染一个绝对定位的渐变遮罩 `fade-mask` 和 `展开全文` 按钮。
  ```html
  <div v-if="!isExpanded && hasMore" class="fade-mask">
    <button type="button" class="expand-btn" @click="isExpanded = true">
      展开全文 (共 {{ totalLines }} 行)
    </button>
  </div>
  ```
  在 `<style scoped>` 中使用 CSS 渐变蒙层，透明到当前背景色 `var(--yuan-bg-muted)`。

- [ ] **步骤 3：运行测试并运行 Demo 校验**
  运行：`npm run test`
  预期：测试通过。

- [ ] **步骤 4：Commit**
  ```bash
  git add src/components/AgentTrace/renderers/FileRenderer.vue
  git commit -m "feat: implement expandable folding for FileRenderer with Semi aesthetics"
  ```

---

### 任务 3：打磨 Diff 渲染器 (`DiffRenderer.vue`)

**文件：**
- 修改：`src/components/AgentTrace/renderers/DiffRenderer.vue`

- [ ] **步骤 1：清理硬编码颜色并优化红绿底色**
  将硬编码的底色修改为符合 Semi 规范的：
  - 新增行：`rgba(0, 180, 42, 0.08)` (字节成功绿透亮)
  - 删除行：`rgba(245, 63, 63, 0.08)` (字节错误红透亮)
  - 侧边高亮条（`border-left`）加粗为 `3px`。

- [ ] **步骤 2：添加 Diff 折叠高度控制与展开按钮**
  在 Diff 行数大于 15 行时，提供与 FileRenderer 类似的渐变遮罩和 `展开全部代码修改` 按钮。
  ```html
  <div v-if="!isExpanded && hasMore" class="diff-fade-mask">
    <button type="button" class="expand-btn" @click="isExpanded = true">
      展开全部代码修改 (共 {{ parsedLines.length }} 行)
    </button>
  </div>
  ```

- [ ] **步骤 3：测试校验**
  运行：`npm run test`
  预期：测试通过。

- [ ] **步骤 4：Commit**
  ```bash
  git add src/components/AgentTrace/renderers/DiffRenderer.vue
  git commit -m "feat: support code clipping and folding for DiffRenderer"
  ```

---

### 任务 4：全局清理其他组件的硬编码样式并适配暗色模式

**文件：**
- 修改：`src/components/AgentTrace/renderers/TerminalRenderer.vue`
- 修改：`src/components/AgentTrace/renderers/ArtifactTraceNode.vue`
- 修改：`src/components/AgentTrace/renderers/TextTraceNode.vue`
- 修改：`src/components/AgentTrace/renderers/ReasoningTraceNode.vue`
- 修改：`src/components/AgentTrace/renderers/ToolTraceNode.vue`
- 修改：`src/components/AgentTrace/renderers/GroupTraceNode.vue`

- [ ] **步骤 1：将这些组件里的文字、线条和背景的硬编码十六进制值替换成全局 CSS 变量。**
  比如将 `ArtifactTraceNode` 中的底色、文字颜色和 border，更换为系统全局 CSS 变量；确保暗黑模式下无刺眼的高亮反差。

- [ ] **步骤 2：跑通完整单元测试**
  运行：`npm run test`
  预期：全部测试成功。

- [ ] **步骤 3：Commit**
  ```bash
  git add src/components/AgentTrace/renderers/*.vue
  git commit -m "style: clean hardcoded colors in all remaining trace node components"
  ```

---

## 验证与测试计划

### 自动化测试
运行：
```bash
npm run test
```
这应当跑通现有的所有 reducer 和流式逻辑测试，确保没有逻辑回归。

### 手动验证
1. 启动本地开发服务：已在后台运行（`localhost:5174`）。
2. 在浏览器中打开并切换系统到“明亮模式”和“暗黑模式”。
3. 点击“运行模拟”触发“高阶智能体 (Cursor)”场景。
4. 验证大文件读取时，`FileRenderer` 显示前 10 行并伴有遮罩和“展开全文”按钮；点击可展开显示全部代码。
5. 验证应用补丁时，`DiffRenderer` 显示精致高亮，长 Diff 时有平滑折叠展开；
6. 检查整个 AgentTrace 的配色是否已完美改变为字节 Semi 科技蓝（`#165DFF`）主基调。
