/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    globals: false,
    // Tests assume fully-offline Dexie mode — they'd otherwise pick up
    // whatever real Supabase credentials happen to be sitting in a dev's
    // local `.env` (Vitest loads `.env` the same way Vite does) and hit
    // the sign-in screen instead of the app. Overriding these to empty
    // here keeps `isSupabaseConfigured` (`data/supabase/client.ts`) false
    // for every test run, regardless of what `.env` contains locally.
    env: {
      VITE_SUPABASE_URL: '',
      VITE_SUPABASE_ANON_KEY: '',
    },
  },
})
