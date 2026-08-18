/** Seed ids are deterministic and human-readable (`feature:temporal-rewind`,
 * `note:playerHealth`) rather than random — makes cross-references
 * between seed modules easy to write and easy to debug, and keeps a
 * re-seed from ever producing a different graph. */
export function mkId(kind: string, slug: string): string {
  return `${kind}:${slug}`
}

export function noteId(title: string): string {
  return mkId('note', title)
}

export function sectionId(key: string): string {
  return mkId('section', key)
}

export function tagId(path: string): string {
  return mkId('tag', path.replace('/', '-'))
}
