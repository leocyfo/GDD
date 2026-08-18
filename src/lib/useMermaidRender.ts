import { useEffect, useRef, useState } from 'react'
import { useThemeStore } from '../stores/useThemeStore'

let renderCounter = 0

export interface MermaidRenderResult {
  svg: string | null
  error: string | null
  loading: boolean
}

/**
 * Renders mermaid source to an SVG string. `mermaid` is a heavy lib — it's
 * dynamically `import()`ed here rather than statically, so it lands in its
 * own chunk and is only ever fetched once a `diagram` block actually
 * exists on screen (see the README's bundle-size note).
 *
 * Themed to match the app's own palette rather than mermaid's default look:
 * reads the live `--raw-*` custom properties (`styles/tokens.css`) via
 * `getComputedStyle` — not passed as `var(--...)` strings, because
 * mermaid's internal color math (lighten/darken for hover states etc.)
 * needs real color values, not CSS variable references. Re-renders when
 * `useThemeStore`'s theme flips, so a diagram never gets stuck in the
 * theme it first rendered in.
 *
 * Debounced 400ms after `source` stops changing — the editor passes its
 * live textarea value in on every keystroke, and re-parsing/re-laying-out
 * a diagram is real work, not free like the other live block previews
 * (`FlowMapDiagram` et al. are pure sync SVG math). The previous render
 * just stays on screen during the debounce window instead of flashing to
 * a loading skeleton mid-keystroke.
 */
export function useMermaidRender(source: string): MermaidRenderResult {
  const theme = useThemeStore((s) => s.theme)
  const [result, setResult] = useState<MermaidRenderResult>({ svg: null, error: null, loading: true })
  const idRef = useRef(`mermaid-diagram-${++renderCounter}`)

  useEffect(() => {
    let cancelled = false
    const trimmed = source.trim()
    if (!trimmed) {
      setResult({ svg: null, error: null, loading: false })
      return
    }

    async function renderNow() {
      setResult((prev) => ({ ...prev, loading: true }))
      const { default: mermaid } = await import('mermaid')
      if (cancelled) return

      const style = getComputedStyle(document.documentElement)
      const token = (name: string) => style.getPropertyValue(name).trim()

      mermaid.initialize({
        startOnLoad: false,
        // A malformed/malicious diagram source must never inject arbitrary
        // HTML or scripts through the labels — this block's content is
        // user-authored and rendered via `dangerouslySetInnerHTML`.
        securityLevel: 'strict',
        // Without this, mermaid's own error path injects an unstyled
        // "bomb" error graphic directly into `document.body` on a parse
        // failure — outside React's tree entirely, so it never gets
        // cleaned up. The `catch` below already renders a real error
        // state; mermaid doesn't need to draw its own.
        suppressErrorRendering: true,
        theme: 'base',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        themeVariables: {
          background: token('--raw-bg-inset'),
          mainBkg: token('--raw-bg-card'),
          primaryColor: token('--raw-bg-card'),
          primaryBorderColor: token('--raw-border-hover'),
          primaryTextColor: token('--raw-text-1'),
          secondaryColor: token('--raw-bg-inset'),
          secondaryBorderColor: token('--raw-border'),
          tertiaryColor: token('--raw-bg-inset'),
          tertiaryBorderColor: token('--raw-border'),
          lineColor: token('--raw-text-3'),
          textColor: token('--raw-text-2'),
          nodeBorder: token('--raw-border-hover'),
          clusterBkg: token('--raw-bg-inset'),
          clusterBorder: token('--raw-border'),
          edgeLabelBackground: token('--raw-bg-inset'),
          fontSize: '13px',
        },
      })

      try {
        const { svg } = await mermaid.render(idRef.current, trimmed)
        if (!cancelled) setResult({ svg, error: null, loading: false })
      } catch (err) {
        if (!cancelled) {
          setResult({ svg: null, error: err instanceof Error ? err.message : 'Could not render this diagram.', loading: false })
        }
      }
    }

    const timeoutId = setTimeout(renderNow, 400)

    return () => {
      cancelled = true
      clearTimeout(timeoutId)
    }
  }, [source, theme])

  return result
}
