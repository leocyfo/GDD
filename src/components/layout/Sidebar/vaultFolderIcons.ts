import {
  Archive,
  AudioLines,
  Coins,
  Cpu,
  Eye,
  FlaskConical,
  Folder,
  FolderTree,
  Gamepad2,
  Globe,
  Megaphone,
  Package,
  Save,
  Shuffle,
  User,
  Users,
  Zap,
  type LucideIcon,
} from 'lucide-react'

/** One distinct icon per vault folder, keyed by its leaf name (the last
 * path segment) so both the top-level groups (GAME LOGIC, MARKETING,
 * ORGANIZATION) and their subfolders resolve. */
const FOLDER_ICONS: Record<string, LucideIcon> = {
  'GAME LOGIC': FolderTree,
  MARKETING: Megaphone,
  ORGANIZATION: Archive,
  ACTIVITIES: Zap,
  AUDIO: AudioLines,
  ECONOMY: Coins,
  INPUT: Gamepad2,
  'INVENTORY AND STORAGE': Package,
  NPC: Users,
  PLAYER: User,
  'SAVE AND LOAD': Save,
  'SYSTEM AND CORE': Cpu,
  VISUAL: Eye,
  WORLD: Globe,
  Headlines: Megaphone,
  'MESSY STUFF': Shuffle,
  TEMPLATES: FolderTree,
  TESTS: FlaskConical,
}

export function resolveFolderIcon(leafName: string): LucideIcon {
  return FOLDER_ICONS[leafName] ?? Folder
}
