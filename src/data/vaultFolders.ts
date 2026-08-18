/**
 * The vault's canonical folder tree — exactly per spec. This is structural
 * app configuration (like the GDD's 10 section keys), not demo content, so
 * it lives outside `data/seed/` even though the seed data is currently the
 * only thing populating notes into these folders. A real "create folder"
 * flow (Phase 3) would turn this into a stored, user-editable table instead
 * of a fixed list — this constant is what that migration would seed from.
 */
export const VAULT_FOLDERS = [
  'GAME LOGIC/ACTIVITIES',
  'GAME LOGIC/AUDIO',
  'GAME LOGIC/ECONOMY',
  'GAME LOGIC/INPUT',
  'GAME LOGIC/INVENTORY AND STORAGE',
  'GAME LOGIC/NPC',
  'GAME LOGIC/PLAYER',
  'GAME LOGIC/SAVE AND LOAD',
  'GAME LOGIC/SYSTEM AND CORE',
  'GAME LOGIC/VISUAL',
  'GAME LOGIC/WORLD',
  'MARKETING/Headlines',
  'ORGANIZATION/MESSY STUFF',
  'ORGANIZATION/TEMPLATES',
  'ORGANIZATION/TESTS',
] as const

export type VaultFolder = (typeof VAULT_FOLDERS)[number]
