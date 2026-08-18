// Supabase-only concepts — deliberately not in `data/types/entities.ts`.
// `Profile`/`ProjectMember` only exist once there's a real account behind
// a row (see `supabase/migrations/0002_profiles_and_members.sql`); Dexie/
// offline mode has no auth at all, so there's nothing for either backend
// interface (`Repository`) to share here. Consumed only by
// `useProfile.ts`/`useProjectMembers.ts` and the profile UI.

export interface Profile {
  id: string
  displayName: string
  avatarUrl: string | null
  createdAt: string
  updatedAt: string
}

export type ProjectRole = 'owner' | 'editor'

export interface ProjectMember {
  projectId: string
  userId: string
  role: ProjectRole
  createdAt: string
  /** Embedded via the `project_members.userId → profiles.id` foreign key
   * — see the migration's own note on why that FK points at `profiles`
   * rather than `auth.users` directly. Always present in practice (the
   * signup trigger guarantees a profile exists before anyone can be
   * invited), but PostgREST's embed typing itself is nullable, so this
   * stays optional rather than asserting past it. */
  profile?: Profile
}
