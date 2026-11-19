import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Send /api requests to the Spring Boot backend so the browser sees one origin.
    // Set BACKEND_URL to use a backend somewhere other than localhost:8080.
    proxy: {
      '/api': process.env.BACKEND_URL ?? 'http://localhost:8080',
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})
