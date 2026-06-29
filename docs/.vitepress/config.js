export default {
  title: 'Yuan UI',
  description: '一套对标大厂品质的 Vue 3 智能体思维链/执行轨迹 UI 组件库',
  themeConfig: {
    nav: [
      { text: '指南', link: '/guide/getting-started' },
      { text: '组件', link: '/components/agent-trace' }
    ],
    sidebar: {
      '/guide/': [
        {
          text: '基础入门',
          items: [
            { text: '快速开始', link: '/guide/getting-started' }
          ]
        }
      ],
      '/components/': [
        {
          text: '核心组件',
          items: [
            { text: 'AgentTrace 执行轨迹', link: '/components/agent-trace' }
          ]
        }
      ]
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/neoyuan/yuan-ui' }
    ]
  }
}
