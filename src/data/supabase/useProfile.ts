import { useCallback, useEffect, useState } from 'react'
import { setLocalActor } from '../changelog'
import { useAuth } from './AuthProvider'
import { supabase } from './client'
import type { Profile } from './types'

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error ?? new Error('Could not read file'))
    reader.readAsDataURL(file)
  })
}

/** No Supabase Storage bucket involved — same reasoning as
 * `data/newAsset.ts`'s image uploads: read the picked file straight into
 * a `data:` URL and store that in `profiles."avatarUrl"` (plain text
 * column), which every `<img src>` already knows how to render. Fine at
 * avatar scale; would need a real bucket if these got much bigger. */
async function fileToAvatarUrl(file: File): Promise<string> {
  return readAsDataUrl(file)
}

/**
 * Owns the signed-in account's own `profiles` row: fetch, rename, avatar
 * upload. Every successful load or edit also calls `setLocalActor` (see
 * `changelog.ts`) with the display name — `AuthProvider` already sets it
 * to the raw email the instant you sign in, as an immediate fallback;
 * this hook upgrades it to the real name as soon as the profile row is
 * available, and again on every rename.
 *
 * No shared cache (same call, re-fetch on every mount) — consistent with
 * how the rest of the app treats reads at this dataset size (see
 * `useRepoQuery`'s own doc comment); nothing here is hot enough to need
 * one.
 */
export function useProfile(): {
  profile: Profile | null
  loading: boolean
  updateDisplayName: (name: string) => Promise<void>
  uploadAvatar: (file: File) => Promise<void>
} {
  const auth = useAuth()
  const userId = auth.status === 'signedIn' ? auth.user.id : null
  const fallbackName = auth.status === 'signedIn' ? (auth.user.email ?? 'you') : 'you'

  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    if (!supabase || !userId) {
      setProfile(null)
      setLoading(false)
      return
    }
    setLoading(true)
    const { data, error } = await supabase.from('profiles').select().eq('id', userId).maybeSingle()
    if (!error && data) {
      const loaded = data as Profile
      setProfile(loaded)
      setLocalActor(loaded.displayName || fallbackName)
    }
    setLoading(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  useEffect(() => {
    refetch()
  }, [refetch])

  async function updateDisplayName(name: string) {
    if (!supabase || !userId) return
    const trimmed = name.trim()
    const { error } = await supabase
      .from('profiles')
      .update({ displayName: trimmed, updatedAt: new Date().toISOString() })
      .eq('id', userId)
    if (error) throw new Error(error.message)
    setProfile((p) => (p ? { ...p, displayName: trimmed } : p))
    setLocalActor(trimmed || fallbackName)
  }

  async function uploadAvatar(file: File) {
    if (!supabase || !userId) return
    const url = await fileToAvatarUrl(file)
    const { error } = await supabase
      .from('profiles')
      .update({ avatarUrl: url, updatedAt: new Date().toISOString() })
      .eq('id', userId)
    if (error) throw new Error(error.message)
    setProfile((p) => (p ? { ...p, avatarUrl: url } : p))
  }

  return { profile, loading, updateDisplayName, uploadAvatar }
}
