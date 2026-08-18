import { X } from 'lucide-react'
import { useEffect, useRef, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from 'react'

/**
 * Generic modal shell — backdrop, `Escape`-to-close, a `Tab` focus trap so
 * keyboard focus can't walk into the sidebar/tab bar sitting behind it, and
 * focus-return to whatever triggered the modal once it closes. Extracted
 * from `CommandPalette.tsx`, which had this exact logic inline — every
 * modal in the app should share one copy of it rather than re-deriving the
 * focus-trap edge cases each time.
 *
 * `align="start"` (near the top, command-palette style) vs `"center"` (a
 * true centered dialog, for a detail/edit modal) is the one layout choice
 * left to the caller; everything else about "being a modal" is fixed here.
 */
export function Modal({
  onClose,
  ariaLabel,
  widthClassName = 'max-w-lg',
  align = 'center',
  onKeyDown,
  children,
}: {
  onClose: () => void
  ariaLabel: string
  widthClassName?: string
  align?: 'start' | 'center'
  /** Extra keydown handling the caller needs on top of the trap (e.g. the
   * command palette's own arrow-key/Enter navigation). Runs before the
   * focus trap. */
  onKeyDown?: (event: ReactKeyboardEvent) => void
  children: ReactNode
}) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const lastFocusedRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    lastFocusedRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null

    function onWindowKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onWindowKeyDown)

    const frame = requestAnimationFrame(() => {
      dialogRef.current?.querySelector<HTMLElement>('input, button, textarea, select, [tabindex]')?.focus()
    })

    return () => {
      window.removeEventListener('keydown', onWindowKeyDown)
      cancelAnimationFrame(frame)
      // Return focus to whatever opened the modal rather than dropping it
      // to <body> when the dialog unmounts.
      lastFocusedRef.current?.focus()
    }
  }, [onClose])

  function trapFocus(event: ReactKeyboardEvent) {
    onKeyDown?.(event)
    if (event.key !== 'Tab' || !dialogRef.current) return
    const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
      'input, button:not([disabled]), textarea, select, [tabindex]:not([tabindex="-1"])',
    )
    if (focusable.length === 0) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex justify-center bg-black/50 ${align === 'start' ? 'items-start pt-[15vh]' : 'items-center p-6'}`}
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={trapFocus}
        className={`flex max-h-[85vh] w-full ${widthClassName} flex-col overflow-hidden rounded-xl border border-border bg-card shadow-card`}
      >
        {children}
      </div>
    </div>
  )
}

/** Small shared close button — top-right of a modal that isn't the command
 * palette (which closes via Escape/backdrop only, no visible chrome). */
export function ModalCloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      aria-label="Close"
      onClick={onClose}
      className="absolute right-3 top-3 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-text3 transition-colors hover:bg-inset hover:text-text1"
    >
      <X size={15} />
    </button>
  )
}
