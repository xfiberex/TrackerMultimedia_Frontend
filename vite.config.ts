/// <reference types="vitest/config" />
import path from 'node:path'
import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

// https://vite.dev/config/
const config = {
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // El mismo proxy en las dos formas de servir la aplicación: `npm run dev` usa
  // `server`, y `npm run preview` (build de producción en el 4173) usa `preview`.
  // Sin el segundo, `/api` devuelve 404 al previsualizar el build.
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5218',
        changeOrigin: true,
      },
    },
  },
  preview: {
    proxy: {
      '/api': {
        target: 'http://localhost:5218',
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    css: true,
    restoreMocks: true,
    clearMocks: true,
  },
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
}

export default defineConfig(config)
