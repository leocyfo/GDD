import { Plus, X } from 'lucide-react'
import { useState, type KeyboardEvent } from 'react'

/** Editable `#type/status` pill list — Enter or blur commits the new tag,
 * each existing pill gets its own remove button. No validation beyond
 * "not empty" here; the `type/status/system` namespace convention is a
 * writing convention the template documents, not an enforced schema. */
export function TagEditor({ tags, onChange }: { tags: string[]; onChange: (tags: string[]) => void }) {
  const [draft, setDraft] = useState('')
  const [adding, setAdding] = useState(false)

  function commit() {
    const value = draft.trim().replace(/^#/, '')
    if (value && !tags.includes(value)) onChange([...tags, value])
    setDraft('')
    setAdding(false)
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault()
      commit()
    } else if (event.key === 'Escape') {
      setDraft('')
      setAdding(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {tags.map((tag) => (
        <span
          key={tag}
          className="flex items-center gap-1 rounded-full border border-border bg-card px-2 py-0.5 font-mono text-2xs text-text2"
        >
          #{tag}
          <button
            type="button"
            aria-label={`Remove tag ${tag}`}
            onClick={() => onChange(tags.filter((t) => t !== tag))}
            className="text-text3 transition-colors hover:text-red"
          >
            <X size={10} />
          </button>
        </span>
      ))}

      {adding ? (
        <input
          autoFocus
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          onBlur={commit}
          placeholder="type/status"
          className="w-32 rounded-full border border-border bg-card px-2 py-0.5 font-mono text-2xs text-text1 outline-none focus-visible:border-accent"
        />
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="flex items-center gap-1 rounded-full border border-dashed border-border px-2 py-0.5 text-2xs text-text3 transition-colors hover:border-border-hover hover:text-text2"
        >
          <Plus size={10} />
          Add tag
        </button>
      )}
    </div>
  )
}
