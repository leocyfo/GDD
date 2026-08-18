import { extractWikilinkTitles } from '../lib/wikilinks'
import type { Repository } from './repository/types'

/**
 * Recomputes every logic note's `outbound`/`inbound` for a project from
 * scratch: `outbound` is re-extracted from each note's own `logic` +
 * `extras` text, `inbound` is the inverted graph. Same rule the seed data
 * uses (see `data/seed/vault/notes.seed.ts`) — backlinks are always
 * *derived*, never hand-maintained, so they can't drift out of sync with
 * what a note's body actually says. Called after any edit that could
 * change a note's wikilinks; only writes rows whose links actually changed.
 */
export async function recomputeVaultLinks(repo: Repository, projectId: string): Promise<void> {
  const notes = await repo.logicNotes.listByProject(projectId)
  const idByTitle = new Map(notes.map((note) => [note.title, note.id]))

  const outboundByNoteId = new Map<string, string[]>()
  for (const note of notes) {
    const titles = [...extractWikilinkTitles(note.logic), ...extractWikilinkTitles(note.extras)]
    const ids: string[] = []
    const seen = new Set<string>()
    for (const title of titles) {
      const id = idByTitle.get(title)
      if (id && id !== note.id && !seen.has(id)) {
        seen.add(id)
        ids.push(id)
      }
    }
    outboundByNoteId.set(note.id, ids)
  }

  const inboundByNoteId = new Map<string, string[]>()
  for (const note of notes) {
    for (const targetId of outboundByNoteId.get(note.id) ?? []) {
      const list = inboundByNoteId.get(targetId) ?? []
      list.push(note.id)
      inboundByNoteId.set(targetId, list)
    }
  }

  const sameIds = (a: string[], b: string[]) => a.length === b.length && a.every((id, i) => id === b[i])

  await Promise.all(
    notes.map((note) => {
      const outbound = outboundByNoteId.get(note.id) ?? []
      const inbound = inboundByNoteId.get(note.id) ?? []
      if (sameIds(note.outbound, outbound) && sameIds(note.inbound, inbound)) return null
      return repo.logicNotes.update(note.id, { outbound, inbound })
    }),
  )
}
