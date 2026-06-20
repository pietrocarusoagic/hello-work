import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Ensure React Testing Library cleans up after every test
afterEach(() => {
  cleanup()
})
