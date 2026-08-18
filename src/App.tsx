import { useCallback, useEffect, useMemo, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { AppShell } from './components/layout/AppShell'
import { Hub } from './components/hub/Hub'
import { AuthScreen } from './components/auth/AuthScreen'
import { repo } from './data/repository'
import { RepositoryProvider } from './data/repository/RepositoryProvider'
import { SupabaseRepository } from './data/repository/SupabaseRepository'
import type { Repository } from './data/repository/types'
import { AuthProvider, useAuth } from './data/supabase/AuthProvider'
import { supabase } from './data/supabase/client'
import { useRealtimeSync } from './data/supabase/useRealtimeSync'
import { useProfile } from './data/supabase/useProfile'
import { migrateLocalDataToCloud } from './data/migrateToCloud'
import { ensureSeeded } from './data/seed'
import { useWorkspaceStore } from './stores/useWorkspaceStore'

type BootState = { status: 'loading' } | { status: 'ready' } | { status: 'error'; error: Error }

const MIGRATED_KEY = 'localDataMigrated'

function CenteredMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh w-full items-center justify-center bg-app text-text2">
      <div className="flex flex-col items-center gap-3">{children}</div>
    </div>
  )
}

function Spinner({ label }: { label: string }) {
  return (
    <CenteredMessage>
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-accent" aria-hidden="true" />
      <p className="text-sm-plus">{label}</p>
    </CenteredMessage>
  )
}

/** Boots a given `Repository` (seeding it, and running an optional
 * pre-seed step first) and renders the app once ready — the shared tail
 * end of both the fully-offline path and the signed-in-to-Supabase path,
 * which only differ in which repository they hand it and whether there's
 * a migration to run first.
 *
 * `identity` is `'offline'` for Dexie or the Supabase user id for cloud
 * mode — passed straight to `syncIdentity` so a switch from offline to a
 * cloud account (or between two cloud accounts) always lands on the Hub
 * instead of trying to reopen whatever `activeProjectId` was last set to
 * under a completely different backend/account. */
function BootedApp({ repo, identity, beforeSeed }: { repo: Repository; identity: string; beforeSeed?: () => Promise<void> }) {
  const [boot, setBoot] = useState<BootState>({ status: 'loading' })
  const activeProjectId = useWorkspaceStore((s) => s.activeProjectId)

  useEffect(() => {
    let cancelled = false
    setBoot({ status: 'loading' })
    useWorkspaceStore.getState().syncIdentity(identity)
    ;(async () => {
      if (beforeSeed) await beforeSeed()
      await ensureSeeded(repo)
    })()
      .then(() => {
        if (!cancelled) setBoot({ status: 'ready' })
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setBoot({ status: 'error', error: error instanceof Error ? error : new Error(String(error)) })
        }
      })
    return () => {
      cancelled = true
    }
  }, [repo, identity, beforeSeed])

  if (boot.status === 'loading') {
    return <Spinner label="Loading your documents…" />
  }

  if (boot.status === 'error') {
    return (
      <CenteredMessage>
        <div className="max-w-md text-center">
          <p className="mb-2 text-sm-plus font-medium text-text1">Couldn&rsquo;t load your documents</p>
          <p className="text-xs-plus text-text3">{boot.error.message}</p>
        </div>
      </CenteredMessage>
    )
  }

  return <RepositoryProvider value={repo}>{activeProjectId ? <AppShell /> : <Hub />}</RepositoryProvider>
}

/** The signed-in-to-Supabase path: builds this account's repository once,
 * migrates any local Dexie data into it the first time (see
 * `migrateToCloud.ts`), then boots exactly like the offline path. */
function CloudApp({ user }: { user: User }) {
  // Unreachable in practice — `AuthProvider` only ever reaches a
  // `signedIn` state when Supabase is configured, which is exactly when
  // `supabase` is non-null.
  const cloudRepo = useMemo(() => new SupabaseRepository(supabase!, user.id), [user.id])

  const migrateIfNeeded = useCallback(async () => {
    const alreadyMigrated = await cloudRepo.meta.getSetting<boolean>(MIGRATED_KEY)
    if (alreadyMigrated) return
    await migrateLocalDataToCloud(cloudRepo)
    await cloudRepo.meta.setSetting(MIGRATED_KEY, true)
  }, [cloudRepo])

  // Live sync with any other tab/device signed into this same account —
  // see the hook's own doc comment for how it plugs into invalidation.
  useRealtimeSync(true)

  // Mounted here (rather than only inside the profile modal) so
  // `LOCAL_ACTOR` upgrades from the raw email to the real display name as
  // soon as the profile loads, whether or not anyone ever opens the
  // profile UI this session.
  useProfile()

  return <BootedApp repo={cloudRepo} identity={user.id} beforeSeed={migrateIfNeeded} />
}

function AuthGate() {
  const auth = useAuth()

  switch (auth.status) {
    case 'loading':
      return <Spinner label="Checking your session…" />
    case 'signedOut':
      return <AuthScreen />
    case 'signedIn':
      return <CloudApp user={auth.user} />
    case 'disabled':
      // No Supabase credentials configured — fully offline, same as before
      // this app had any notion of auth at all.
      return <BootedApp repo={repo} identity="offline" />
  }
}

function App() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  )
}

export default App
