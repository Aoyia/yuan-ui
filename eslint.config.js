export default [
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      'docs/.vitepress/dist/**',
      'docs/.vitepress/cache/**'
    ]
  },
  {
    rules: {
      'semi': ['error', 'never'],
      'quotes': ['error', 'single', { 'avoidEscape': true }],
      'indent': ['error', 2]
    }
  }
]
