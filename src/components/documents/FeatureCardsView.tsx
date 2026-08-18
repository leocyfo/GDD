import { Plus, X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { LOCAL_ACTOR, logChange } from '../../data/changelog'
import {
  useActiveProject,
  useCollaborators,
  useFeatureCards,
  useLogicNotes,
} from '../../data/hooks/entityHooks'
import { createFeatureCard } from '../../data/newFeatureCard'
import { useRepository } from '../../data/repository/RepositoryProvider'
import type { FeatureCard, FeatureStatus, RiskLevel } from '../../data/types/entities'
import { inputClass, selectClass } from '../editor/fieldStyles'
import { useAutosave } from '../../lib/useAutosave'
import { toneForFeatureStatus } from '../../lib/tones'
import { notifyDataChanged } from '../../stores/useDataVersion'
import { Modal, ModalCloseButton } from '../common/Modal'
import { SaveIndicator } from '../common/SaveIndicator'
import { StatusDot } from '../common/StatusDot'
import { EmptyDocument } from './EmptyDocument'

const STATUSES: FeatureStatus[] = ['idea', 'designed', 'in-build', 'in-build-diverged', 'shipped', 'cut']
const RISKS: RiskLevel[] = ['low', 'medium', 'high']

/** The small tile shown in the grid — just enough to recognize a card and
 * scan its status at a glance. Everything else lives behind the click, in
 * the detail modal (`FeatureCardFields`) — styled like the read-only
 * `FeatureCardsBlockView` (`LinkedBlocks.tsx`), which already struck the
 * right amount of at-a-glance information for a card. */
function CompactFeatureCard({ card, onOpen }: { card: FeatureCard; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex h-36 flex-col items-start gap-1.5 rounded-xl border border-border bg-card p-3.5 text-left shadow-card transition-colors hover:border-border-hover"
    >
      <div className="flex w-full items-center gap-2">
        <span className="min-w-0 flex-1 truncate text-sm-plus font-semibold text-text1">{card.name || 'Untitled'}</span>
        <StatusDot tone={toneForFeatureStatus(card.status)} />
      </div>
      <p className="line-clamp-2 flex-1 text-xs-plus italic leading-snug text-text3">{card.playerPromise || 'No player promise yet.'}</p>
      <span className="font-mono text-2xs uppercase tracking-wide text-text3">{card.status}</span>
    </button>
  )
}

/** Every field, unchanged from the old always-expanded card — just no
 * longer carrying its own card chrome (border/background/shadow), since it
 * now lives inside a `Modal` panel that already provides that. */
function FeatureCardFields({ card }: { card: FeatureCard }) {
  const repo = useRepository()
  const { data: project } = useActiveProject()
  const { data: collaborators } = useCollaborators(project?.id)
  const { data: cards } = useFeatureCards(project?.id)
  const { data: notes } = useLogicNotes(project?.id)

  const [name, setName] = useState(card.name)
  const [playerPromise, setPlayerPromise] = useState(card.playerPromise)
  const [summary, setSummary] = useState(card.summary)
  const [logic, setLogic] = useState(card.logic)

  async function patch(fields: Partial<FeatureCard>, summaryText: string) {
    await repo.featureCards.update(card.id, { ...fields, updatedBy: LOCAL_ACTOR })
    if (project) {
      await logChange(repo, {
        projectId: project.id,
        by: LOCAL_ACTOR,
        target: { type: 'feature', id: card.id, label: card.name },
        kind: 'edited',
        diffSummary: summaryText,
      })
    }
    notifyDataChanged()
  }

  const nameSave = useAutosave<string>((v) => patch({ name: v }, 'Renamed the feature.'))
  const promiseSave = useAutosave<string>((v) => patch({ playerPromise: v }, 'Updated the player promise.'))
  const summarySave = useAutosave<string>((v) => patch({ summary: v }, 'Updated the summary.'))
  const logicSave = useAutosave<string>((v) => patch({ logic: v }, 'Updated the logic.'))

  const dependencyOptions = (cards ?? []).filter((c) => c.id !== card.id && !card.dependencies.includes(c.id))
  const noteOptions = (notes ?? []).filter((n) => !card.logicNoteIds.includes(n.id))

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <input
          value={name}
          onChange={(event) => {
            setName(event.target.value)
            nameSave.schedule(event.target.value)
          }}
          onBlur={nameSave.flush}
          className={`${inputClass} text-sm-plus font-semibold`}
        />
        <div className="flex flex-shrink-0 items-center gap-2">
          <StatusDot tone={toneForFeatureStatus(card.status)} />
          <select
            value={card.status}
            onChange={(event) => patch({ status: event.target.value as FeatureStatus }, 'Changed status.')}
            className={`${selectClass} font-mono text-2xs uppercase`}
          >
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      </div>

      <input
        value={playerPromise}
        onChange={(event) => {
          setPlayerPromise(event.target.value)
          promiseSave.schedule(event.target.value)
        }}
        onBlur={promiseSave.flush}
        placeholder="What does the player feel, in one sentence?"
        className={`${inputClass} mt-2 italic`}
      />

      <textarea
        value={summary}
        onChange={(event) => {
          setSummary(event.target.value)
          summarySave.schedule(event.target.value)
        }}
        onBlur={summarySave.flush}
        placeholder="Summary"
        rows={2}
        className={`${inputClass} mt-2 resize-y`}
      />

      <textarea
        value={logic}
        onChange={(event) => {
          setLogic(event.target.value)
          logicSave.schedule(event.target.value)
        }}
        onBlur={logicSave.flush}
        placeholder="Logic — how it actually works"
        rows={2}
        className={`${inputClass} mt-2 resize-y font-mono`}
      />

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-2xs text-text3">
          Risk
          <select
            value={card.risk}
            onChange={(event) => patch({ risk: event.target.value as RiskLevel }, 'Changed risk.')}
            className={`${selectClass} capitalize`}
          >
            {RISKS.map((risk) => (
              <option key={risk} value={risk}>
                {risk}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-2xs text-text3">
          Owner
          <select
            value={card.owner}
            onChange={(event) => patch({ owner: event.target.value }, 'Changed owner.')}
            className={selectClass}
          >
            <option value="">Unassigned</option>
            {(collaborators ?? []).map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-3">
        <div className="mb-1 text-2xs text-text3">Depends on</div>
        <div className="flex flex-wrap gap-1.5">
          {card.dependencies.map((id) => {
            const dep = (cards ?? []).find((c) => c.id === id)
            return (
              <span key={id} className="flex items-center gap-1 rounded-full border border-border bg-inset px-2 py-0.5 text-2xs text-text2">
                {dep?.name ?? id}
                <button
                  type="button"
                  aria-label="Remove dependency"
                  onClick={() => patch({ dependencies: card.dependencies.filter((existing) => existing !== id) }, 'Removed a dependency.')}
                  className="text-text3 hover:text-red"
                >
                  <X size={10} />
                </button>
              </span>
            )
          })}
        </div>
        {dependencyOptions.length > 0 && (
          <select
            value=""
            onChange={(event) =>
              event.target.value && patch({ dependencies: [...card.dependencies, event.target.value] }, 'Added a dependency.')
            }
            className={`${selectClass} mt-1.5`}
          >
            <option value="">Add a dependency…</option>
            {dependencyOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="mt-3">
        <div className="mb-1 text-2xs text-text3">Logic notes</div>
        <div className="flex flex-wrap gap-1.5">
          {card.logicNoteIds.map((id) => {
            const note = (notes ?? []).find((n) => n.id === id)
            return (
              <span key={id} className="flex items-center gap-1 rounded-full border border-border bg-inset px-2 py-0.5 font-mono text-2xs text-text2">
                {note?.title ?? id}
                <button
                  type="button"
                  aria-label="Remove logic note link"
                  onClick={() => patch({ logicNoteIds: card.logicNoteIds.filter((existing) => existing !== id) }, 'Removed a logic note link.')}
                  className="text-text3 hover:text-red"
                >
                  <X size={10} />
                </button>
              </span>
            )
          })}
        </div>
        {noteOptions.length > 0 && (
          <select
            value=""
            onChange={(event) =>
              event.target.value && patch({ logicNoteIds: [...card.logicNoteIds, event.target.value] }, 'Linked a logic note.')
            }
            className={`${selectClass} mt-1.5`}
          >
            <option value="">Link a logic note…</option>
            {noteOptions.map((note) => (
              <option key={note.id} value={note.id}>
                {note.title}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="mt-3 flex gap-3">
        <SaveIndicator state={nameSave.state} />
        <SaveIndicator state={promiseSave.state} />
        <SaveIndicator state={summarySave.state} />
        <SaveIndicator state={logicSave.state} />
      </div>
    </div>
  )
}

function NewFeatureCardTile({ onCreated }: { onCreated: () => void }) {
  const repo = useRepository()
  const { data: project } = useActiveProject()
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed || busy || !project) return
    setBusy(true)
    try {
      const card = await createFeatureCard(repo, { projectId: project.id, name: trimmed, createdBy: LOCAL_ACTOR })
      await logChange(repo, {
        projectId: project.id,
        by: LOCAL_ACTOR,
        target: { type: 'feature', id: card.id, label: card.name },
        kind: 'created',
        diffSummary: 'New feature card.',
      })
      notifyDataChanged()
      setName('')
      setCreating(false)
      onCreated()
    } finally {
      setBusy(false)
    }
  }

  if (!creating) {
    return (
      <button
        type="button"
        onClick={() => setCreating(true)}
        className="flex h-36 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border text-text3 transition-colors hover:border-border-hover hover:text-text2"
      >
        <Plus size={18} />
        <span className="text-sm-plus font-medium">New feature card</span>
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex h-36 flex-col gap-2 rounded-xl border border-dashed border-border bg-inset p-3.5">
      <input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="Feature name" className={inputClass} />
      <div className="mt-auto flex gap-2">
        <button type="submit" disabled={!name.trim() || busy} className="rounded-md bg-accent px-3 py-1.5 text-xs-plus font-medium text-accent-fg disabled:opacity-50">
          {busy ? 'Creating…' : 'Create'}
        </button>
        <button type="button" onClick={() => setCreating(false)} className="rounded-md border border-border px-3 py-1.5 text-xs-plus text-text2">
          Cancel
        </button>
      </div>
    </form>
  )
}

export function FeatureCardsView() {
  const { data: project } = useActiveProject()
  const { data: cards, loading, refetch } = useFeatureCards(project?.id)
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 p-8 sm:grid-cols-2 lg:grid-cols-4" aria-hidden="true">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-36 animate-pulse rounded-xl bg-inset" />
        ))}
      </div>
    )
  }

  const selectedCard = selectedCardId ? (cards ?? []).find((c) => c.id === selectedCardId) : undefined

  return (
    <div className="px-8 py-7">
      <h1 className="mb-1 text-md font-semibold text-text1">Feature Cards</h1>
      <p className="mb-6 text-xs-plus text-text3">
        {(cards ?? []).length} feature cards. <span className="text-red">in-build-diverged</span> means the build has drifted
        from what&rsquo;s designed here.
      </p>

      {(!cards || cards.length === 0) && (
        <EmptyDocument title="No feature cards yet" body="Add the first one to start tracking a major mechanic." />
      )}

      {/* `auto-fill` instead of hand-picked breakpoints — the grid fills
       * whatever width the page has, from a phone-width column up to
       * however many 220px tiles fit a very wide window. */}
      <div className="grid gap-3.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
        {(cards ?? []).map((card) => (
          <CompactFeatureCard key={card.id} card={card} onOpen={() => setSelectedCardId(card.id)} />
        ))}
        <NewFeatureCardTile onCreated={refetch} />
      </div>

      {selectedCard && (
        <Modal onClose={() => setSelectedCardId(null)} ariaLabel={`Edit ${selectedCard.name || 'feature card'}`} widthClassName="max-w-xl">
          <div className="relative overflow-y-auto p-5">
            <ModalCloseButton onClose={() => setSelectedCardId(null)} />
            <FeatureCardFields key={selectedCard.id} card={selectedCard} />
          </div>
        </Modal>
      )}
    </div>
  )
}
