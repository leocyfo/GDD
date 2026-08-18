# Living GDD Hub

A "living Game Design Document" web app for indie studios: a collaborative
GDD hub (numbered sections, dashboard, decisions, milestones) fused with an
Obsidian-style "game logic vault" (linked notes, wikilinks, tags, live
queries), cross-referenced so a feature card can point at the logic notes
that implement it, and a logic note can show which decision justifies it.

**Status:** Phase 1 (Foundations) is complete, and — beyond that original
scope — the app now has real editing throughout: a multi-document **Hub**,
a rich block editor for GDD sections (TipTap, markdown shortcuts, `[[`
wikilink autocomplete), full CRUD on vault notes, feature cards, decisions,
and milestones, all with autosave and a changelog that logs itself. The
live query engine, wikilink *graph* view, and export pipeline are still
ahead — see [What's not built yet](#whats-not-built-yet).

## Stack

React 19 + TypeScript + Vite. Tailwind v4 (CSS-first `@theme`, no
`tailwind.config.js`) with every color/size driven by tokens in
[`src/styles/tokens.css`](src/styles/tokens.css) — nothing hardcoded
outside them. Zustand for UI/session state. Dexie (IndexedDB) behind a
`Repository` interface — Supabase/Postgres is a second, optional
implementation of that same interface for cloud sync (see
[Cloud sync](#cloud-sync-optional)). TipTap 3 (+ `tiptap-markdown`) for
rich text. Vitest + Testing Library + `fake-indexeddb`.

## Getting started

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # vitest run — 33 tests
npm run build    # tsc -b && vite build
npm run lint     # oxlint
```

No backend, no env vars required — by default the whole app runs offline
against IndexedDB and seeds itself with a complete demo project on first
boot. Cloud sync is opt-in on top of that; see below.

## Cloud sync (optional)

Offline/Dexie mode (the default) is a single browser's IndexedDB — nothing
syncs between devices. Configuring Supabase turns on real multi-device sync
(the same account's data, live, in every browser it's signed into) without
changing anything about how the app is used: same `Repository` interface,
same screens, same autosave. See `src/data/supabase/client.ts` for how the
app decides which mode it's in.

**Setup:**

1. Create a free project at [supabase.com](https://supabase.com).
2. In the dashboard's **SQL Editor**, run
   [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql)
   then
   [`supabase/migrations/0002_profiles_and_members.sql`](supabase/migrations/0002_profiles_and_members.sql),
   in that order — together they create every table, Row Level Security
   policy, and turn on Realtime. Read each file's own header comments
   first; they document every deliberate schema choice (text ids, quoted
   camelCase columns, the two tables — `tags`, plus the pre-existing lack
   of project-scoping on `scope_entries`/`comments` — that get slightly
   weaker isolation as a disclosed trade-off) and how project access moved
   from single-owner (0001) to real multi-member roles (0002).
3. In **Settings → API**, copy the **Project URL** and the **anon public**
   key.
4. `cp .env.example .env` and paste those two values in.
5. `npm run dev` and reload — the app now opens on a sign-in screen instead
   of straight into the Hub.
6. Create an account (email + password; if your project has email
   confirmation on, confirm via the link before signing in). On first
   sign-in, any data already sitting in this browser's local IndexedDB is
   copied up to the new cloud account automatically (`data/migrateToCloud.ts`)
   — a one-time, idempotent copy, not a merge-on-every-boot.

Click your avatar/name (Hub header, or the bottom of the sidebar inside a
project) to open the **profile** — rename yourself, set an avatar, see
every document you're connected to and your role on each, and — when a
project you own is open — invite a teammate by email or remove one. An
invite just needs their email to already have an account; it grants
`editor` (full read/write, same access level as an owner short of
managing membership or deleting the project) or `owner` on that one
project. Sign out lives here too, at the bottom.

Removing the two `VITE_SUPABASE_*` values from `.env` (or deleting the
file) drops straight back to fully-offline mode.

## Architecture

```
src/
├── data/
│   ├── types/entities.ts        # the full domain model, transcribed from spec
│   ├── vaultFolders.ts          # canonical vault folder taxonomy
│   ├── sectionDefinitions.ts    # canonical 11-section GDD structure
│   ├── scopeMatrixId.ts         # the one scope matrix's id
│   ├── newProject.ts            # real "create a document" flow (Hub uses this)
│   ├── newNote.ts / newFeatureCard.ts / newDecision.ts / newMilestone.ts
│   │                             # real "create a ___" flows for the vault
│   │                             #   and the Feature Cards/Decisions/Milestones screens
│   ├── backlinks.ts             # recomputes note in/outbound links after an edit
│   ├── changelog.ts             # logChange() — every edit writes a ChangeEntry
│   ├── dexie/db.ts              # IndexedDB schema (16 tables)
│   ├── repository/              # the Repository interface, and two implementations
│   │   ├── types.ts             #   components only ever import from here —
│   │   ├── DexieRepository.ts   #   never data/dexie directly. DexieRepository is
│   │   ├── SupabaseRepository.ts#   the offline default; SupabaseRepository is the
│   │   ├── crud.ts              #   opt-in cloud-sync backend (see Cloud sync below)
│   │   └── RepositoryProvider.tsx
│   ├── supabase/                # client.ts (isSupabaseConfigured), AuthProvider.tsx
│   │                             #   (session state), useRealtimeSync.ts,
│   │                             #   useProfile.ts / useProjectMembers.ts, types.ts
│   │                             #   (Profile/ProjectMember — Supabase-only, not
│   │                             #   part of the cross-backend Repository model)
│   ├── migrateToCloud.ts        # one-time local Dexie → Supabase copy on first sign-in
│   ├── hooks/                   # useRepoQuery + per-entity convenience hooks
│   └── seed/                    # demo dataset: build → validate → persist
├── stores/                      # Zustand: theme, nav, tabs, command palette,
│                                 #   workspace (which project is open),
│                                 #   dataVersion (see "Live data" below)
├── components/
│   ├── hub/                     # landing screen: list/open/create documents
│   ├── auth/                    # AuthScreen.tsx — email+password sign in/up
│   ├── profile/                 # ProfileButton (avatar+name trigger) + ProfileModal
│   │                             #   (rename, avatar, your documents + roles,
│   │                             #   invite/remove members, sign out)
│   ├── layout/                  # AppShell, Sidebar, TabBar, StatusBar
│   ├── command-palette/
│   ├── editor/                  # RichTextEditor (TipTap) + the wikilink extension
│   ├── documents/
│   │   ├── editableBlocks/      # the GDD section block editor + "Add block" menu
│   │   ├── blocks/              # read-only block renderers (still used inside
│   │   │                        #   the editable ones for reference-type blocks)
│   │   ├── VaultNoteView.tsx    # fully editable vault note
│   │   ├── FeatureCardsView.tsx / DecisionsView.tsx / MilestonesView.tsx
│   │   └── vault/FieldBlock.tsx # the vault's field-block chrome (see below)
│   └── common/
└── test/                        # repository CRUD, seed integrity, hub,
                                  #   editing helpers, app shell smoke
```

### The Repository pattern

Every screen reads persisted data through the `Repository` interface
(`src/data/repository/types.ts`), never through Dexie directly. `DexieRepository`
is the only implementation today; a Postgres/REST backend would be a second
implementation behind the same interface, requiring no component changes.

### The Hub — multiple documents

`App.tsx` renders `<Hub/>` when no project is selected (`useWorkspaceStore.activeProjectId`
is `null`) and `<AppShell/>` once one is. The Hub lists every `Project` in the
repository as a card (name, status, version, last-updated) and offers
**New game document**, which calls `createNewProject` — it creates the
`Project` record plus its 11 structural sections (empty, `fresh`), using the
same `SECTION_DEFINITIONS` the demo seed reads from, so the two can never
disagree about what a GDD's section list looks like. Opening a *different*
project clears the tab bar (tabs belong to whichever project was active when
they were opened); re-opening the same one leaves it alone. The sidebar's
project name/compass mark (`ProjectSelector`) is the way back to the Hub.
`activeProjectId` is persisted, so a returning visit resumes in the same
document rather than always landing back on the Hub.

### Editing — the app you work *in*, not just read

Every editable field follows the same pattern: local state for instant
typing feedback → `useAutosave` (`src/lib/useAutosave.ts`) debounces a save
~700ms after the user pauses, and flushes immediately on blur → a
`SaveIndicator` shows pending/saving/saved/error so autosave is never a
silent guess. Every successful save also calls `logChange` (writes a real
`ChangeEntry`, versioned via the existing `versionBumpForTarget` rule) and
`notifyDataChanged()`.

- **Vault notes** (`VaultNoteView.tsx`) — every field is editable: Scope/Type
  dropdowns, Values/Extras text, Logic as full rich text, Tags as an
  add/remove pill list. Inbound/Outbound/Matching-Tags stay computed and
  read-only, as they should. The vault tree's per-folder `+` creates a new
  note from the template.
- **GDD sections** (`editableBlocks/`) — `EditableBlockList` owns a section's
  `blocks` array: per-type editors for all 14 block kinds, an "Add block"
  menu (the spec's `/`-menu, as an explicit button + popover rather than
  intercepting a keystroke — same outcome), and up/down/delete controls on
  every block. Reference-type blocks (loop, feature cards, embedded note,
  scope matrix) show the real read-view preview *and* a picker to change
  what they point at, so a section that already references something still
  reads like a real page, not a bare form.
- **Feature Cards / Decisions / Milestones** — new dedicated screens (secondary
  nav, alongside Changelog/Team) with full CRUD: every field editable,
  dependency/logic-note/decider/linked-feature pickers, "create new" forms.
  These didn't have screens of their own yet in Phase 1's plan — the spec
  describes them as their own top-level views, so that's what they got.

**The rich text editor** (`components/editor/RichTextEditor.tsx`) wraps
TipTap + `tiptap-markdown`: type `**bold**`, `# heading`, `- list` and it
formats live; the stored value round-trips to plain markdown (matching
`Block.markdown: string`), not HTML or a proprietary format. **Wikilinks**
(`components/editor/wikilinkExtension.ts`) are a custom TipTap node built on
`@tiptap/extension-mention` — typing `[[` opens a suggestion popup over
every note and section title (`useLinkableItems`), picking one inserts a
real clickable token, and it serializes back to `[[Title]]` markdown via a
custom `storage.markdown.serialize` on the node (not a guess — read from
`tiptap-markdown`'s own source to get this right). Saving a note's Logic or
Extras re-runs `recomputeVaultLinks`, which rebuilds *every* note's
`outbound` from its own text and `inbound` by inverting that graph — the
same rule the seed data uses, so backlinks can never drift by hand-editing.
One honest gap: this only makes wikilinks *typed through the `[[` menu*
into live tokens — pre-existing `[[Title]]` text loaded from storage (e.g.
the seeded demo notes) still displays as plain text inside the editor until
re-typed; the read-only `InlineMarkdown` renderer is what makes those
clickable outside the editor.

### Live data without a real cache

`useRepoQuery` (every data hook is built on it) also subscribes to
`useDataVersion`, a single counter any successful mutation bumps
(`notifyDataChanged()`). Every mounted query anywhere in the app quietly
refetches when it changes — no manual "tell the sidebar to update" wiring
per feature. The loading skeleton only shows on a component's *first* fetch
(`useRepoQuery` tracks that), so a background revalidation after an edit
elsewhere never flashes a skeleton over data that's still perfectly good.
Simple, and correct at this dataset's size (a few hundred rows) — a real
per-entity cache would be the move if that stops being true.

### Seed data

`ensureSeeded(repo)` runs once at boot (`App.tsx`), idempotently: builds the
full demo graph in memory (`buildSeedGraph`), validates every cross-reference
(`validateSeedGraph` — dangling ids, orphaned folders, asymmetric backlinks,
supersede cycles, etc.), then persists it. The same `validateSeedGraph`
function is exercised directly in `seed.integrity.test.ts`, so "tested" and
"enforced at runtime" can never drift apart. A reload never re-seeds or
duplicates rows — `repo.meta.isSeeded()` guards it.

The demo project — **Stormline**, a building-first battle royale — ships
with 4 pillars, 3 non-goals, a 4-node core loop (plus a meta and a session
loop), 8 systems, 12 feature cards (including the flagship
`in-build-diverged` Squad Revive & Reboot Van story), a 20-entry scope
matrix (3 intentionally `undecided`), 8 decisions (one supersedes another),
4 milestones, 5 collaborators, 53 cross-linked logic notes across all 15
vault folders, and 30 changelog entries spanning roughly five months.

### The vault's field-block design (the deliberate aesthetic risk)

Every `LogicNote` field renders as its own bracketed panel with a label tag
straddling the top border — like a schematic callout, not a form row (see
`src/components/documents/vault/FieldBlock.tsx`). It's meant to read as
*labeled equipment*: this is inspectable machinery (variables, edge cases,
links), not prose. Each panel folds independently. The rest of the app stays
deliberately disciplined — one accent color, one type scale, no other
flourishes — so this is the one place visual risk was spent.

### Design tokens

Two palettes in `src/styles/tokens.css`: the dark default is sourced verbatim
from the validated Overview mockup; the light palette is a warm-parchment
build around the same gold accent, not a gray inversion. Both map into
Tailwind's `@theme inline` block in `src/index.css`, so every utility class
(`bg-app`, `text-text2`, `border-border-hover`, `shadow-card`, the whole
`text-2xs`…`text-display` scale) resolves back to a token — there is nothing
else to reach for.

## Verification

- `npm run dev`, open the app — lands on the **Hub**, listing the seeded
  "Stormline" demo document plus a "New game document" action.
- Click the demo card — AppShell opens with Overview + all 10 numbered
  sections + Changelog/Team + Feature Cards/Decisions/Milestones/Scope
  Matrix + Document Status.
- Click "New game document" — a brand-new project (status `draft`) with all
  10 sections present but genuinely empty ("Nothing here yet"). Open one and
  use "Add block" to actually write it.
- On that same brand-new project: add a pillar and a non-goal on Overview,
  invite a teammate, create a gameplay loop with a couple of steps, and
  upload an image into a section's Image block — every one of these starts
  from zero on a fresh project, not just editable on the seeded demo.
- Open a vault note — edit any field, including typing `[[` in Logic to link
  another note or section; reload and confirm it persisted, including the
  recomputed backlinks.
- Open a GDD section — edit the prose live (markdown shortcuts format as you
  type), reorder/delete a block, add a new one from the menu.
- Open Feature Cards / Decisions / Milestones — edit any field, create a new
  one; every save shows up in Changelog.
- All of the above confirmed via a headless-browser pass across several
  scripted flows with **zero console errors**: Hub → create → empty section →
  vault note editing incl. wikilink insertion → section block editing →
  Feature Cards/Decisions/Milestones editing and creation → reload
  persistence checks throughout, plus the earlier dark/light/375px/keyboard
  pass.
- `npm test` — 33 tests green: repository CRUD round-trips, seed
  referential-integrity checks (incl. a deliberately-broken graph to confirm
  the validator catches drift), Hub behavior, `createNewProject`'s section
  provisioning, the new create-helpers and `recomputeVaultLinks` (incl. an
  idempotency check), and an app-shell smoke test that boots the real app
  against `fake-indexeddb`.

## What's not built yet

- **Query engine** — `query` blocks store their expression as written and
  say so; nothing evaluates them live yet.
- **Note graph view** — the vault has folders, search-free navigation, and
  full backlink tracking, but no visual node graph.
- **Full-text search** — no MiniSearch/Fuse index yet; navigation is
  folder/section-based.
- **Exports/imports** — no Markdown/PDF/JSON export or Markdown-with-frontmatter
  import.
- **Tag browser** — tags are editable per-note (add/remove pills) but there's
  no dedicated tree/rename/merge screen; `Tag` records also aren't
  project-scoped in the spec's data model, which a real tag browser will
  need to fix.
- **Table blocks** are plain HTML grids (no cell merging, no rich text per
  cell) — deliberately, to keep scope sane.
- **Bundle size** — TipTap pushes the production JS bundle past Vite's 500kB
  chunk-size warning threshold; harmless today, but a candidate for
  code-splitting (`import()` the editor lazily) if it starts to matter.
  `mermaid` (see below) already does this — dynamically `import()`ed in
  `useMermaidRender.ts` into its own chunk, fetched only once a `diagram`
  block actually renders, not on every page load.

## GDD template alignment

Checked against two outside references on how a GDD should be structured —
[allo.io's template](https://allo.io/blog/fr/game-design-document-template-fr/)
(Vision & Pillars, Gameplay Loop, Feature Cards, Scope Matrix, Decision
Journal & Sync Status) and
[GitBook's writing guide](https://www.gitbook.com/blog/how-to-write-a-game-design-document)
(Vision, Core Loop, Systems, Content, UX/UI, Production & Go-to-Market).
Everything both call for was already covered except two real UI gaps, now
closed: **decisions didn't show what they affect** even though
`Decision.affects` was already seeded (`DecisionsView.tsx` now renders it as
linkable chips), and **the scope matrix had no edit UI or guard rail** — the
type's own doc comment said "enforced at the UI layer in a later phase";
that phase is `ScopeMatrixBlockEditor` now, which refuses to mark an item
`in`/`out` without a linked decision or evidence URL. A later navigation
pass (see below) also promoted the scope matrix from a block buried inside
Constraints to its own top-level screen — both articles name it as the
single most important discipline in a living GDD, on par with Feature
Cards and Decisions, and it reads that way now.

Deliberately *not* built from this pass: a dedicated Risk Register entity
(risk is already visible via `callout` blocks with `variant: 'risk'`, which
is enough signal for the one team-visible risk in the seed data). Structured
`Pillar`/`NonGoal` records *did* later get their own editor — see "Full CRUD
pass" below; the reasoning that shipped them isn't the reasoning that
originally deferred them.

## Navigation cleanup

Three changes from an app-wide audit of the sidebar/section structure:

- **"Gameplay Mechanics" and "Systems" merged** into one "Gameplay &
  Systems" section — both answered "how does the game play?" and read as
  near-duplicates in the sidebar.
- **The "Milestones" section is now "Roadmap"** — it carried the same name
  as the dedicated Milestones screen while showing different, thinner
  content (a one-line summary vs. real exit-criteria data), which read as
  a bug. The section now carries the *why* behind the timeline; the screen
  stays the structured *what/when*.
- **Scope Matrix got its own top-level screen** (`ScopeMatrixView.tsx`,
  reusing `ScopeEntryRow`/`NewScopeEntryForm` from the block editor rather
  than forking them) instead of living only as a block inside Constraints.

Sections went from 11 to 10 as a result — `SECTION_DEFINITIONS` is the
single source of truth for both the seed and `createNewProject`, so a
freshly-created project picks up the new structure automatically.

## Full CRUD pass

The repository layer (`data/repository/types.ts`) always had real
create/update/delete for every entity — `Pillar`, `NonGoal`, `Loop`,
`Collaborator`, `Asset`, all of it. What was missing was UI wired to call
it: several screens only ever *displayed* seeded data, which meant a
brand-new project (`createNewProject` — genuinely empty, no seed) had whole
sections of the app with no way to ever put anything in them. Closed this
pass:

- **Pillars & Non-goals** (`overview/PillarsPanel.tsx`,
  `overview/NonGoalsPanel.tsx`) — add/edit/reorder/delete, inline on
  Overview, in the same cards that used to just render a static list.
- **Project identity** — the project's name, pitch/intro, and status are
  now editable directly on Overview (`OverviewView.tsx`'s `ProjectHeader`);
  previously nothing ever called `repo.projects.update`, so a project's own
  pitch was frozen at whatever the creation form set (usually nothing).
- **Team** (`TeamView.tsx`, `overview/CollaboratorsPanel.tsx`) — add, edit,
  and remove teammates (name, discipline, role, presence). The "Invite
  collaborator" button previously existed but was hardcoded `disabled`.
- **Gameplay Loops** (`LoopsView.tsx`, new top-level screen) — until now a
  `loop` block could only *pick* an existing loop from a dropdown; there
  was no way to create one or edit its steps/branches anywhere in the UI.
  Loops are edited as real entities now (name, cycle toggle, ordered
  steps, optional branch labels), with a live preview
  (`LoopDiagram`, factored out of `LoopBlockView` so both share one
  rendering instead of drifting apart).
- **Real images** (`MediaBlocks.tsx`, `MediaBlockEditors.tsx`) — image,
  gallery, and annotated-map blocks rendered a "renders here once Phase 2
  wires up real assets" placeholder regardless of whether an asset had a
  real `url`. They now render the actual image, and every asset picker
  gained an **Upload** button (`data/newAsset.ts`) — no backend to upload
  *to*, so a picked file is read into a `data:` URL and stored directly as
  `Asset.url`, which fits this app's local-first IndexedDB model and needs
  no server to work.

None of this touched the data model or the repository — every mutation
above was already a one-line `repo.x.update(...)` away, just never called
from anywhere.
