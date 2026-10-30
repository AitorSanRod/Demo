import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  // En GitHub Pages la web vive en /<repositorio>/: el workflow de despliegue pasa BASE_PATH. En local, la raíz.
  base: process.env.BASE_PATH ?? '/',
  server: { host: true },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'Pokérancho',
        short_name: 'Pokérancho',
        description: 'Juego idle: tu Pokémon recorre rutas y combate solo mientras cuidas de tu rancho.',
        lang: 'es',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#e3350d',
        background_color: '#e3350d',
        start_url: '.',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Por defecto solo se precachean js/css/html: se añaden las imágenes propias (fondo del rancho)
        globPatterns: ['**/*.{js,css,html,svg,png,jpg}'],
        // Abre la app al tocar una notificación (expediciones terminadas)
        importScripts: ['sw-notifications.js'],
        // Los sprites vienen del repo de PokeAPI: se guardan en caché para jugar sin conexión
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/raw\.githubusercontent\.com\/PokeAPI\/sprites\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'pokeapi-sprites',
              expiration: { maxEntries: 1200, maxAgeSeconds: 60 * 60 * 24 * 90 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
})
