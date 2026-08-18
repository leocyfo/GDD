import {
  AudioLines,
  BookOpen,
  Boxes,
  CalendarCheck,
  FileQuestion,
  Flag,
  Gamepad2,
  History,
  LayoutDashboard,
  LayoutGrid,
  LayoutPanelLeft,
  Lightbulb,
  ListChecks,
  Map,
  Paperclip,
  Palette,
  Repeat,
  Scale,
  SlidersHorizontal,
  Users,
  type LucideIcon,
} from 'lucide-react'

/** Maps the icon-name strings stored on `Section.icon` (and used by the
 * static secondary-nav config) to their actual component. A persisted
 * string naming a component is normal infrastructure, not "fake content"
 * — the alternative would be storing a component reference in IndexedDB,
 * which isn't serializable at all. */
const ICONS: Record<string, LucideIcon> = {
  LayoutDashboard,
  Lightbulb,
  Gamepad2,
  Boxes,
  BookOpen,
  Palette,
  SlidersHorizontal,
  Map,
  LayoutPanelLeft,
  AudioLines,
  Flag,
  Paperclip,
  History,
  Users,
  LayoutGrid,
  Scale,
  CalendarCheck,
  ListChecks,
  Repeat,
}

export function resolveIcon(name: string): LucideIcon {
  return ICONS[name] ?? FileQuestion
}
