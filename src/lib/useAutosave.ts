import { useCallback, useEffect, useRef, useState } from 'react'

export type SaveState = 'idle' | 'pending' | 'saving' | 'saved' | 'error'

/**
 * Debounced-write pattern shared by every editable field in the app:
 * typing schedules a save a beat after the user pauses, blurring flushes
 * immediately, and the caller gets a `state` to render a "Saving…/Saved"
 * indicator from instead of guessing.
 */
export function useAutosave<T>(save: (value: T) => Promise<void>, delayMs = 700) {
  const [state, setState] = useState<SaveState>('idle')
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingValueRef = useRef<T | null>(null)
  const savingRef = useRef(false)
  const saveRef = useRef(save)
  saveRef.current = save

  const flush = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    if (pendingValueRef.current === null || savingRef.current) return
    const value = pendingValueRef.current
    pendingValueRef.current = null
    savingRef.current = true
    setState('saving')
    try {
      await saveRef.current(value)
      setState('saved')
    } catch {
      setState('error')
    } finally {
      savingRef.current = false
    }
  }, [])

  const schedule = useCallback(
    (value: T) => {
      pendingValueRef.current = value
      setState('pending')
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => {
        flush()
      }, delayMs)
    },
    [flush, delayMs],
  )

  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    },
    [],
  )

  return { state, schedule, flush }
}
