import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// The site is served from https://<user>.github.io/deved/, so built asset URLs need that prefix. Dev stays at "/".
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/deved/' : '/',
  plugins: [react()],
}))
