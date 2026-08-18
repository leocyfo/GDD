import { useState, type FormEvent } from 'react'
import { supabase } from '../../data/supabase/client'

type Mode = 'signIn' | 'signUp'

const inputClass =
  'rounded-md border border-border bg-card px-3 py-2 text-sm-plus text-text1 outline-none focus-visible:border-accent'

/** Email+password sign in/sign up, shown by `App.tsx` whenever Supabase is
 * configured and there's no active session. This is the only gate the
 * cloud-sync build has — offline/Dexie mode never renders this at all. */
export function AuthScreen() {
  const [mode, setMode] = useState<Mode>('signIn')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checkEmail, setCheckEmail] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!supabase || busy) return
    setBusy(true)
    setError(null)
    setCheckEmail(false)

    const { data, error: authError } =
      mode === 'signIn'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password })

    setBusy(false)

    if (authError) {
      setError(authError.message)
      return
    }

    // Projects with email confirmation on return a user but no session yet
    // — `AuthProvider`'s listener has nothing to pick up until that link is
    // clicked, so tell the person what to do next instead of looking stuck.
    if (mode === 'signUp' && data.user && !data.session) {
      setCheckEmail(true)
      return
    }
    // Otherwise: sign-in succeeded (or sign-up with confirmation off did),
    // and `AuthProvider`'s `onAuthStateChange` listener takes it from here.
  }

  return (
    <div className="flex h-dvh w-full items-center justify-center bg-app p-8">
      <div className="w-full max-w-sm">
        <p className="mb-1 text-2xs font-medium uppercase tracking-wide text-text3">Game Design Document</p>
        <h1 className="mb-6 text-display font-bold leading-tight text-text1">
          {mode === 'signIn' ? 'Sign in' : 'Create an account'}
        </h1>

        {checkEmail ? (
          <div className="rounded-md border border-border bg-inset p-4">
            <p className="text-sm-plus text-text1">Check your email</p>
            <p className="mt-1 text-xs-plus text-text3">
              We sent a confirmation link to {email}. Click it, then sign in here.
            </p>
            <button
              type="button"
              onClick={() => {
                setCheckEmail(false)
                setMode('signIn')
              }}
              className="mt-3 rounded-md border border-border px-3 py-1.5 text-xs-plus text-text2 transition-colors hover:border-border-hover"
            >
              Back to sign in
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-2xs font-medium uppercase tracking-wide text-text3" htmlFor="auth-email">
                Email
              </label>
              <input
                id="auth-email"
                type="email"
                autoComplete="email"
                autoFocus
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-2xs font-medium uppercase tracking-wide text-text3" htmlFor="auth-password">
                Password
              </label>
              <input
                id="auth-password"
                type="password"
                autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
                required
                minLength={6}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={inputClass}
              />
            </div>

            {error && <p className="text-xs-plus text-red">{error}</p>}

            <button
              type="submit"
              disabled={busy || !email || !password}
              className="mt-1 rounded-md bg-accent px-3 py-2 text-sm-plus font-medium text-accent-fg transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? 'Please wait…' : mode === 'signIn' ? 'Sign in' : 'Create account'}
            </button>

            <button
              type="button"
              onClick={() => {
                setMode(mode === 'signIn' ? 'signUp' : 'signIn')
                setError(null)
              }}
              className="text-xs-plus text-text3 transition-colors hover:text-text2"
            >
              {mode === 'signIn' ? "Don't have an account? Create one" : 'Already have an account? Sign in'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
