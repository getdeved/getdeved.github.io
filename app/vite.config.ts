import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// Served from https://getdeved.github.io/ (an organisation site), so the default base "/" is right.
export default defineConfig({
  plugins: [react()],
})
