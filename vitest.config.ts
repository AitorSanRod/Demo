import { defineConfig } from 'vitest/config'

// Configuración propia para no cargar los plugins de React/PWA de vite.config.ts en los tests
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
