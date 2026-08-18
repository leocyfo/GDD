import type { ChangeTargetType, VersionBump } from '../data/types/entities'

/**
 * The document version's semver rule, stated explicitly rather than left to
 * judgement: `major` when a pillar or non-goal changes, `minor` when a
 * section or feature card changes, `patch` for everything else. Shared by
 * the seed data and by any future live edit flow, so the rule can't drift
 * between the two.
 */
export function versionBumpForTarget(type: ChangeTargetType): VersionBump {
  if (type === 'pillar' || type === 'non-goal') return 'major'
  if (type === 'section' || type === 'feature') return 'minor'
  return 'patch'
}
