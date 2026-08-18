/**
 * All seed timestamps are computed relative to a fixed anchor rather than
 * `new Date()` — the demo dataset must be reproducible every time
 * `ensureSeeded` runs (and identical every time `seed.integrity.test.ts`
 * runs), not drift with whatever moment the app happens to boot.
 */
export const SEED_ANCHOR = new Date('2026-08-12T12:00:00.000Z')

export function daysBeforeAnchor(days: number): string {
  const d = new Date(SEED_ANCHOR)
  d.setUTCDate(d.getUTCDate() - days)
  return d.toISOString()
}

export function daysAfterAnchor(days: number): string {
  return daysBeforeAnchor(-days)
}

/** Truncates an ISO timestamp to its `YYYY-MM-DD` date component, for
 * fields the spec models as plain dates (`Decision.date`,
 * `Milestone.date`). */
export function dateOnly(iso: string): string {
  return iso.slice(0, 10)
}
