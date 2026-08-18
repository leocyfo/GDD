/** A picture if there's an `avatarUrl`, else a single initial on the
 * accent color — shared by the profile button, the profile modal, and
 * every member row in "who has access." */
export function Avatar({ url, name, size = 28 }: { url?: string | null; name: string; size?: number }) {
  const initial = (name.trim()[0] ?? '?').toUpperCase()

  if (url) {
    return (
      <img
        src={url}
        alt=""
        className="flex-shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    )
  }

  return (
    <div
      className="flex flex-shrink-0 items-center justify-center rounded-full bg-accent font-semibold text-accent-fg"
      style={{ width: size, height: size, fontSize: Math.max(size * 0.42, 9) }}
      aria-hidden="true"
    >
      {initial}
    </div>
  )
}
