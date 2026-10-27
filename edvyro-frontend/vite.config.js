import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const frontendDirectory = dirname(fileURLToPath(import.meta.url))
// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://127.0.0.1:5000',
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(frontendDirectory, 'index.html'),
        current: resolve(frontendDirectory, 'current.html'),
      },
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test-setup.js"],
  },
})
