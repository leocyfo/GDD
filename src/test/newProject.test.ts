import { describe, expect, it } from 'vitest'
import { GddDatabase } from '../data/dexie/db'
import { createNewProject } from '../data/newProject'
import { DexieRepository } from '../data/repository/DexieRepository'
import { SECTION_DEFINITIONS } from '../data/sectionDefinitions'

describe('createNewProject', () => {
  it('creates a draft project with no demo content', async () => {
    const repo = new DexieRepository(new GddDatabase('test-new-project-1'))
    const project = await createNewProject(repo, 'Lighthouse Keeper')

    expect(project.name).toBe('Lighthouse Keeper')
    expect(project.status).toBe('draft')
    expect(project.editPolicy).toBe('everyone')
    expect(project.intro).toBe('')
    expect(project.id).toBeTruthy()
  })

  it('provisions exactly the 10 structural sections, empty and fresh', async () => {
    const repo = new DexieRepository(new GddDatabase('test-new-project-2'))
    const project = await createNewProject(repo, 'Lighthouse Keeper')

    const sections = await repo.sections.listByProject(project.id)
    expect(sections).toHaveLength(10)

    const byKey = new Map(sections.map((s) => [s.key, s]))
    for (const definition of SECTION_DEFINITIONS) {
      const section = byKey.get(definition.key)
      expect(section, `missing section for key "${definition.key}"`).toBeDefined()
      expect(section?.index).toBe(definition.index)
      expect(section?.title).toBe(definition.title)
      expect(section?.icon).toBe(definition.icon)
      expect(section?.blocks).toEqual([])
      expect(section?.owners).toEqual([])
      expect(section?.freshness).toBe('fresh')
      expect(section?.projectId).toBe(project.id)
    }

    // Indexes are 1..10 with no gaps or duplicates.
    expect(sections.map((s) => s.index).sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  })

  it('never collides with another project\'s section ids', async () => {
    const repo = new DexieRepository(new GddDatabase('test-new-project-3'))
    const projectA = await createNewProject(repo, 'Project A')
    const projectB = await createNewProject(repo, 'Project B')

    const sectionsA = await repo.sections.listByProject(projectA.id)
    const sectionsB = await repo.sections.listByProject(projectB.id)

    const idsA = new Set(sectionsA.map((s) => s.id))
    const idsB = new Set(sectionsB.map((s) => s.id))
    for (const id of idsA) expect(idsB.has(id)).toBe(false)

    expect(sectionsA).toHaveLength(10)
    expect(sectionsB).toHaveLength(10)
  })
})
