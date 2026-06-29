import DefaultTheme from 'vitepress/theme'
import './custom.css'
import DemoBox from './components/DemoBox.vue'

// 导入要演示的库组件以进行文档内的 Live Runtime 预览
import { AgentTrace, AgentTraceTrigger, AgentTraceContent, AgentTraceList } from '../../../src/index'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    // 1. 全局注册 Demo 容器组件
    app.component('DemoBox', DemoBox)

    // 2. 全局注册组件库的核心组件，使其可以直接在 VitePress markdown 中运行
    app.component('AgentTrace', AgentTrace)
    app.component('AgentTraceTrigger', AgentTraceTrigger)
    app.component('AgentTraceContent', AgentTraceContent)
    app.component('AgentTraceList', AgentTraceList)
  }
}
