import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { setLocalActor } from '../changelog'
import { isSupabaseConfigured, supabase } from './client'

export type AuthState =
  // Fully offline — no Supabase credentials in `.env`. The rest of the app
  // never gates on auth in this state; it's the default, zero-setup mode.
  | { status: 'disabled' }
  // Configured, but the initial `getSession()` check hasn't resolved yet.
  | { status: 'loading' }
  | { status: 'signedOut' }
  | { status: 'signedIn'; user: User }

const AuthContext = createContext<AuthState>({ status: 'disabled' })

function applySession(session: Session | null, setState: (state: AuthState) => void) {
  if (session?.user) {
    // Live-updates `LOCAL_ACTOR` everywhere it's imported (see
    // `changelog.ts`) — every changelog entry from here on is attributed to
    // the signed-in account instead of the generic offline placeholder.
    setLocalActor(session.user.email ?? session.user.id)
    setState({ status: 'signedIn', user: session.user })
  } else {
    setLocalActor('you')
    setState({ status: 'signedOut' })
  }
}

/** Owns Supabase session state for the whole app. A no-op pass-through
 * (`{ status: 'disabled' }`, children render immediately) when Supabase
 * isn't configured, so offline/Dexie mode never sees an auth gate — see
 * `App.tsx`, the only place that actually branches on this. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(isSupabaseConfigured ? { status: 'loading' } : { status: 'disabled' })

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return
    let cancelled = false
    const client = supabase

    client.auth.getSession().then(({ data }) => {
      if (!cancelled) applySession(data.session, setState)
    })

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      if (!cancelled) applySession(session, setState)
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  return useContext(AuthContext)
}

/** The sign-out button inside `ProfileModal` (the one place it lives) uses
 * this rather than calling `supabase.auth.signOut()` directly, mostly for
 * the `signingOut` busy-state bookkeeping. No need to reset it on success
 * — `AuthProvider`'s `onAuthStateChange` listener flips the whole app to
 * the signed-out screen as soon as `signOut()` resolves, unmounting
 * whatever called this. */
export function useSignOut(): { signOut: () => void; signingOut: boolean } {
  const [signingOut, setSigningOut] = useState(false)

  function signOut() {
    if (!supabase || signingOut) return
    setSigningOut(true)
    void supabase.auth.signOut()
  }

  return { signOut, signingOut }
}
