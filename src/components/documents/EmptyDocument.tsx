import type { ReactNode } from 'react'
import { FileQuestion } from 'lucide-react'

/** The shared empty-state shape for the app: a reason, never just "no
 * data", and — when there's a real next action available yet — that
 * action right next to the explanation. */
export function EmptyDocument({
  title,
  body,
  action,
}: {
  title: string
  body: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border p-10 text-center">
      <FileQuestion size={22} className="text-text3" />
      <div className="text-sm-plus font-medium text-text1">{title}</div>
      <p className="max-w-sm text-xs-plus text-text3">{body}</p>
      {action}
    </div>
  )
}
