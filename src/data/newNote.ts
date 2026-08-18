import type { Repository } from './repository/types'
import type { LogicNote } from './types/entities'

/** The real "create a logic note" flow — applies the same template
 * defaults the vault's own `Template - Game Logic` reference note walks
 * through (see `data/seed/vault/notes.seed.ts`): global scope, a plain
 * variable, no tags yet. Naming convention (camelCase) is a suggestion
 * shown as placeholder text at the call site, not enforced here. */
export async function createLogicNote(
  repo: Repository,
  params: { projectId: string; folderPath: string; title: string; createdBy?: string },
): Promise<LogicNote> {
  return repo.logicNotes.create({
    projectId: params.projectId,
    folderPath: params.folderPath,
    title: params.title,
    scope: 'global',
    kind: 'variable',
    valueType: 'string',
    values: '',
    logic: '',
    inbound: [],
    outbound: [],
    tags: [],
    extras: '',
    engineRef: null,
    updatedBy: params.createdBy ?? 'you',
  })
}
