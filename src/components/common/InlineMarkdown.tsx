import { Fragment } from 'react'

const TOKEN_RE = /(\[\[[^\]]+\]\]|\*\*[^*]+\*\*|`[^`]+`)/g

/**
 * Light inline-markdown rendering for read-only text: `**bold**`,
 * `` `code` ``, and `[[Wikilink]]` tokens. This is display only — typing
 * `**` to get bold, or `[[` to trigger a link autocomplete, is the block
 * editor's job in Phase 2/3. When a `[[Title]]` token matches a real note
 * (via `noteIdByTitle`) it renders as a real, clickable link; otherwise it
 * still reads visually as a link so the wikilink syntax itself is legible
 * before the vault has that note.
 */
export function InlineMarkdown({
  text,
  noteIdByTitle,
  onOpenNote,
}: {
  text: string
  noteIdByTitle?: Map<string, string>
  onOpenNote?: (noteId: string, title: string) => void
}) {
  const parts = text.split(TOKEN_RE)

  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith('[[') && part.endsWith(']]')) {
          const title = part.slice(2, -2)
          const noteId = noteIdByTitle?.get(title)
          if (noteId && onOpenNote) {
            return (
              <button
                key={index}
                type="button"
                onClick={() => onOpenNote(noteId, title)}
                className="rounded bg-inset px-1 font-mono text-[0.92em] text-accent hover:underline"
              >
                {title}
              </button>
            )
          }
          return (
            <span key={index} className="rounded bg-inset px-1 font-mono text-[0.92em] text-accent">
              {title}
            </span>
          )
        }
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={index} className="font-semibold text-text1">
              {part.slice(2, -2)}
            </strong>
          )
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return (
            <code key={index} className="rounded bg-inset px-1 font-mono text-[0.88em] text-text1">
              {part.slice(1, -1)}
            </code>
          )
        }
        return <Fragment key={index}>{part}</Fragment>
      })}
    </>
  )
}
