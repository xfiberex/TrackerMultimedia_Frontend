import path from 'node:path'
import { defineConfig } from 'vite'
// Solo la lista de exclusiones por defecto. `defineConfig` sigue siendo el de Vite: el
// de `vitest/config` tipa `plugins` de otra forma y rechaza los de este proyecto.
import { configDefaults } from 'vitest/config'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

// https://vite.dev/config/
const config = {
  resolve: {
    alias: {
      // `import.meta.dirname` y no `__dirname`: este archivo es un módulo ESM, donde
      // `__dirname` no existe. Vite lo emulaba al cargar la configuración y avisa en cada
      // arranque de que va a dejar de hacerlo. Requiere Node 20.11 o superior.
      '@': path.resolve(import.meta.dirname, './src'),
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
    // Las pruebas end-to-end son de Playwright y no de vitest, pero su nombre acaba en
    // `.spec.ts` y el patrón por defecto de vitest las recogía. Al ejecutarlas aquí
    // fallaban al importar `@playwright/test`, con lo que `npm test` daba cuatro
    // archivos en rojo que no tenían nada roto. Pasó inadvertido en T4-04 porque cada
    // suite se comprobó con su propio comando y nunca las dos a la vez.
    exclude: [...configDefaults.exclude, 'e2e/**'],
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    css: true,
    restoreMocks: true,
    clearMocks: true,
  },
  plugins: [react(), babel({ presets: [reactCompilerPreset()] })],
}

export default defineConfig(config)
