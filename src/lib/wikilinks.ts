/** Matches `[[Title]]` tokens — the one wikilink syntax the app supports,
 * shared by the read-only renderer (`InlineMarkdown`) and the editor. */
const WIKILINK_RE = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g

/** Every title referenced by `[[Title]]` in a piece of markdown, in the
 * order they first appear, de-duplicated. */
export function extractWikilinkTitles(markdown: string): string[] {
  const titles: string[] = []
  const seen = new Set<string>()
  for (const match of markdown.matchAll(WIKILINK_RE)) {
    const title = match[1].trim()
    if (title && !seen.has(title)) {
      seen.add(title)
      titles.push(title)
    }
  }
  return titles
}
