import type {
  FeatureStatus,
  Freshness,
  LevelStatus,
  MilestoneState,
  Presence,
  ProductionAssetStatus,
  ProjectStatus,
  ScopeVerdict,
  SyncState,
} from '../data/types/entities'

/** The app's one semantic color family (green/amber/red/blue/gray),
 * mapped once per status enum here so every screen reads the same status
 * the same way — a feature card, a milestone, and a section's freshness
 * dot never disagree about what "at risk" looks like. */
export type Tone = 'green' | 'amber' | 'red' | 'blue' | 'gray'

export function toneForFreshness(freshness: Freshness): Tone {
  switch (freshness) {
    case 'fresh':
      return 'green'
    case 'aging':
      return 'amber'
    case 'stale':
      return 'red'
  }
}

export function toneForPresence(presence: Presence): Tone {
  switch (presence) {
    case 'online':
      return 'green'
    case 'away':
      return 'amber'
    case 'offline':
      return 'gray'
  }
}

export function toneForFeatureStatus(status: FeatureStatus): Tone {
  switch (status) {
    case 'shipped':
      return 'green'
    case 'in-build':
      return 'blue'
    case 'in-build-diverged':
      return 'red'
    case 'designed':
      return 'amber'
    case 'idea':
    case 'cut':
      return 'gray'
  }
}

export function toneForMilestoneState(state: MilestoneState): Tone {
  switch (state) {
    case 'done':
      return 'green'
    case 'active':
      return 'blue'
    case 'at-risk':
      return 'red'
    case 'upcoming':
      return 'gray'
  }
}

export function toneForSyncState(state: SyncState): Tone {
  switch (state) {
    case 'matches-build':
      return 'green'
    case 'ahead-of-build':
      return 'amber'
    case 'behind-build':
      return 'red'
    case 'unknown':
      return 'gray'
  }
}

export function toneForProjectStatus(status: ProjectStatus): Tone {
  switch (status) {
    case 'active':
      return 'green'
    case 'frozen':
      return 'blue'
    case 'draft':
      return 'amber'
    case 'archived':
      return 'gray'
  }
}

export function toneForScopeVerdict(verdict: ScopeVerdict): Tone {
  switch (verdict) {
    case 'in':
      return 'green'
    case 'stretch':
      return 'amber'
    case 'undecided':
      return 'red'
    case 'out':
      return 'gray'
  }
}

export function toneForProductionAssetStatus(status: ProductionAssetStatus): Tone {
  switch (status) {
    case 'done':
      return 'green'
    case 'in-progress':
      return 'blue'
    case 'todo':
      return 'amber'
    case 'cut':
      return 'gray'
  }
}

export function toneForLevelStatus(status: LevelStatus): Tone {
  switch (status) {
    case 'done':
      return 'green'
    case 'art-pass':
      return 'blue'
    case 'blockout':
      return 'amber'
    case 'concept':
      return 'gray'
  }
}
