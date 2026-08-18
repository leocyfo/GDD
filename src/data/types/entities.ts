/**
 * The full domain model, transcribed from the spec's `## Modèle de données`.
 * A few fields the spec left loosely typed (`target.type`, `anchor.type`,
 * `MapPin`) are given concrete shapes here — noted inline where that
 * happens. Everything else matches the spec's field names and unions
 * exactly.
 */
import type { BaseEntity } from './common'

// ---------------------------------------------------------------------------
// Project
// ---------------------------------------------------------------------------

export type ProjectStatus = 'draft' | 'active' | 'frozen' | 'archived'
export type EditPolicy = 'everyone' | 'leads' | 'owner'

export interface Project extends BaseEntity {
  name: string
  /** Semver of the *document*, not the game build — e.g. "1.4.2". */
  version: string
  status: ProjectStatus
  editPolicy: EditPolicy
  intro: string
}

// ---------------------------------------------------------------------------
// Section + Block (the block-editor content model)
// ---------------------------------------------------------------------------

export type SectionKey =
  | 'core-concept'
  | 'gameplay'
  | 'story'
  | 'art'
  | 'constraints'
  | 'level'
  | 'ui-ux'
  | 'audio'
  | 'milestones'
  | 'appendix'

export type Freshness = 'fresh' | 'aging' | 'stale'

export interface Section extends BaseEntity {
  projectId: string
  /** 1..10 — controls the numbering shown in the UI. */
  index: number
  key: SectionKey
  title: string
  icon: string
  blocks: Block[]
  owners: string[]
  freshness: Freshness
  reviewedAt: string | null
}

export type CalloutVariant = 'note' | 'warning' | 'decision' | 'risk'

/** Not defined by the spec's inline schema — shape inferred from how
 * `annotatedMap` blocks are described in the Level/World screen (pins on a
 * map, optionally pointing at a logic note). */
export interface MapPin {
  id: string
  x: number
  y: number
  label: string
  noteId?: string
}

/** One row of a controls diagram: a numbered callout (`id`) plus what it
 * does. `codes` are `KeyboardEvent.code` values (physical position, not
 * printed character) used to place the callout badge on the rendered
 * keyboard — empty means "not a keyboard key" (mouse movement, a click),
 * which still gets a legend row but no badge on the keyboard itself. */
export interface ControlsDiagramEntry {
  id: number
  keys: string
  codes: string[]
  action: string
  gameState: string
}

/** A real flowchart node — unlike `LoopNode` (a single-file chain, always
 * left to right, always the same box), this one has a `shape` that
 * carries meaning (start/end ovals, decision diamonds, process
 * rectangles — standard flowchart notation), so a flow can branch,
 * converge, and route in more than one direction instead of only ever
 * reading as one straight line.
 *
 * Only `row` is authored — there's no `col`. A node's column is its
 * distance from the nearest start (the longest chain of `edges` leading
 * to it), computed at render time in `FlowMapBlock.tsx` — a node that
 * says who it connects to already implies where it sits left-to-right, so
 * asking the author to *also* keep a column number in sync by hand would
 * just be the same fact stored twice. */
export type FlowMapShape = 'start' | 'end' | 'process' | 'decision'

export interface FlowMapNode {
  id: string
  label: string
  note?: string
  shape: FlowMapShape
  row: number
}

export interface FlowMapEdge {
  from: string
  to: string
  label?: string
}

export type Block =
  | { type: 'text'; markdown: string }
  | { type: 'heading'; level: 2 | 3; text: string }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'callout'; variant: CalloutVariant; title: string; body: string }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'image'; assetId: string; caption: string }
  | { type: 'gallery'; assetIds: string[] }
  | { type: 'palette'; swatches: { hex: string; name: string }[] }
  | { type: 'loop'; loopId: string }
  | { type: 'featureCards'; featureIds: string[] }
  | { type: 'scopeMatrix'; matrixId: string }
  | { type: 'embedNote'; noteId: string } // bridge into the vault
  | { type: 'query'; expression: string } // live query, see the query language
  | { type: 'diagram'; mermaid: string }
  | { type: 'annotatedMap'; assetId: string; pins: MapPin[] }
  | { type: 'controlsDiagram'; entries: ControlsDiagramEntry[] }
  | { type: 'flowMap'; nodes: FlowMapNode[]; edges: FlowMapEdge[] }
  // No stored ids, same reasoning as `scopeMatrix`: a project only ever
  // needs one catalog, so the block just means "show every `Level` here".
  | { type: 'levelCatalog' }

export type BlockType = Block['type']

// ---------------------------------------------------------------------------
// Pillars / non-goals
// ---------------------------------------------------------------------------

export interface Pillar extends BaseEntity {
  projectId: string
  label: string
  rationale: string
  order: number
}

export interface NonGoal extends BaseEntity {
  projectId: string
  statement: string
  reason: string
}

// ---------------------------------------------------------------------------
// Gameplay loop
// ---------------------------------------------------------------------------

export interface LoopNode {
  id: string
  verb: string
  note: string
}

export interface LoopEdge {
  from: string
  to: string
  label?: string
}

export interface Loop extends BaseEntity {
  projectId: string
  name: string
  nodes: LoopNode[]
  edges: LoopEdge[]
  isCycle: boolean
}

// ---------------------------------------------------------------------------
// Feature cards
// ---------------------------------------------------------------------------

export type FeatureStatus =
  | 'idea'
  | 'designed'
  | 'in-build'
  | 'in-build-diverged'
  | 'shipped'
  | 'cut'

export type RiskLevel = 'low' | 'medium' | 'high'

export interface FeatureCard extends BaseEntity {
  projectId: string
  name: string
  /** What the player feels, in one sentence. */
  playerPromise: string
  summary: string
  logic: string
  /** Other featureIds this depends on. */
  dependencies: string[]
  /** Links into the vault. */
  logicNoteIds: string[]
  status: FeatureStatus
  owner: string
  risk: RiskLevel
}

// ---------------------------------------------------------------------------
// Scope matrix
// ---------------------------------------------------------------------------

export type ScopeVerdict = 'in' | 'out' | 'stretch' | 'undecided'

export interface ScopeEntry extends BaseEntity {
  matrixId: string
  item: string
  verdict: ScopeVerdict
  /** Every entry must point at a decision or a piece of evidence — enforced
   * at the UI layer in a later phase, not by the type itself. */
  decisionId: string | null
  evidenceUrl: string | null
}

// ---------------------------------------------------------------------------
// Decisions
// ---------------------------------------------------------------------------

export type AffectedType = 'section' | 'feature' | 'note' | 'milestone'
export type SyncState = 'matches-build' | 'ahead-of-build' | 'behind-build' | 'unknown'

export interface AffectedRef {
  type: AffectedType
  id: string
}

export interface Decision extends BaseEntity {
  projectId: string
  title: string
  date: string
  decidedBy: string[]
  context: string
  choice: string
  alternatives: string
  consequences: string
  /** Id of a decision this one cancels, if any. */
  supersedes: string | null
  affects: AffectedRef[]
  syncState: SyncState
}

// ---------------------------------------------------------------------------
// Logic notes (the vault)
// ---------------------------------------------------------------------------

export type NoteScope = 'global' | 'scene' | 'session' | 'save' | 'local'
export type NoteKind = 'variable' | 'switch' | 'event' | 'formula' | 'state-machine' | 'constant'
export type ValueType = 'bool' | 'int' | 'float' | 'string' | 'enum' | 'vector' | 'ref'

export interface LogicNote extends BaseEntity {
  projectId: string
  /** e.g. "GAME LOGIC/ECONOMY". */
  folderPath: string
  /** camelCase by convention: purchasedFlour, breadYeastRatio. */
  title: string
  scope: NoteScope
  kind: NoteKind
  valueType: ValueType
  /** Domain, default value, bounds — free text. */
  values: string
  /** Markdown: rules, conditions, edge cases. */
  logic: string
  /** noteIds computed from inbound wikilinks — never hand-authored. */
  inbound: string[]
  /** noteIds extracted from this note's own body. */
  outbound: string[]
  /** Hierarchical: "type/switch", "status/implemented". */
  tags: string[]
  extras: string
  /** e.g. "BP_PlayerState::bHasKey" — path into the engine, if wired up. */
  engineRef: string | null
}

// ---------------------------------------------------------------------------
// Tags
// ---------------------------------------------------------------------------

export interface Tag extends BaseEntity {
  /** e.g. "status/wip". */
  path: string
  color: string
  count: number
}

// ---------------------------------------------------------------------------
// Milestones
// ---------------------------------------------------------------------------

export type MilestoneState = 'done' | 'active' | 'upcoming' | 'at-risk'

export interface Milestone extends BaseEntity {
  projectId: string
  name: string
  date: string
  state: MilestoneState
  exitCriteria: string[]
  linkedFeatureIds: string[]
}

// ---------------------------------------------------------------------------
// Collaborators
// ---------------------------------------------------------------------------

export type CollaboratorRole = 'owner' | 'editor' | 'commenter' | 'viewer'
export type Presence = 'online' | 'away' | 'offline'

export interface Collaborator extends BaseEntity {
  projectId: string
  name: string
  discipline: string
  role: CollaboratorRole
  presence: Presence
  lastSeen: string
  /** The real Supabase account this teammate corresponds to, if any —
   * `null` for a purely decorative row (seed data, or offline/Dexie mode,
   * which has no accounts at all). Set when "New teammate" is given an
   * email in cloud mode and the invite succeeds (see `TeamView.tsx`);
   * ignored entirely outside cloud mode. */
  userId: string | null
}

// ---------------------------------------------------------------------------
// Changelog
// ---------------------------------------------------------------------------

/** The spec leaves `target.type` as a bare `string`; given a concrete
 * (still open-ended-in-spirit) union here so changelog entries stay
 * type-checked while covering every kind of record that can actually
 * change. */
export type ChangeTargetType =
  | 'project'
  | 'section'
  | 'feature'
  | 'note'
  | 'milestone'
  | 'decision'
  | 'tag'
  | 'collaborator'
  | 'scope-entry'
  | 'loop'
  | 'pillar'
  | 'non-goal'
  | 'production-asset'
  | 'level'

export interface ChangeTarget {
  type: ChangeTargetType
  id: string
  label: string
}

export type ChangeKind = 'created' | 'edited' | 'moved' | 'deleted' | 'status-changed'
export type VersionBump = 'major' | 'minor' | 'patch' | null

export interface ChangeEntry extends BaseEntity {
  projectId: string
  at: string
  by: string
  target: ChangeTarget
  kind: ChangeKind
  diffSummary: string
  versionBump: VersionBump
}

// ---------------------------------------------------------------------------
// Assets / comments
// ---------------------------------------------------------------------------

export type AssetKind = 'image' | 'video' | 'audio' | 'file'

export interface Asset extends BaseEntity {
  projectId: string
  kind: AssetKind
  url: string
  caption: string
  tags: string[]
}

export type ProductionAssetStatus = 'todo' | 'in-progress' | 'done' | 'cut'

/** A production checklist entry — "this art/audio/model needs to exist" —
 * distinct from `Asset` above, which holds a file that's already been
 * uploaded. `assetId` is the bridge between the two: null while the thing
 * is still just planned, set once someone actually delivers the file, so
 * "what we still need" and "what we have" never drift into two unrelated
 * lists. */
export interface ProductionAsset extends BaseEntity {
  projectId: string
  name: string
  kind: AssetKind
  purpose: string
  status: ProductionAssetStatus
  notes: string
  assetId: string | null
}

export type LevelStatus = 'concept' | 'blockout' | 'art-pass' | 'done'

/** One entry in a level/map/POI catalog. Kept generic (not battle-royale
 * specific) so it fits both "discrete levels" games and "named zones on
 * one map" games — see the `levelCatalog` block below for how it's shown. */
export interface Level extends BaseEntity {
  projectId: string
  name: string
  summary: string
  uniqueFeatures: string
  assetId: string | null
  status: LevelStatus
  order: number
}

/** Same underspecified-`type` situation as `ChangeTarget` — narrowed to the
 * anchor kinds Phase 1+ actually produces. */
export type CommentAnchorType = 'section' | 'block' | 'feature' | 'note' | 'decision'

export interface CommentAnchor {
  type: CommentAnchorType
  id: string
}

export interface Comment extends BaseEntity {
  anchor: CommentAnchor
  body: string
  by: string
  at: string
  resolved: boolean
}
