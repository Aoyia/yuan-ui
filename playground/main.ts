import { createApp } from 'vue'
import App from './App.vue'
// 显式引入主题 CSS 变量（确保 --yuan-* 变量在所有样式之前加载，
// 避免 vite build demo 模式下 CSS 提取顺序不确定导致变量丢失）
import '../src/styles/theme.css'
import './style.css'

createApp(App).mount('#app')
