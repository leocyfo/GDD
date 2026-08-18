import { useEffect } from 'react'
import { notifyDataChanged } from '../../stores/useDataVersion'
import { supabase } from './client'

/** Every table `0001_init.sql` turns Realtime on for. Kept as one explicit
 * list here (rather than derived from the `Repository` interface) so it's
 * obvious at a glance that it matches the migration's own
 * `alter publication supabase_realtime add table ...` list. */
const SYNCED_TABLES = [
  'projects',
  'sections',
  'pillars',
  'non_goals',
  'loops',
  'feature_cards',
  'scope_entries',
  'decisions',
  'logic_notes',
  'tags',
  'milestones',
  'collaborators',
  'change_entries',
  'assets',
  'production_assets',
  'levels',
  'comments',
] as const

/**
 * Keeps every open tab/device in sync with changes made anywhere else on
 * the same account. Row Level Security means the subscription only ever
 * receives rows this user already owns, so there's no need to filter to a
 * particular project — any of the account's projects being open anywhere
 * should stay live.
 *
 * Reuses the app's existing "bump one counter, every mounted query
 * refetches" invalidation (`notifyDataChanged`/`useDataVersion`) rather
 * than patching individual cached rows — see that file's own doc comment
 * for why that's the right trade-off at this dataset size. A change made
 * by *this* tab's own write bumps the counter twice (once locally, once
 * when the Realtime echo comes back) — redundant, but harmless, and not
 * worth the complexity of filtering out.
 */
export function useRealtimeSync(enabled: boolean): void {
  useEffect(() => {
    if (!enabled || !supabase) return
    const client = supabase
    let channel = client.channel('data-sync')
    for (const table of SYNCED_TABLES) {
      channel = channel.on('postgres_changes', { event: '*', schema: 'public', table }, () => notifyDataChanged())
    }
    channel.subscribe()
    return () => {
      client.removeChannel(channel)
    }
  }, [enabled])
}
