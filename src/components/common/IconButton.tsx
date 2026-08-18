import type { LucideIcon } from 'lucide-react'

export function IconButton({
  icon: Icon,
  label,
  onClick,
  active = false,
  size = 15,
  className = '',
}: {
  icon: LucideIcon
  label: string
  onClick?: () => void
  active?: boolean
  size?: number
  className?: string
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`flex h-7 w-7 items-center justify-center rounded-md border transition-colors ${
        active ? 'border-border-hover bg-inset text-text1' : 'border-transparent text-text3 hover:border-border hover:bg-inset hover:text-text2'
      } ${className}`}
    >
      <Icon size={size} />
    </button>
  )
}
