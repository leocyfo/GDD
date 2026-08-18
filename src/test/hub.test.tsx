import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { Hub } from '../components/hub/Hub'
import { GddDatabase } from '../data/dexie/db'
import { DexieRepository } from '../data/repository/DexieRepository'
import { RepositoryProvider } from '../data/repository/RepositoryProvider'
import { ensureSeeded } from '../data/seed'
import { useWorkspaceStore } from '../stores/useWorkspaceStore'

async function renderSeededHub(dbName: string) {
  const repo = new DexieRepository(new GddDatabase(dbName))
  await ensureSeeded(repo)
  render(
    <RepositoryProvider value={repo}>
      <Hub />
    </RepositoryProvider>,
  )
  return repo
}

describe('Hub', () => {
  // `useWorkspaceStore` is a module-level singleton persisted to
  // localStorage — reset it before each test so one test's selection can't
  // make a later test's "nothing selected yet" assumption false.
  beforeEach(() => {
    useWorkspaceStore.setState({ activeProjectId: null })
  })

  it('lists the seeded demo project and opens it on click', async () => {
    const user = userEvent.setup()
    const repo = await renderSeededHub('test-hub-1')

    // Anchored to the start: the card's "open" button and its "Delete
    // Stormline" icon button both have "Stormline" somewhere in their
    // accessible name, but only the open button's name *starts* with it.
    const card = await screen.findByRole('button', { name: /^Stormline/ }, { timeout: 5_000 })
    expect(card).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /New game document/ })).toBeInTheDocument()

    await user.click(card)

    const demoProject = (await repo.projects.list())[0]
    expect(useWorkspaceStore.getState().activeProjectId).toBe(demoProject.id)
  })

  it('creates a new document from the hub and opens it', async () => {
    const user = userEvent.setup()
    const repo = await renderSeededHub('test-hub-2')

    await user.click(await screen.findByRole('button', { name: /New game document/ }))
    const input = await screen.findByLabelText('New document name')
    await user.type(input, 'Lighthouse Keeper')
    await user.click(screen.getByRole('button', { name: 'Create' }))

    // Creation is async (real repository round-trips) — wait for the
    // workspace store to actually pick up a selection (it started `null`,
    // reset above, so any non-null value here is this test's new project).
    await waitFor(() => expect(useWorkspaceStore.getState().activeProjectId).not.toBeNull())
    const activeId = useWorkspaceStore.getState().activeProjectId

    const project = activeId ? await repo.projects.get(activeId) : undefined
    expect(project?.name).toBe('Lighthouse Keeper')
    expect(project?.status).toBe('draft')
  })
})
