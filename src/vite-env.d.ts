/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Supabase project URL — Settings → API in the Supabase dashboard.
   * Absent = the app runs fully offline on Dexie/IndexedDB; see
   * `data/supabase/client.ts`. */
  readonly VITE_SUPABASE_URL?: string
  /** Supabase anon/public key — safe to expose client-side, RLS policies
   * (see `supabase/migrations/0001_init.sql`) are what actually gate
   * access, not this key. */
  readonly VITE_SUPABASE_ANON_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
