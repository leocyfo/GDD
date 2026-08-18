import { useCallback, useEffect, useState } from 'react'
import { useAuth } from './AuthProvider'
import { supabase } from './client'
import type { ProjectMember, ProjectRole } from './types'

/**
 * Roster for one project — who has access, and (if the signed-in account
 * owns this project) the ability to invite/remove people. `null`
 * `projectId` means "nothing to load yet" (e.g. the Hub, before a project
 * is open), not an error.
 */
export function useProjectMembers(projectId: string | null): {
  members: ProjectMember[]
  loading: boolean
  isOwner: boolean
  /** Resolves to the invited account's real user id — `TeamView.tsx` uses
   * it to link a `Collaborator` row to the access it just granted. */
  invite: (email: string, role: ProjectRole) => Promise<string>
  remove: (userId: string) => Promise<void>
  setRole: (userId: string, role: ProjectRole) => Promise<void>
  refetch: () => Promise<void>
} {
  const auth = useAuth()
  const currentUserId = auth.status === 'signedIn' ? auth.user.id : null

  const [members, setMembers] = useState<ProjectMember[]>([])
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    if (!supabase || !projectId) {
      setMembers([])
      setLoading(false)
      return
    }
    setLoading(true)
    // Embeds the profile via the `project_members.userId → profiles.id`
    // FK the migration deliberately set up for exactly this — one query
    // instead of N.
    const { data, error } = await supabase
      .from('project_members')
      .select('projectId, userId, role, createdAt, profile:profiles(id, displayName, avatarUrl, createdAt, updatedAt)')
      .eq('projectId', projectId)
      .order('createdAt')
    if (!error && data) setMembers(data as unknown as ProjectMember[])
    setLoading(false)
  }, [projectId])

  useEffect(() => {
    refetch()
  }, [refetch])

  const isOwner = members.some((m) => m.userId === currentUserId && m.role === 'owner')

  async function invite(email: string, role: ProjectRole): Promise<string> {
    if (!supabase || !projectId) throw new Error('Not connected')
    const { data, error } = await supabase.rpc('invite_project_member', {
      p_project_id: projectId,
      p_email: email.trim(),
      p_role: role,
    })
    if (error) throw new Error(error.message)
    await refetch()
    return data as string
  }

  async function remove(userId: string) {
    if (!supabase || !projectId) return
    const { error } = await supabase.from('project_members').delete().eq('projectId', projectId).eq('userId', userId)
    if (error) throw new Error(error.message)
    await refetch()
  }

  async function setRole(userId: string, role: ProjectRole) {
    if (!supabase || !projectId) return
    const { error } = await supabase.from('project_members').update({ role }).eq('projectId', projectId).eq('userId', userId)
    if (error) throw new Error(error.message)
    await refetch()
  }

  return { members, loading, isOwner, invite, remove, setRole, refetch }
}

/** One row per project the signed-in account belongs to, with its role —
 * the flip side of `useProjectMembers` (that one's "who's on this
 * project," this one's "which projects is *this account* on"). Powers the
 * profile modal's "Your projects" list. Embeds via the (real, direct) FK
 * `project_members.projectId → projects.id`. */
export interface MyProjectRole {
  projectId: string
  role: ProjectRole
  project?: { id: string; name: string; status: string }
}

export function useMyProjectRoles(): { roles: MyProjectRole[]; loading: boolean } {
  const auth = useAuth()
  const userId = auth.status === 'signedIn' ? auth.user.id : null

  const [roles, setRoles] = useState<MyProjectRole[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!supabase || !userId) {
        setRoles([])
        setLoading(false)
        return
      }
      setLoading(true)
      const { data, error } = await supabase
        .from('project_members')
        .select('projectId, role, project:projects(id, name, status)')
        .eq('userId', userId)
      if (!cancelled && !error && data) setRoles(data as unknown as MyProjectRole[])
      if (!cancelled) setLoading(false)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [userId])

  return { roles, loading }
}
