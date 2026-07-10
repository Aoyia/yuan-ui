# 设计规格：舍弃扁平线性流功能

本设计规格旨在彻底从项目中移除“扁平线性流”功能，清理多余的物理组件及对应关联的代码与界面展现。重构完成后，工作台将默认仅渲染新版 `AgentTrace (List)` 思维链。

## 变更背景

当前工作台包含两个 Tab：
1. 新版 `AgentTrace (List)`：树形嵌套及敏感命令审批的思维轨迹，符合高阶 Agent 场景。
2. 扁平线性流：旧版扁平化结构。

由于确定废弃扁平线性流功能，因此需要对其进行物理删除，并简化主应用界面交互。

## 变更细节

### 1. 组件物理删除 (Delete Files)

完全删除以下目录及文件，移除不再维护的旧扁平线性流组件：
- [DELETE] [AgentTraceLinear.vue](file:///Users/neoyuan/Desktop/aoyi/yuan-ui/src/components/AgentTraceLinear/AgentTraceLinear.vue)
- [DELETE] [LinearStepNode.vue](file:///Users/neoyuan/Desktop/aoyi/yuan-ui/src/components/AgentTraceLinear/LinearStepNode.vue)
- [DELETE] [index.ts](file:///Users/neoyuan/Desktop/aoyi/yuan-ui/src/components/AgentTraceLinear/index.ts)
- [DELETE] [styles.css](file:///Users/neoyuan/Desktop/aoyi/yuan-ui/src/components/AgentTraceLinear/styles.css)

### 2. 主页面逻辑改造 (src/App.vue)

#### 2.1 脚本区逻辑精简
- 移除导入：`import { AgentTraceLinear } from './components/AgentTraceLinear'`
- 移除变量：`activeTab` (由于不再有 Tab 选项，相关响应式逻辑全部被清理)
- 移除只在 `traceLinear` 模式下生效的副作用或配置。

#### 2.2 界面结构简化 (Template)
- **顶栏**：
  - 移除 `<div class="nav-tabs">...</div>`
  - 将演示场景选择器 `<div v-if="activeTab === 'trace' || activeTab === 'traceLinear'" ...>` 调整为直接常驻展示。
- **左侧代码面板**：
  - 代码演示的显示逻辑直接跟随 `currentScenario` 变化，而不需要过滤 `activeTab`。
- **右侧预览面板**：
  - 移除 `activeTab === 'trace'` 及 `activeTab === 'traceLinear'` 的条件分支。
  - 直接在流式思维链存在时渲染 `<AgentTrace>`，没有其他条件判定包裹。

#### 2.3 样式清理 (Styles)
- 移除与 `nav-tabs`、`tab-btn` 等 Tab 结构相关的全部 CSS 样式。
- 移除 `.linear-playground-wrapper` 及其 `.dark` 变体样式。

## 验证与测试

1. **编译检查**：移除物理文件和引用后，运行开发服务器，确认没有无法解析的组件依赖和 TypeScript 编译报错。
2. **模拟运行**：在页面上运行基础、中阶、高阶场景的模拟，检查新版 `AgentTrace` 能否完整、正常地进行流式渲染、展开、折叠及敏感工具审批确权，且生成的最终正文正常在下方展示。
3. **单元测试/E2E**：运行项目现有的测试集以确保重构没有对其他核心流程产生负面影响。
