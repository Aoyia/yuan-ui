# 设计文档：Playground 名称重构为“思维链与 Markdown 流式渲染”

本项目旨在将本地 Playground 演示平台（原“Yuan UI 智能体工作台”）的名称和网页标题重构为“Yuan UI - 思维链与 Markdown 流式渲染”，并将顶栏右侧的切换按钮改为对应的业务描述文案，以更准确、更清晰地体现其作为组件库演示 Playground 的定位与功能内容。

## 变更范围

### 1. 顶栏品牌名称与切换按钮变更

#### [MODIFY] [App.vue](file:///Users/neoyuan/Desktop/aoyi/yuan-ui/playground/App.vue)
- 将顶栏 brand-text 品牌文字：
  `Yuan UI 智能体工作台`
  修改为：
  `Yuan UI - 思维链与 Markdown 流式渲染`
- 将切换按钮 `streamRenderer` 的文案（对标 Ant Design X 中的 `XMarkdown`，适配当前库的对应组件名）：
  `流式 VNode 渲染 (Renderer)`
  修改为：
  `StreamMarkdownRenderer`
- 将切换按钮 `trace` 的文案（对标 Ant Design X 中的 `ThoughtChain`，适配当前库的对应组件名）：
  `新版 AgentTrace (List)`
  修改为：
  `AgentTrace`

### 2. 网页标题变更

#### [MODIFY] [index.html](file:///Users/neoyuan/Desktop/aoyi/yuan-ui/index.html)
- 将网页 `<title>` 标签中的：
  `Yuan UI - 思考链组件本地预览`
  修改为：
  `Yuan UI - 思维链与 Markdown 流式渲染`

## 验证计划

### 手动验证
- 运行本地 Vite 开发服务器，访问对应的页面（通常为 `http://localhost:5173/`）。
- 确认浏览器标签页的 Title显示为 `Yuan UI - 思维链与 Markdown 流式渲染`。
- 确认页面左上角品牌标志处文字显示为 `Yuan UI - 思维链与 Markdown 流式渲染`。
- 确认顶栏右侧的两个 Tab 按钮文案分别显示为 `StreamMarkdownRenderer` 和 `AgentTrace`。
