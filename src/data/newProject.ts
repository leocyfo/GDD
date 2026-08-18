import { SECTION_DEFINITIONS } from './sectionDefinitions'
import type { Project } from './types/entities'
import type { Repository } from './repository/types'

/**
 * The real (non-seed) "create a new game document" flow — the Hub's
 * "New game document" action calls this. Every project, seeded or created
 * here, gets exactly the 10 structural sections from `SECTION_DEFINITIONS`;
 * unlike the demo project, a fresh one starts genuinely empty (no blocks,
 * no owners) rather than pre-filled — an empty section is a real, honest
 * empty state (see `EmptyDocument`), not a placeholder pretending to be
 * content.
 */
export async function createNewProject(repo: Repository, name: string, createdBy = 'you'): Promise<Project> {
  const project = await repo.projects.create({
    name,
    version: '0.1.0',
    status: 'draft',
    editPolicy: 'everyone',
    intro: '',
    updatedBy: createdBy,
  })

  await Promise.all(
    SECTION_DEFINITIONS.map((definition) =>
      repo.sections.create({
        projectId: project.id,
        index: definition.index,
        key: definition.key,
        title: definition.title,
        icon: definition.icon,
        blocks: [],
        owners: [],
        freshness: 'fresh',
        reviewedAt: null,
        updatedBy: createdBy,
      }),
    ),
  )

  return project
}
