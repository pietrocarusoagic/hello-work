import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    // Exclude Playwright E2E specs so vitest doesn't pick them up
    exclude: ['**/node_modules/**', '**/e2e/**'],
  },
})
