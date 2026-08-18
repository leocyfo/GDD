import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/** Whether real Supabase credentials are present. The app runs fully
 * offline on Dexie/IndexedDB (`DexieRepository`) when they're not — cloud
 * sync is opt-in via `.env`, never a hard requirement to run the app at
 * all. See `repository/index.ts`, which picks the implementation based on
 * this flag. */
export const isSupabaseConfigured = Boolean(url && anonKey)

/** `null` when not configured — every caller must check
 * `isSupabaseConfigured` first (or go through `SupabaseRepository`, which
 * only ever gets constructed when it's true) rather than risk a runtime
 * crash from a missing client. */
export const supabase: SupabaseClient | null = url && anonKey ? createClient(url, anonKey) : null
