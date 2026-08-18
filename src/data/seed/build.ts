import type {
  Asset,
  ChangeEntry,
  Collaborator,
  Decision,
  FeatureCard,
  Level,
  Loop,
  LogicNote,
  Milestone,
  NonGoal,
  Pillar,
  ProductionAsset,
  Project,
  ScopeEntry,
  Section,
  Tag,
} from '../types/entities'
import { buildAssets } from './assets.seed'
import { buildChangeEntries } from './changelog.seed'
import { buildCollaborators } from './collaborators.seed'
import { buildDecisions } from './decisions.seed'
import { buildFeatureCards } from './featureCards.seed'
import { buildLevels } from './levels.seed'
import { buildLoops } from './loop.seed'
import { buildMilestones } from './milestones.seed'
import { buildPillars, buildNonGoals } from './pillarsNonGoals.seed'
import { buildProductionAssets } from './productionAssets.seed'
import { buildProject } from './project.seed'
import { buildScopeEntries } from './scopeMatrix.seed'
import { buildSections } from './sections.seed'
import { buildLogicNotes } from './vault/notes.seed'
import { buildTags } from './vault/tags.seed'

/** The full in-memory demo dataset, fully cross-linked, before anything
 * touches IndexedDB. Pure and synchronous — safe to call from a Vitest
 * test with no `fake-indexeddb` involved. */
export interface SeedGraph {
  project: Project
  pillars: Pillar[]
  nonGoals: NonGoal[]
  loops: Loop[]
  sections: Section[]
  featureCards: FeatureCard[]
  scopeEntries: ScopeEntry[]
  decisions: Decision[]
  logicNotes: LogicNote[]
  tags: Tag[]
  milestones: Milestone[]
  collaborators: Collaborator[]
  changeEntries: ChangeEntry[]
  assets: Asset[]
  productionAssets: ProductionAsset[]
  levels: Level[]
}

export function buildSeedGraph(): SeedGraph {
  const logicNotes = buildLogicNotes()

  return {
    project: buildProject(),
    pillars: buildPillars(),
    nonGoals: buildNonGoals(),
    loops: buildLoops(),
    sections: buildSections(),
    featureCards: buildFeatureCards(),
    scopeEntries: buildScopeEntries(),
    decisions: buildDecisions(),
    logicNotes,
    tags: buildTags(logicNotes),
    milestones: buildMilestones(),
    collaborators: buildCollaborators(),
    changeEntries: buildChangeEntries(),
    assets: buildAssets(),
    productionAssets: buildProductionAssets(),
    levels: buildLevels(),
  }
}
