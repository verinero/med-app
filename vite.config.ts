import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command }) => ({
  // GitHub Pages serves this app under /med-app/, but that base path only
  // makes sense for the production build — the dev server should serve at
  // plain localhost root, otherwise `npm run dev` looks completely blank.
  base: command === "build" ? "/med-app/" : "/",
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
}))
