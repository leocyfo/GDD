import { describe, expect, it, beforeEach } from 'vitest'
import { GddDatabase } from '../data/dexie/db'
import { DexieRepository } from '../data/repository/DexieRepository'
import type { Repository } from '../data/repository/types'

let repo: Repository
let dbCounter = 0

beforeEach(() => {
  // A fresh database per test, isolated by name, so tests never see
  // leftover rows from one another.
  dbCounter += 1
  repo = new DexieRepository(new GddDatabase(`test-db-${dbCounter}`))
})

describe('DexieRepository — generic CRUD', () => {
  it('creates a record and assigns id/createdAt/updatedAt', async () => {
    const project = await repo.projects.create({
      name: 'Test Project',
      version: '0.1.0',
      status: 'draft',
      editPolicy: 'everyone',
      intro: 'intro text',
      updatedBy: 'tester',
    })

    expect(project.id).toBeTruthy()
    expect(project.createdAt).toBeTruthy()
    expect(project.updatedAt).toBeTruthy()

    const fetched = await repo.projects.get(project.id)
    expect(fetched).toEqual(project)
  })

  it('updates a record and bumps updatedAt without touching createdAt', async () => {
    const project = await repo.projects.create({
      name: 'Test Project',
      version: '0.1.0',
      status: 'draft',
      editPolicy: 'everyone',
      intro: 'intro text',
      updatedBy: 'tester',
    })

    const updated = await repo.projects.update(project.id, { status: 'active' })
    expect(updated.status).toBe('active')
    expect(updated.createdAt).toBe(project.createdAt)
    expect(updated.id).toBe(project.id)
  })

  it('throws when updating a record that does not exist', async () => {
    await expect(repo.projects.update('nope', { status: 'active' })).rejects.toThrow()
  })

  it('deletes a record', async () => {
    const project = await repo.projects.create({
      name: 'Test Project',
      version: '0.1.0',
      status: 'draft',
      editPolicy: 'everyone',
      intro: 'intro text',
      updatedBy: 'tester',
    })
    await repo.projects.delete(project.id)
    expect(await repo.projects.get(project.id)).toBeUndefined()
  })

  it('bulkPut writes fully-formed records as-is (the seeding path)', async () => {
    const now = new Date().toISOString()
    await repo.projects.bulkPut([
      {
        id: 'p1',
        name: 'Bulk Project',
        version: '1.0.0',
        status: 'active',
        editPolicy: 'leads',
        intro: 'seeded',
        createdAt: now,
        updatedAt: now,
        updatedBy: 'seed',
      },
    ])
    const fetched = await repo.projects.get('p1')
    expect(fetched?.name).toBe('Bulk Project')
  })

  it('list() with no filter returns everything, with a filter narrows', async () => {
    await repo.featureCards.bulkPut([
      featureCard('f1', 'p1', 'idea'),
      featureCard('f2', 'p1', 'shipped'),
      featureCard('f3', 'p1', 'idea'),
    ])
    expect(await repo.featureCards.list()).toHaveLength(3)
    expect(await repo.featureCards.list({ status: 'idea' })).toHaveLength(2)
  })
})

describe('DexieRepository — domain query methods', () => {
  it('sections.listByProject sorts by index', async () => {
    await repo.sections.bulkPut([
      section('s2', 'p1', 2, 'gameplay'),
      section('s1', 'p1', 1, 'core-concept'),
    ])
    const list = await repo.sections.listByProject('p1')
    expect(list.map((s) => s.index)).toEqual([1, 2])
  })

  it('logicNotes.listByTag finds notes through the multi-entry tag index', async () => {
    await repo.logicNotes.bulkPut([
      logicNote('n1', ['type/switch', 'status/wip']),
      logicNote('n2', ['type/variable']),
      logicNote('n3', ['status/wip']),
    ])
    const wip = await repo.logicNotes.listByTag('status/wip')
    expect(wip.map((n) => n.id).sort()).toEqual(['n1', 'n3'])
  })

  it('logicNotes.getBacklinks resolves inbound ids to full notes', async () => {
    const a = logicNote('a', [])
    const b = { ...logicNote('b', []), inbound: ['a'] }
    await repo.logicNotes.bulkPut([a, b])
    const backlinks = await repo.logicNotes.getBacklinks('b')
    expect(backlinks).toHaveLength(1)
    expect(backlinks[0].id).toBe('a')
  })

  it('decisions.listAffecting finds decisions referencing a given target', async () => {
    const now = new Date().toISOString()
    await repo.decisions.bulkPut([
      {
        id: 'd1',
        projectId: 'p1',
        title: 'Cut the ladder climb',
        date: '2026-01-01',
        decidedBy: ['lead'],
        context: 'ctx',
        choice: 'cut it',
        alternatives: 'keep it',
        consequences: 'less scope',
        supersedes: null,
        affects: [{ type: 'feature', id: 'f1' }],
        syncState: 'matches-build',
        createdAt: now,
        updatedAt: now,
        updatedBy: 'seed',
      },
    ])
    const affecting = await repo.decisions.listAffecting('feature', 'f1')
    expect(affecting).toHaveLength(1)
    expect(affecting[0].id).toBe('d1')
  })

  it('meta.isSeeded is false until markSeeded is called', async () => {
    expect(await repo.meta.isSeeded()).toBe(false)
    await repo.meta.markSeeded()
    expect(await repo.meta.isSeeded()).toBe(true)
  })
})

function featureCard(id: string, projectId: string, status: 'idea' | 'shipped') {
  const now = new Date().toISOString()
  return {
    id,
    projectId,
    name: `Feature ${id}`,
    playerPromise: 'promise',
    summary: 'summary',
    logic: 'logic',
    dependencies: [],
    logicNoteIds: [],
    status,
    owner: 'someone',
    risk: 'low' as const,
    createdAt: now,
    updatedAt: now,
    updatedBy: 'seed',
  }
}

function section(id: string, projectId: string, index: number, key: 'core-concept' | 'gameplay') {
  const now = new Date().toISOString()
  return {
    id,
    projectId,
    index,
    key,
    title: key,
    icon: 'lightbulb',
    blocks: [],
    owners: [],
    freshness: 'fresh' as const,
    reviewedAt: null,
    createdAt: now,
    updatedAt: now,
    updatedBy: 'seed',
  }
}

function logicNote(id: string, tags: string[]) {
  const now = new Date().toISOString()
  return {
    id,
    projectId: 'p1',
    folderPath: 'GAME LOGIC/PLAYER',
    title: id,
    scope: 'global' as const,
    kind: 'variable' as const,
    valueType: 'bool' as const,
    values: 'true/false, default false',
    logic: 'logic text',
    inbound: [],
    outbound: [],
    tags,
    extras: '',
    engineRef: null,
    createdAt: now,
    updatedAt: now,
    updatedBy: 'seed',
  }
}
