import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // 'autoUpdate' checks for a new service worker on every load and activates it
      // automatically once the new version has finished downloading in the background —
      // this is what prevents the classic PWA bug where a phone keeps showing a stale
      // cached version of the app after a new deploy. No manual "clear cache" needed.
      registerType: 'autoUpdate',
      // Reuses the existing public/manifest.json content/icons rather than duplicating them,
      // so there's a single source of truth for app name, colors, and icon set.
      manifest: {
        name: 'Expenzo — Household Expense & Income Tracker',
        short_name: 'Expenzo',
        description: 'A warm, calm household finance tracker for managing income, expenses, budgets, and savings goals together.',
        start_url: '/',
        display: 'standalone',
        background_color: '#F7F4EE',
        theme_color: '#6E8B74',
        orientation: 'portrait-primary',
        icons: [
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/pwa-maskable-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: '/pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Precaches the built app shell (JS/CSS/HTML/icons/fonts) so it can load with zero
        // connectivity. This is the piece that lets Safari open the app from a fully offline
        // state, rather than showing "Safari can't open the page." Firestore's own offline
        // persistence (configured separately in firebase/config.ts) handles the data layer
        // once the app shell itself has successfully loaded.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Runtime caching for Google Fonts, since they're loaded from an external domain
        // and aren't part of the local build output that globPatterns covers.
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-stylesheets',
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year — font files are immutable per URL
              },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
