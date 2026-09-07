import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Google's required COOP value for GIS OAuth popups (not Sign in with Google).
const oauthHeaders = {
  'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { headers: oauthHeaders },
  preview: { headers: oauthHeaders },
})
