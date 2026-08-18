/** The app's logo mark — a small compass/time-fracture glyph, shared by the
 * sidebar's project selector and the Hub header so the two clearly read as
 * the same product. */
export function CompassMark({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" aria-hidden="true" className="flex-shrink-0">
      <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-text1">
        <path d="M9 1 L7.3 5.2 M9 1 L10.7 5.2" />
        <path d="M17 9 L12.8 7.3 M17 9 L12.8 10.7" />
        <path d="M9 17 L10.7 12.8 M9 17 L7.3 12.8" />
        <path d="M1 9 L5.2 10.7 M1 9 L5.2 7.3" />
      </g>
    </svg>
  )
}
