import { VAULT_FOLDERS } from '../vaultFolders'
import type { SeedGraph } from './build'

export interface ValidationResult {
  ok: boolean
  errors: string[]
}

/**
 * Referential-integrity checks over a `SeedGraph`. Used both by
 * `seed.integrity.test.ts` and by `ensureSeeded` at boot (which throws
 * rather than silently persisting a broken graph) — the same function, so
 * "tested" and "enforced at runtime" can never drift apart.
 */
export function validateSeedGraph(graph: SeedGraph): ValidationResult {
  const errors: string[] = []
  const fail = (message: string) => errors.push(message)

  // ---- ids are unique within each collection --------------------------
  for (const [name, items] of Object.entries({
    pillars: graph.pillars,
    nonGoals: graph.nonGoals,
    loops: graph.loops,
    sections: graph.sections,
    featureCards: graph.featureCards,
    scopeEntries: graph.scopeEntries,
    decisions: graph.decisions,
    logicNotes: graph.logicNotes,
    tags: graph.tags,
    milestones: graph.milestones,
    collaborators: graph.collaborators,
    changeEntries: graph.changeEntries,
    assets: graph.assets,
    productionAssets: graph.productionAssets,
    levels: graph.levels,
  })) {
    const ids = new Set<string>()
    for (const item of items as { id: string }[]) {
      if (ids.has(item.id)) fail(`Duplicate id "${item.id}" in ${name}`)
      ids.add(item.id)
    }
  }

  // ---- volumes match the spec ------------------------------------------
  if (graph.pillars.length < 3 || graph.pillars.length > 5) {
    fail(`Expected 3-5 pillars, got ${graph.pillars.length}`)
  }
  if (graph.nonGoals.length < 3) {
    fail(`Expected at least 3 non-goals, got ${graph.nonGoals.length}`)
  }
  if (graph.featureCards.length !== 12) {
    fail(`Expected 12 feature cards, got ${graph.featureCards.length}`)
  }
  if (!graph.featureCards.some((f) => f.status === 'in-build-diverged')) {
    fail('Expected at least one feature card with status "in-build-diverged"')
  }
  if (graph.scopeEntries.length !== 20) {
    fail(`Expected 20 scope entries, got ${graph.scopeEntries.length}`)
  }
  const undecided = graph.scopeEntries.filter((e) => e.verdict === 'undecided')
  if (undecided.length !== 3 || undecided.some((e) => e.decisionId !== null)) {
    fail('Expected exactly 3 scope entries that are "undecided" with no linked decision')
  }
  if (graph.decisions.length !== 8) {
    fail(`Expected 8 decisions, got ${graph.decisions.length}`)
  }
  if (graph.decisions.filter((d) => d.supersedes !== null).length !== 1) {
    fail('Expected exactly one decision that supersedes another')
  }
  if (graph.milestones.length !== 4) {
    fail(`Expected 4 milestones, got ${graph.milestones.length}`)
  }
  if (!graph.milestones.some((m) => m.state === 'done')) {
    fail('Expected at least one milestone with state "done"')
  }
  if (graph.collaborators.length !== 5) {
    fail(`Expected 5 collaborators, got ${graph.collaborators.length}`)
  }
  if (graph.logicNotes.length < 40 || graph.logicNotes.length > 60) {
    fail(`Expected 40-60 logic notes, got ${graph.logicNotes.length}`)
  }
  if (graph.changeEntries.length !== 30) {
    fail(`Expected 30 changelog entries, got ${graph.changeEntries.length}`)
  }
  if (graph.sections.length !== 10) {
    fail(`Expected 10 sections, got ${graph.sections.length}`)
  }

  // ---- sections: exactly the 10 spec keys, index 1..10 contiguous -----
  const sortedIndexes = graph.sections.map((s) => s.index).sort((a, b) => a - b)
  sortedIndexes.forEach((index, i) => {
    if (index !== i + 1) fail(`Section indexes must be 1..10 contiguous, got [${sortedIndexes.join(', ')}]`)
  })
  const sectionKeys = new Set(graph.sections.map((s) => s.key))
  if (sectionKeys.size !== graph.sections.length) fail('Duplicate section keys')

  // ---- lookups for cross-reference checks ------------------------------
  const noteById = new Map(graph.logicNotes.map((n) => [n.id, n]))
  const featureById = new Map(graph.featureCards.map((f) => [f.id, f]))
  const decisionById = new Map(graph.decisions.map((d) => [d.id, d]))
  const milestoneById = new Map(graph.milestones.map((m) => [m.id, m]))
  const sectionById = new Map(graph.sections.map((s) => [s.id, s]))
  const loopById = new Map(graph.loops.map((l) => [l.id, l]))
  const assetById = new Map(graph.assets.map((a) => [a.id, a]))
  const collaboratorById = new Map(graph.collaborators.map((c) => [c.id, c]))
  const tagByPath = new Map(graph.tags.map((t) => [t.path, t]))
  const pillarById = new Map(graph.pillars.map((p) => [p.id, p]))
  const nonGoalById = new Map(graph.nonGoals.map((g) => [g.id, g]))
  const scopeEntryById = new Map(graph.scopeEntries.map((e) => [e.id, e]))
  const projectId = graph.project.id

  // ---- production assets / levels: assetId (when set) resolves ----------
  for (const entry of graph.productionAssets) {
    if (entry.assetId && !assetById.has(entry.assetId)) {
      fail(`Production asset "${entry.name}" links to unknown asset "${entry.assetId}"`)
    }
  }
  for (const level of graph.levels) {
    if (level.assetId && !assetById.has(level.assetId)) {
      fail(`Level "${level.name}" links to unknown asset "${level.assetId}"`)
    }
  }

  // ---- logic notes: canonical folders, symmetric backlinks -------------
  const canonicalFolders = new Set<string>(VAULT_FOLDERS)
  for (const note of graph.logicNotes) {
    if (!canonicalFolders.has(note.folderPath)) {
      fail(`Logic note "${note.title}" has non-canonical folderPath "${note.folderPath}"`)
    }
    for (const outId of note.outbound) {
      if (!noteById.has(outId)) fail(`Logic note "${note.title}" has dangling outbound link "${outId}"`)
      const target = noteById.get(outId)
      if (target && !target.inbound.includes(note.id)) {
        fail(`Backlink asymmetry: "${note.title}" -> "${target.title}" has no matching inbound entry`)
      }
    }
    for (const inId of note.inbound) {
      const source = noteById.get(inId)
      if (!source) fail(`Logic note "${note.title}" has dangling inbound link "${inId}"`)
      else if (!source.outbound.includes(note.id)) {
        fail(`Backlink asymmetry: "${note.title}" claims inbound from "${source.title}" which has no matching outbound entry`)
      }
    }
  }

  // ---- tags: counts match actual usage ----------------------------------
  const tallies = new Map<string, number>()
  for (const note of graph.logicNotes) {
    for (const path of note.tags) tallies.set(path, (tallies.get(path) ?? 0) + 1)
  }
  for (const tag of graph.tags) {
    if (tallies.get(tag.path) !== tag.count) {
      fail(`Tag "${tag.path}" count is ${tag.count}, actual usage is ${tallies.get(tag.path) ?? 0}`)
    }
  }

  // ---- feature cards: dependencies/logicNoteIds resolve, DAG -----------
  for (const feature of graph.featureCards) {
    if (feature.dependencies.includes(feature.id)) fail(`Feature "${feature.name}" depends on itself`)
    for (const depId of feature.dependencies) {
      if (!featureById.has(depId)) fail(`Feature "${feature.name}" depends on unknown feature "${depId}"`)
    }
    for (const noteRef of feature.logicNoteIds) {
      if (!noteById.has(noteRef)) fail(`Feature "${feature.name}" links to unknown logic note "${noteRef}"`)
    }
  }
  const DFS_STATE = { visiting: 0, done: 1 } as const
  const state = new Map<string, number>()
  const visit = (id: string, chain: string[]): void => {
    if (state.get(id) === DFS_STATE.done) return
    if (state.get(id) === DFS_STATE.visiting) {
      fail(`Feature dependency cycle: ${[...chain, id].join(' -> ')}`)
      return
    }
    state.set(id, DFS_STATE.visiting)
    const feature = featureById.get(id)
    for (const depId of feature?.dependencies ?? []) visit(depId, [...chain, id])
    state.set(id, DFS_STATE.done)
  }
  for (const feature of graph.featureCards) visit(feature.id, [])

  // ---- scope entries: decisionId resolves when present ------------------
  for (const entry of graph.scopeEntries) {
    if (entry.decisionId && !decisionById.has(entry.decisionId)) {
      fail(`Scope entry "${entry.item}" links to unknown decision "${entry.decisionId}"`)
    }
    if (entry.verdict !== 'undecided' && !entry.decisionId && !entry.evidenceUrl) {
      fail(`Scope entry "${entry.item}" is "${entry.verdict}" but has neither a decision nor evidence`)
    }
  }

  // ---- decisions: affects[] resolves, supersedes resolves ---------------
  for (const decision of graph.decisions) {
    if (decision.supersedes && !decisionById.has(decision.supersedes)) {
      fail(`Decision "${decision.title}" supersedes unknown decision "${decision.supersedes}"`)
    }
    if (decision.supersedes === decision.id) fail(`Decision "${decision.title}" supersedes itself`)
    for (const ref of decision.affects) {
      const resolved =
        (ref.type === 'section' && sectionById.has(ref.id)) ||
        (ref.type === 'feature' && featureById.has(ref.id)) ||
        (ref.type === 'note' && noteById.has(ref.id)) ||
        (ref.type === 'milestone' && milestoneById.has(ref.id))
      if (!resolved) fail(`Decision "${decision.title}" affects unresolved ${ref.type} "${ref.id}"`)
    }
  }

  // ---- milestones: linkedFeatureIds resolve ------------------------------
  for (const milestone of graph.milestones) {
    for (const featureRef of milestone.linkedFeatureIds) {
      if (!featureById.has(featureRef)) {
        fail(`Milestone "${milestone.name}" links to unknown feature "${featureRef}"`)
      }
    }
  }

  // ---- sections: block references resolve --------------------------------
  for (const section of graph.sections) {
    for (const block of section.blocks) {
      if (block.type === 'loop' && !loopById.has(block.loopId)) {
        fail(`Section "${section.title}" has a loop block referencing unknown loop "${block.loopId}"`)
      }
      if (block.type === 'featureCards') {
        for (const featureRef of block.featureIds) {
          if (!featureById.has(featureRef)) {
            fail(`Section "${section.title}" featureCards block references unknown feature "${featureRef}"`)
          }
        }
      }
      if (block.type === 'image' && !assetById.has(block.assetId)) {
        fail(`Section "${section.title}" image block references unknown asset "${block.assetId}"`)
      }
      if (block.type === 'gallery') {
        for (const assetRef of block.assetIds) {
          if (!assetById.has(assetRef)) {
            fail(`Section "${section.title}" gallery block references unknown asset "${assetRef}"`)
          }
        }
      }
      if (block.type === 'annotatedMap' && !assetById.has(block.assetId)) {
        fail(`Section "${section.title}" annotatedMap block references unknown asset "${block.assetId}"`)
      }
      if (block.type === 'flowMap') {
        const nodeIds = new Set(block.nodes.map((n) => n.id))
        if (nodeIds.size !== block.nodes.length) fail(`Section "${section.title}" flowMap block has duplicate node ids`)
        for (const edge of block.edges) {
          if (!nodeIds.has(edge.from)) fail(`Section "${section.title}" flowMap block has an edge from unknown node "${edge.from}"`)
          if (!nodeIds.has(edge.to)) fail(`Section "${section.title}" flowMap block has an edge to unknown node "${edge.to}"`)
        }
      }
    }
    for (const ownerId of section.owners) {
      if (!collaboratorById.has(ownerId)) fail(`Section "${section.title}" has unknown owner "${ownerId}"`)
    }
  }

  // ---- changelog: targets resolve per declared type ----------------------
  const resolversByType: Record<string, (id: string) => boolean> = {
    project: (id) => id === projectId,
    section: (id) => sectionById.has(id),
    feature: (id) => featureById.has(id),
    note: (id) => noteById.has(id),
    milestone: (id) => milestoneById.has(id),
    decision: (id) => decisionById.has(id),
    tag: (id) => tagByPath.has(id) || graph.tags.some((t) => t.id === id),
    collaborator: (id) => collaboratorById.has(id),
    'scope-entry': (id) => scopeEntryById.has(id),
    loop: (id) => loopById.has(id),
    pillar: (id) => pillarById.has(id),
    'non-goal': (id) => nonGoalById.has(id),
    'production-asset': (id) => graph.productionAssets.some((a) => a.id === id),
    level: (id) => graph.levels.some((l) => l.id === id),
  }
  for (const entry of graph.changeEntries) {
    const resolver = resolversByType[entry.target.type]
    if (!resolver || !resolver(entry.target.id)) {
      fail(`Change entry references unresolved ${entry.target.type} "${entry.target.id}"`)
    }
  }

  // ---- everything belongs to the one seeded project ----------------------
  const projectScoped: Array<{ projectId: string }> = [
    ...graph.pillars,
    ...graph.nonGoals,
    ...graph.loops,
    ...graph.sections,
    ...graph.featureCards,
    ...graph.decisions,
    ...graph.logicNotes,
    ...graph.milestones,
    ...graph.collaborators,
    ...graph.changeEntries,
    ...graph.assets,
    ...graph.productionAssets,
    ...graph.levels,
  ]
  for (const item of projectScoped) {
    if (item.projectId !== projectId) fail(`Record with projectId "${item.projectId}" does not match the seeded project`)
  }

  return { ok: errors.length === 0, errors }
}
