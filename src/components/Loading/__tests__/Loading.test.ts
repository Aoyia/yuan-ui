import { describe, it, expect } from 'vitest'
import Loading from '../Loading.vue'

describe('Loading Component', () => {
  it('should compile and export a valid Vue 3 component', () => {
    expect(Loading).toBeDefined()
    expect(Loading.__name).toBe('Loading')
  })
})
