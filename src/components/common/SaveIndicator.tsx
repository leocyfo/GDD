import { Check, Loader2, TriangleAlert } from 'lucide-react'
import type { SaveState } from '../../lib/useAutosave'

export function SaveIndicator({ state }: { state: SaveState }) {
  if (state === 'idle') return null

  if (state === 'pending') {
    return <span className="text-2xs text-text3">Unsaved changes</span>
  }
  if (state === 'saving') {
    return (
      <span className="flex items-center gap-1 text-2xs text-text3">
        <Loader2 size={11} className="animate-spin" />
        Saving…
      </span>
    )
  }
  if (state === 'error') {
    return (
      <span className="flex items-center gap-1 text-2xs text-red">
        <TriangleAlert size={11} />
        Couldn&rsquo;t save — try again
      </span>
    )
  }
  return (
    <span className="flex items-center gap-1 text-2xs text-green">
      <Check size={11} />
      Saved
    </span>
  )
}
