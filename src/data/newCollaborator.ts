import type { Repository } from './repository/types'
import type { Collaborator } from './types/entities'

/** New teammates default to `'editor'` (this app has no auth, but that's
 * still the most useful default for a document everyone's actively
 * writing) and `'online'` — they're being added by someone at the
 * keyboard right now, not invited to join later.
 *
 * `userId` is set only in cloud mode, only when "New teammate" was given
 * an email and the real invite (`invite_project_member`) succeeded — see
 * `TeamView.tsx`. `null` means a purely decorative row, same as every
 * teammate before this existed at all. */
export async function createCollaborator(
  repo: Repository,
  params: { projectId: string; name: string; discipline: string; userId?: string | null; createdBy?: string },
): Promise<Collaborator> {
  return repo.collaborators.create({
    projectId: params.projectId,
    name: params.name,
    discipline: params.discipline,
    role: 'editor',
    presence: 'online',
    lastSeen: new Date().toISOString(),
    userId: params.userId ?? null,
    updatedBy: params.createdBy ?? 'you',
  })
}
