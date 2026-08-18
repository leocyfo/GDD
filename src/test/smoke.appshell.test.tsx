import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from '../App'

// Vitest's default per-test timeout (5s) is tight once you stack a real
// IndexedDB seed + several independent async repository queries each
// resolving on their own tick — 20s gives the boot sequence room without
// masking a genuine hang.
const TEST_TIMEOUT = 20_000

/** Boots the app and gets past the Hub into the seeded demo project. The
 * Hub is the app's landing screen (see `hub.test.tsx` for its own
 * coverage) — everything below tests the workspace once a document is
 * open, so this just clears that gate. If an earlier test in this file
 * already selected a project, the workspace store's persisted choice
 * (shared across `render(<App/>)` calls within one test file) skips
 * straight past the Hub, which this also handles. */
async function openDemoProjectFromHub() {
  const user = userEvent.setup()
  render(<App />)

  try {
    await screen.findByText('Game Design Documents', {}, { timeout: 3_000 })
    // Anchored to the start: the card's "open" button and its "Delete
    // Stormline" icon button both have "Stormline" in their accessible
    // name, but only the open button's name *starts* with it.
    const card = await screen.findByRole('button', { name: /^Stormline/ })
    await user.click(card)
  } catch {
    // Already inside a project — a prior test in this file selected one.
  }

  // Mode-agnostic signal that we're inside the AppShell — present whether
  // the sidebar is currently showing GDD sections or the vault tree.
  await screen.findByText('Document Status', {}, { timeout: 10_000 })

  // A previous test in this file may have left the sidebar in Vault mode
  // (this store also persists across `render`s within one file) — switch
  // back so "Overview" and the numbered sections are there to find.
  const gddTab = screen.queryByRole('tab', { name: 'GDD' })
  if (gddTab && gddTab.getAttribute('aria-selected') !== 'true') {
    await user.click(gddTab)
  }

  await screen.findByRole('button', { name: /^Overview$/ }, { timeout: 10_000 })
}

describe('App shell — smoke test', () => {
  it(
    'boots, seeds the demo project, and renders a working sidebar',
    async () => {
      await openDemoProjectFromHub()

      expect(await screen.findByRole('button', { name: /1\.\s*Core Concept/ })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /2\.\s*Gameplay & Systems/ })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /10\.\s*Appendix/ })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Changelog' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Team' })).toBeInTheDocument()
      expect(screen.getByText('Document Status')).toBeInTheDocument()
      // The project's `status` field is stored lowercase ('active') and
      // only reads capitalized visually, via CSS `capitalize` — match the
      // real text content, not the rendered appearance.
      expect(await screen.findByText('active')).toBeInTheDocument()
    },
    TEST_TIMEOUT,
  )

  it(
    'opens a section from the sidebar and shows its real seeded content',
    async () => {
      const user = userEvent.setup()
      await openDemoProjectFromHub()

      const gameplayNavItem = await screen.findByRole('button', { name: /2\.\s*Gameplay & Systems/ })
      await user.click(gameplayNavItem)

      // Real seeded block content, not a placeholder. The callout's title
      // is a live-editable input now, not static text — RTL reads an
      // input's value via `getByDisplayValue`, not `getByText`. "Drop" is
      // deliberately in two diagrams here (the Core Loop and the Match
      // Flow below it) — `findAllByText` instead of `findByText`. Every
      // flow map node label is also repeated inside the edge editor's
      // "From"/"To" `<option>`s below it, so a plain node label like
      // "Final Circle" is ambiguous too — the branch edge labels aren't,
      // and asserting on one doubles as proof the flow map really
      // branches (Match End -> Victory Royale / Elimination), not just a
      // flat chain of boxes.
      expect(await screen.findAllByText('Drop')).not.toHaveLength(0)
      expect(screen.getByText('Loot')).toBeInTheDocument()
      expect(screen.getByText('last squad standing')).toBeInTheDocument()
      expect(screen.getByText('squad wiped')).toBeInTheDocument()
      expect(screen.getByDisplayValue(/Squad Revive & Reboot Van is in-build-diverged/i)).toBeInTheDocument()
    },
    TEST_TIMEOUT,
  )

  it(
    'switches to Vault mode and opens a real logic note',
    async () => {
      const user = userEvent.setup()
      await openDemoProjectFromHub()

      await user.click(screen.getByRole('tab', { name: 'Vault' }))

      const gameLogicFolder = await screen.findByText('GAME LOGIC')
      await user.click(gameLogicFolder)
      const playerFolder = await screen.findByText('PLAYER')
      await user.click(playerFolder)
      const note = await screen.findByText('playerHealth')
      await user.click(note)

      expect(await screen.findByText('Scope')).toBeInTheDocument()
      expect(screen.getByText('Logic')).toBeInTheDocument()
      expect(screen.getByText(/Inbound Link/)).toBeInTheDocument()
    },
    TEST_TIMEOUT,
  )

  it(
    'the sidebar project selector returns to the Hub',
    async () => {
      const user = userEvent.setup()
      await openDemoProjectFromHub()

      await user.click(screen.getByRole('button', { name: 'Back to all documents' }))
      expect(await screen.findByText('Game Design Documents')).toBeInTheDocument()
    },
    TEST_TIMEOUT,
  )
})
