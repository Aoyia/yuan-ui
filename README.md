# AiStream-vue ⚡

<p align="center">
  <a href="https://aoyia.github.io/aistream-vue/">
    <img src="https://img.shields.io/badge/🚀%20Live%20Demo-aoyia.github.io%2Faistream--vue-165dff?style=for-the-badge" alt="Live Demo">
  </a>
  &nbsp;&nbsp;
  <a href="https://github.com/Aoyia/aistream-vue/actions/workflows/deploy-demo.yml">
    <img src="https://img.shields.io/badge/⚙️%20GitHub%20Actions-查看%20CI-24292e?style=for-the-badge&logo=github" alt="GitHub Actions">
  </a>
</p>

面向高阶 AI Agent 场景的 Vue 3 思维链 (`AsThoughtChain`) 与流式 Markdown (`AsMarkdown`) 渲染组件库。

---

## ✨ 核心特性

- 🌳 **多层级步骤树 (Grouping)**：支持 Timeline 大步骤嵌套子步骤，带 IDE 引导线。
- 📉 **同级渐进式折叠**：自动收纳已完成的历史步骤，保证阅读焦点聚焦于当前活跃区。
- 💻 **内置语义渲染器**：专为终端命令 (ANSI 彩色)、Diff 对比、网页搜索、文件阅读设计的卡片式美学面板。
- 🛡️ **人机协同审批 (HITL)**：高危/敏感操作（如 Shell 命令）审批拦截，提供同意/拒绝确权交互。
- 🎨 **主题定制**：完全基于 CSS 变量设计，支持一键定制。

---

## 🖼️ 效果预览

![预览图](.github/assets/preview-advanced.png)

---

## 📦 安装

```bash
npm install aistream-vue @lucide/vue @vueuse/core
```

---

## 🚀 快速开始

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { AsThoughtChain, AsThoughtChainTrigger, AsThoughtChainContent, AsThoughtChainList, useAsThoughtChainStream } from 'aistream-vue'
import 'aistream-vue/dist/style.css'

const isOpen = ref(true)
const trace = useAsThoughtChainStream()
</script>

<template>
  <AsThoughtChain v-model:open="isOpen" :is-streaming="trace.isStreaming.value" :duration="trace.duration.value">
    <AsThoughtChainTrigger />
    <AsThoughtChainContent>
      <AsThoughtChainList :nodes="trace.nodes.value" />
    </AsThoughtChainContent>
  </AsThoughtChain>
</template>
```

---

## 📄 License

[MIT](LICENSE) License.
