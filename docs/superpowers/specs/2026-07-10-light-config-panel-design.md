# 规格说明：流式渲染配置面板亮色化与去 Emoji 重构

## 背景与目的
流式渲染页面的 Tab 栏左侧配置面板原本固定为暗黑风格，这在亮色模式的整体 UI 中显得有些突兀。为了提高用户操作的一致性和舒适度，并符合字节 Arco Design 的极简高雅设计规范，需要将配置面板在亮色模式下重构为白色/淡灰色调。同时，去除配置面板中所有的 Emoji，代以更专业的纯文字，使其显得更加严谨。

## 需求规范

### 1. 结构与文案调整 (RendererDemo.vue)
- 去除下拉场景预设中的所有 Emoji 标识。
- 去除 Token 速度预设中的所有 Emoji 标识。

### 2. 样式与色彩重构 (style.css)
- 支持暗色（.dark）和亮色（默认）主题切换。
- **面板背景色**：亮色模式下 `.code-panel` 的背景色为 `#ffffff`，右侧边框为 `1px solid var(--yuan-border)`；暗色模式下保持暗色 `#09090b`。
- **页签栏**：`.code-tab-header` 在亮色模式下背景色为 `#ffffff`，底部加 `1px solid var(--yuan-border-light)` 分割线，文件文字颜色改为 `var(--yuan-text-primary)`。
- **下拉选择框**：亮色模式下 `.control-select-box` 的背景色为 `#ffffff`，边框为 `var(--yuan-border)`，文字颜色为 `var(--yuan-text-primary)`。聚焦或悬浮时显示蓝色边框。
- **滑块容器**：`.speed-slider-container` 在亮色模式下背景色为 `var(--yuan-bg-muted)`。
- **Raw Stream 缓冲区**：`.raw-terminal-view` 亮色模式背景色为 `var(--yuan-bg-muted)`，文本颜色为深灰色，`blinker` 光标使用蓝色 `var(--yuan-primary)`。
- **AST 监视器**：`.ast-item-card` 亮色模式背景色为 `#ffffff`，边框为 `1px solid var(--yuan-border)`，文字颜色对应调整为深色。

## 验证计划
- 启动本地开发服务，检查配置面板在亮色模式和暗色模式下的视觉效果，确保无缝切换，界面高雅统一。
- 确认没有遗留的 Emoji 字符。
