import { Camera } from 'lucide-react'
import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { useAuth, useSignOut } from '../../data/supabase/AuthProvider'
import { useMyProjectRoles, useProjectMembers, type MyProjectRole } from '../../data/supabase/useProjectMembers'
import type { Profile, ProjectRole } from '../../data/supabase/types'
import { useProfile } from '../../data/supabase/useProfile'
import { useAutosave } from '../../lib/useAutosave'
import { useWorkspaceStore } from '../../stores/useWorkspaceStore'
import { Avatar } from '../common/Avatar'
import { Modal, ModalCloseButton } from '../common/Modal'
import { SaveIndicator } from '../common/SaveIndicator'

const inputClass =
  'rounded-md border border-border bg-card px-3 py-2 text-sm-plus text-text1 outline-none focus-visible:border-accent'

function ProfileForm({
  profile,
  email,
  updateDisplayName,
  uploadAvatar,
}: {
  profile: Profile
  email: string
  updateDisplayName: (name: string) => Promise<void>
  uploadAvatar: (file: File) => Promise<void>
}) {
  const [name, setName] = useState(profile.displayName)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const nameSave = useAutosave<string>((v) => updateDisplayName(v))

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setUploading(true)
    try {
      await uploadAvatar(file)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="group relative flex-shrink-0 rounded-full"
        aria-label="Change avatar"
      >
        <Avatar url={profile.avatarUrl} name={name || email} size={48} />
        <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 text-white opacity-0 transition-opacity group-hover:opacity-100">
          <Camera size={16} />
        </span>
        {uploading && <span className="absolute inset-0 animate-pulse rounded-full bg-black/40" aria-hidden="true" />}
      </button>
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
      <div className="min-w-0 flex-1">
        <input
          value={name}
          onChange={(event) => {
            setName(event.target.value)
            nameSave.schedule(event.target.value)
          }}
          onBlur={nameSave.flush}
          placeholder="Your name"
          className={`${inputClass} w-full py-1.5 font-medium`}
        />
        <div className="mt-1 flex items-center gap-2 text-2xs text-text3">
          <span className="truncate">{email}</span>
          <SaveIndicator state={nameSave.state} />
        </div>
      </div>
    </div>
  )
}

function ProjectRoleRow({ entry }: { entry: MyProjectRole }) {
  if (!entry.project) return null
  return (
    <div className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2">
      <span className="min-w-0 truncate text-sm-plus text-text1">{entry.project.name}</span>
      <span className="flex-shrink-0 rounded-full border border-border px-2 py-0.5 text-2xs capitalize text-text3">
        {entry.role}
      </span>
    </div>
  )
}

/** Only rendered when a project is actually open (`activeProjectId`) — the
 * Hub has no single project to manage access for. Anyone can see the
 * roster; only an owner sees the invite form and remove buttons (the
 * database enforces this too — RLS on `project_members`/
 * `invite_project_member`, not just this UI check). */
function ManageAccessSection({ projectId }: { projectId: string }) {
  const { members, loading, isOwner, invite, remove } = useProjectMembers(projectId)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<ProjectRole>('editor')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleInvite(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await invite(email, role)
      setEmail('')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <h3 className="text-2xs font-medium uppercase tracking-wide text-text3">Who has access to this document</h3>
      <div className="mt-2 flex flex-col gap-1.5">
        {loading && <p className="text-xs-plus text-text3">Loading…</p>}
        {!loading &&
          members.map((m) => (
            <div key={m.userId} className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2">
              <div className="flex min-w-0 items-center gap-2">
                <Avatar url={m.profile?.avatarUrl} name={m.profile?.displayName || '?'} size={22} />
                <span className="truncate text-sm-plus text-text1">{m.profile?.displayName || 'Unknown'}</span>
                <span className="flex-shrink-0 text-2xs capitalize text-text3">{m.role}</span>
              </div>
              {isOwner && m.role !== 'owner' && (
                <button
                  type="button"
                  onClick={() => remove(m.userId)}
                  className="flex-shrink-0 text-2xs text-text3 transition-colors hover:text-red"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
      </div>

      {isOwner && (
        <form onSubmit={handleInvite} className="mt-3 flex items-center gap-2">
          <input
            type="email"
            required
            placeholder="teammate@email.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={`${inputClass} min-w-0 flex-1 py-1.5 text-xs-plus`}
          />
          <select
            value={role}
            onChange={(event) => setRole(event.target.value as ProjectRole)}
            className={`${inputClass} flex-shrink-0 py-1.5 text-xs-plus`}
          >
            <option value="editor">Editor</option>
            <option value="owner">Owner</option>
          </select>
          <button
            type="submit"
            disabled={busy || !email}
            className="flex-shrink-0 rounded-md bg-accent px-3 py-1.5 text-xs-plus font-medium text-accent-fg transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? 'Inviting…' : 'Invite'}
          </button>
        </form>
      )}
      {error && <p className="mt-1.5 text-2xs text-red">{error}</p>}
    </div>
  )
}

/** The one surface for "who am I, and which documents am I connected to"
 * in cloud mode — avatar/name (editable), the account's email, every
 * document it's a member of with its role on each, and — when opened
 * from inside a project you own — an invite-by-email form plus the
 * current roster. Sign out lives here too, superseding the plain
 * standalone button: one coherent "account" surface instead of two. */
export function ProfileModal({ onClose }: { onClose: () => void }) {
  const auth = useAuth()
  const { profile, loading, updateDisplayName, uploadAvatar } = useProfile()
  const { roles, loading: rolesLoading } = useMyProjectRoles()
  const { signOut, signingOut } = useSignOut()
  const activeProjectId = useWorkspaceStore((s) => s.activeProjectId)

  if (auth.status !== 'signedIn') return null
  const email = auth.user.email ?? ''

  return (
    <Modal onClose={onClose} ariaLabel="Your account" widthClassName="max-w-md">
      <div className="relative max-h-[80vh] overflow-y-auto p-5">
        <ModalCloseButton onClose={onClose} />
        <h2 className="mb-4 text-sm-plus font-semibold text-text1">Your account</h2>

        {loading || !profile ? (
          <div className="h-12 animate-pulse rounded bg-inset" aria-hidden="true" />
        ) : (
          <ProfileForm profile={profile} email={email} updateDisplayName={updateDisplayName} uploadAvatar={uploadAvatar} />
        )}

        <div className="my-4 border-t border-border" />

        <h3 className="text-2xs font-medium uppercase tracking-wide text-text3">Your documents</h3>
        <div className="mt-2 flex flex-col gap-1.5">
          {rolesLoading && <p className="text-xs-plus text-text3">Loading…</p>}
          {!rolesLoading && roles.length === 0 && <p className="text-xs-plus text-text3">No documents yet.</p>}
          {!rolesLoading && roles.map((entry) => <ProjectRoleRow key={entry.projectId} entry={entry} />)}
        </div>

        {activeProjectId && (
          <>
            <div className="my-4 border-t border-border" />
            <ManageAccessSection projectId={activeProjectId} />
          </>
        )}

        <div className="mt-5 flex justify-end border-t border-border pt-4">
          <button
            type="button"
            onClick={signOut}
            disabled={signingOut}
            className="rounded-md border border-border px-3 py-1.5 text-xs-plus text-text2 transition-colors hover:border-border-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {signingOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
