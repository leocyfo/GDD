import { describe, expect, it } from 'vitest'
import { recomputeVaultLinks } from '../data/backlinks'
import { GddDatabase } from '../data/dexie/db'
import { createDecision } from '../data/newDecision'
import { createFeatureCard } from '../data/newFeatureCard'
import { createMilestone } from '../data/newMilestone'
import { DexieRepository } from '../data/repository/DexieRepository'

async function freshRepo(name: string) {
  return new DexieRepository(new GddDatabase(name))
}

describe('createFeatureCard', () => {
  it('creates a feature card with idea status and no links', async () => {
    const repo = await freshRepo('test-edit-helpers-1')
    const card = await createFeatureCard(repo, { projectId: 'p1', name: 'New Ability' })
    expect(card.status).toBe('idea')
    expect(card.risk).toBe('low')
    expect(card.dependencies).toEqual([])
    expect(card.logicNoteIds).toEqual([])
    expect(await repo.featureCards.get(card.id)).toEqual(card)
  })
})

describe('createDecision', () => {
  it('creates a decision with unknown sync state and no supersession', async () => {
    const repo = await freshRepo('test-edit-helpers-2')
    const decision = await createDecision(repo, { projectId: 'p1', title: 'Cut the thing' })
    expect(decision.syncState).toBe('unknown')
    expect(decision.supersedes).toBeNull()
    expect(decision.affects).toEqual([])
    expect(decision.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

describe('createMilestone', () => {
  it('creates an upcoming milestone with no criteria or linked features', async () => {
    const repo = await freshRepo('test-edit-helpers-3')
    const milestone = await createMilestone(repo, { projectId: 'p1', name: 'Alpha' })
    expect(milestone.state).toBe('upcoming')
    expect(milestone.exitCriteria).toEqual([])
    expect(milestone.linkedFeatureIds).toEqual([])
  })
})

describe('recomputeVaultLinks', () => {
  it('extracts outbound links from logic/extras text and computes matching inbound', async () => {
    const repo = await freshRepo('test-edit-helpers-4')
    const now = new Date().toISOString()
    await repo.projects.bulkPut([
      { id: 'p1', name: 'P', version: '0.1.0', status: 'draft', editPolicy: 'everyone', intro: '', createdAt: now, updatedAt: now, updatedBy: 'seed' },
    ])
    const note = (id: string, logic: string) => ({
      id,
      projectId: 'p1',
      folderPath: 'GAME LOGIC/PLAYER',
      title: id,
      scope: 'global' as const,
      kind: 'variable' as const,
      valueType: 'bool' as const,
      values: '',
      logic,
      inbound: [],
      outbound: [],
      tags: [],
      extras: '',
      engineRef: null,
      createdAt: now,
      updatedAt: now,
      updatedBy: 'seed',
    })
    await repo.logicNotes.bulkPut([
      note('a', 'Links to [[b]] and [[c]].'),
      note('b', 'No links here.'),
      note('c', 'Links back to [[a]].'),
    ])

    await recomputeVaultLinks(repo, 'p1')

    const a = await repo.logicNotes.get('a')
    const b = await repo.logicNotes.get('b')
    const c = await repo.logicNotes.get('c')

    expect(a?.outbound.sort()).toEqual(['b', 'c'])
    expect(b?.inbound).toEqual(['a'])
    expect(c?.inbound).toEqual(['a'])
    expect(c?.outbound).toEqual(['a'])
    expect(a?.inbound).toEqual(['c'])
  })

  it('is idempotent — does not rewrite notes whose links are already correct', async () => {
    const repo = await freshRepo('test-edit-helpers-5')
    const now = new Date().toISOString()
    await repo.projects.bulkPut([
      { id: 'p1', name: 'P', version: '0.1.0', status: 'draft', editPolicy: 'everyone', intro: '', createdAt: now, updatedAt: now, updatedBy: 'seed' },
    ])
    await repo.logicNotes.bulkPut([
      {
        id: 'a',
        projectId: 'p1',
        folderPath: 'GAME LOGIC/PLAYER',
        title: 'a',
        scope: 'global',
        kind: 'variable',
        valueType: 'bool',
        values: '',
        logic: 'no links',
        inbound: [],
        outbound: [],
        tags: [],
        extras: '',
        engineRef: null,
        createdAt: now,
        updatedAt: now,
        updatedBy: 'seed',
      },
    ])
    const before = await repo.logicNotes.get('a')
    await recomputeVaultLinks(repo, 'p1')
    const after = await repo.logicNotes.get('a')
    // updatedAt must be untouched since nothing about the links changed.
    expect(after?.updatedAt).toBe(before?.updatedAt)
  })
})
