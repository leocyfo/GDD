import { describe, expect, it } from 'vitest'
import { GddDatabase } from '../data/dexie/db'
import { DexieRepository } from '../data/repository/DexieRepository'
import { ensureSeeded } from '../data/seed'

describe('ensureSeeded', () => {
  it('persists the full demo dataset and marks the repository seeded', async () => {
    const repo = new DexieRepository(new GddDatabase('test-ensure-seeded-1'))

    expect(await repo.meta.isSeeded()).toBe(false)
    await ensureSeeded(repo)
    expect(await repo.meta.isSeeded()).toBe(true)

    expect(await repo.featureCards.list()).toHaveLength(12)
    const notes = await repo.logicNotes.list()
    expect(notes.length).toBeGreaterThanOrEqual(40)
    expect(notes.length).toBeLessThanOrEqual(60)
    expect(await repo.decisions.list()).toHaveLength(8)
    expect(await repo.milestones.list()).toHaveLength(4)
    expect(await repo.collaborators.list()).toHaveLength(5)
    expect(await repo.changeEntries.list()).toHaveLength(30)
  })

  it('is idempotent — calling twice does not duplicate rows (simulates a reload)', async () => {
    const repo = new DexieRepository(new GddDatabase('test-ensure-seeded-2'))

    await ensureSeeded(repo)
    const firstCount = (await repo.logicNotes.list()).length

    await ensureSeeded(repo)
    const secondCount = (await repo.logicNotes.list()).length

    expect(secondCount).toBe(firstCount)
  })
})
