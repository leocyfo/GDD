import { useState } from 'react'
import { useAuth } from '../../data/supabase/AuthProvider'
import { useProfile } from '../../data/supabase/useProfile'
import { Avatar } from '../common/Avatar'
import { ProfileModal } from './ProfileModal'

/** Avatar + name, opens `ProfileModal` — the one entry point into account
 * info, "your documents," project access management, and sign-out.
 * Self-guarding: renders nothing outside cloud mode (offline Dexie, or
 * cloud but not signed in yet), so call sites (Hub header, sidebar) can
 * drop it in unconditionally. */
export function ProfileButton() {
  const auth = useAuth()
  const { profile } = useProfile()
  const [open, setOpen] = useState(false)

  if (auth.status !== 'signedIn') return null

  const name = profile?.displayName || auth.user.email || 'Account'

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-w-0 items-center gap-2 rounded-md py-1 pl-1 pr-2 transition-colors hover:bg-inset"
        aria-label="Your account"
      >
        <Avatar url={profile?.avatarUrl} name={name} size={22} />
        <span className="min-w-0 max-w-[130px] truncate text-xs-plus text-text2">{name}</span>
      </button>
      {open && <ProfileModal onClose={() => setOpen(false)} />}
    </>
  )
}
