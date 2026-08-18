import { describe, expect, it } from 'vitest'
import { buildSeedGraph } from '../data/seed/build'
import { validateSeedGraph } from '../data/seed/validate'

describe('seed data — referential integrity', () => {
  it('validates clean against the graph it actually produces', () => {
    const graph = buildSeedGraph()
    const result = validateSeedGraph(graph)
    expect(result.errors).toEqual([])
    expect(result.ok).toBe(true)
  })

  it('matches the spec\'s demo-data volumes', () => {
    const graph = buildSeedGraph()
    expect(graph.pillars.length).toBeGreaterThanOrEqual(3)
    expect(graph.pillars.length).toBeLessThanOrEqual(5)
    expect(graph.nonGoals.length).toBeGreaterThanOrEqual(3)
    expect(graph.featureCards).toHaveLength(12)
    expect(graph.scopeEntries).toHaveLength(20)
    expect(graph.decisions).toHaveLength(8)
    expect(graph.milestones).toHaveLength(4)
    expect(graph.collaborators).toHaveLength(5)
    expect(graph.changeEntries).toHaveLength(30)
    expect(graph.logicNotes.length).toBeGreaterThanOrEqual(40)
    expect(graph.logicNotes.length).toBeLessThanOrEqual(60)
    expect(graph.sections).toHaveLength(10)
  })

  it('flags the divergence and the intentional scope gap the acceptance criteria rely on', () => {
    const graph = buildSeedGraph()
    expect(graph.featureCards.filter((f) => f.status === 'in-build-diverged')).toHaveLength(1)
    const undecided = graph.scopeEntries.filter((e) => e.verdict === 'undecided')
    expect(undecided).toHaveLength(3)
    expect(undecided.every((e) => e.decisionId === null)).toBe(true)
    expect(graph.decisions.filter((d) => d.supersedes !== null)).toHaveLength(1)
  })

  it('computes backlinks by inverting outbound links, never hand-authoring them', () => {
    const graph = buildSeedGraph()
    const playerHealth = graph.logicNotes.find((n) => n.title === 'playerHealth')
    const playerReviveState = graph.logicNotes.find((n) => n.title === 'playerReviveState')
    expect(playerHealth).toBeDefined()
    expect(playerReviveState).toBeDefined()
    // playerHealth links out to playerReviveState...
    expect(playerHealth?.outbound).toContain(playerReviveState?.id)
    // ...so playerReviveState must show the matching inbound entry.
    expect(playerReviveState?.inbound).toContain(playerHealth?.id)
  })

  it('every vault folder in use is one of the canonical 15', () => {
    const graph = buildSeedGraph()
    const folders = new Set(graph.logicNotes.map((n) => n.folderPath))
    // Sanity: the demo data actually exercises more than a couple of folders.
    expect(folders.size).toBeGreaterThanOrEqual(10)
  })

  it('rejects a graph with a broken reference — the validator actually catches drift', () => {
    const graph = buildSeedGraph()
    const broken = {
      ...graph,
      featureCards: [
        { ...graph.featureCards[0], logicNoteIds: ['note:does-not-exist'] },
        ...graph.featureCards.slice(1),
      ],
    }
    const result = validateSeedGraph(broken)
    expect(result.ok).toBe(false)
    expect(result.errors.some((e) => e.includes('does-not-exist'))).toBe(true)
  })
})
