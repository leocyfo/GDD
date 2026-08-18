import {
  ArrowDownLeft,
  ArrowUpRight,
  FileText,
  Hash,
  Layers,
  Paperclip,
  Search,
  Tags,
  ToggleLeft,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { recomputeVaultLinks } from '../../data/backlinks'
import { LOCAL_ACTOR, logChange } from '../../data/changelog'
import {
  useActiveProject,
  useBacklinks,
  useLinkableItems,
  useLogicNote,
  useLogicNotes,
  useLogicNotesByIds,
} from '../../data/hooks/entityHooks'
import { useRepository } from '../../data/repository/RepositoryProvider'
import type { LogicNote, NoteKind, NoteScope, ValueType } from '../../data/types/entities'
import { RichTextEditor } from '../editor/RichTextEditor'
import { TagEditor } from '../editor/TagEditor'
import { inputClass, selectClass } from '../editor/fieldStyles'
import { relativeTime } from '../../lib/format'
import { useAutosave } from '../../lib/useAutosave'
import { notifyDataChanged } from '../../stores/useDataVersion'
import { useTabsStore } from '../../stores/useTabsStore'
import { SaveIndicator } from '../common/SaveIndicator'
import { EmptyDocument } from './EmptyDocument'
import { FieldBlock } from './vault/FieldBlock'

const SCOPES: NoteScope[] = ['global', 'scene', 'session', 'save', 'local']
const KINDS: NoteKind[] = ['variable', 'switch', 'event', 'formula', 'state-machine', 'constant']
const VALUE_TYPES: ValueType[] = ['bool', 'int', 'float', 'string', 'enum', 'vector', 'ref']

function LinkList({ notes, emptyLabel }: { notes: { id: string; title: string; folderPath: string }[]; emptyLabel: string }) {
  const openTab = useTabsStore((s) => s.openTab)

  if (notes.length === 0) {
    return <p className="text-xs-plus text-text3">{emptyLabel}</p>
  }

  return (
    <ul className="flex flex-col gap-1.5">
      {notes.map((note) => (
        <li key={note.id}>
          <button
            type="button"
            onClick={() => openTab({ kind: 'note', refId: note.id, title: note.title, icon: 'FileText' })}
            className="flex w-full items-center justify-between gap-2 rounded-md border border-border bg-card px-2.5 py-1.5 text-left transition-colors hover:border-border-hover"
          >
            <span className="font-mono text-sm-plus text-accent">{note.title}</span>
            <span className="text-2xs text-text3">{note.folderPath}</span>
          </button>
        </li>
      ))}
    </ul>
  )
}

/** Renders once a note has actually loaded — split out from `VaultNoteView`
 * so all the `useState(note.field)` initializers below only ever run once
 * per note (the parent keys this by `note.id`, forcing a remount instead
 * of stale state leaking from the previously-open note). */
function EditableNote({ note }: { note: LogicNote }) {
  const repo = useRepository()
  const { data: project } = useActiveProject()
  const { data: backlinks } = useBacklinks(note.id)
  const { data: outboundNotes } = useLogicNotesByIds(note.outbound)
  const { data: allNotes } = useLogicNotes(project?.id)
  const { data: linkableItems } = useLinkableItems(project?.id)
  const openTab = useTabsStore((s) => s.openTab)

  const [values, setValues] = useState(note.values)
  const [logic, setLogic] = useState(note.logic)
  const [extras, setExtras] = useState(note.extras)
  const [engineRef, setEngineRef] = useState(note.engineRef ?? '')

  const matchingByTag = useMemo(
    () => note.tags.map((tag) => ({ tag, notes: (allNotes ?? []).filter((n) => n.id !== note.id && n.tags.includes(tag)) })),
    [note.id, note.tags, allNotes],
  )

  async function patch(fields: Partial<LogicNote>, opts?: { relink?: boolean; summary?: string }) {
    await repo.logicNotes.update(note.id, { ...fields, updatedBy: LOCAL_ACTOR })
    if (opts?.relink && project) await recomputeVaultLinks(repo, project.id)
    if (project) {
      await logChange(repo, {
        projectId: project.id,
        by: LOCAL_ACTOR,
        target: { type: 'note', id: note.id, label: note.title },
        kind: 'edited',
        diffSummary: opts?.summary ?? 'Edited a field.',
      })
    }
    notifyDataChanged()
  }

  const valuesSave = useAutosave<string>((v) => patch({ values: v }, { summary: 'Updated Values.' }))
  const logicSave = useAutosave<string>((v) => patch({ logic: v }, { relink: true, summary: 'Updated Logic.' }))
  const extrasSave = useAutosave<string>((v) => patch({ extras: v }, { relink: true, summary: 'Updated Extras.' }))
  const engineRefSave = useAutosave<string>((v) => patch({ engineRef: v || null }, { summary: 'Updated the engine reference.' }))

  const linkableForEditor = useMemo(
    () => (linkableItems ?? []).filter((item) => item.id !== note.id),
    [linkableItems, note.id],
  )

  return (
    <div className="mx-auto max-w-3xl px-8 py-7">
      <div className="mb-1.5 text-xs-plus text-text3">{note.folderPath}</div>
      <h1 className="mb-2 font-mono text-[28px] font-semibold leading-tight text-text1">{note.title}</h1>
      <div className="mb-6 flex flex-wrap items-center gap-2 text-2xs text-text3">
        <span>Updated {relativeTime(note.updatedAt)}</span>
        <span aria-hidden="true">·</span>
        <input
          value={engineRef}
          onChange={(event) => {
            setEngineRef(event.target.value)
            engineRefSave.schedule(event.target.value)
          }}
          onBlur={engineRefSave.flush}
          placeholder="engine reference, e.g. BP_PlayerState::bHasKey"
          className="rounded bg-inset px-1.5 py-0.5 font-mono text-text2 outline-none focus-visible:bg-card"
        />
        <SaveIndicator state={engineRefSave.state} />
      </div>

      <div className="flex flex-col gap-5">
        <FieldBlock label="Scope" icon={Layers} tone="gray">
          <select
            value={note.scope}
            onChange={(event) => patch({ scope: event.target.value as NoteScope }, { summary: 'Changed Scope.' })}
            className={`${selectClass} font-mono capitalize`}
          >
            {SCOPES.map((scope) => (
              <option key={scope} value={scope}>
                {scope}
              </option>
            ))}
          </select>
        </FieldBlock>

        <FieldBlock label="Type" icon={ToggleLeft} tone="gray">
          <div className="flex items-center gap-2">
            <select
              value={note.kind}
              onChange={(event) => patch({ kind: event.target.value as NoteKind }, { summary: 'Changed Type.' })}
              className={`${selectClass} font-mono capitalize`}
            >
              {KINDS.map((kind) => (
                <option key={kind} value={kind}>
                  {kind}
                </option>
              ))}
            </select>
            <span className="text-text3">·</span>
            <select
              value={note.valueType}
              onChange={(event) => patch({ valueType: event.target.value as ValueType }, { summary: 'Changed value type.' })}
              className={`${selectClass} font-mono`}
            >
              {VALUE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </FieldBlock>

        <FieldBlock label="Values" icon={Hash} tone="gray">
          <textarea
            value={values}
            onChange={(event) => {
              setValues(event.target.value)
              valuesSave.schedule(event.target.value)
            }}
            onBlur={valuesSave.flush}
            rows={2}
            placeholder="Domain, default, bounds…"
            className={`${inputClass} resize-y font-mono`}
          />
          <div className="mt-1.5">
            <SaveIndicator state={valuesSave.state} />
          </div>
        </FieldBlock>

        <FieldBlock label="Logic" icon={FileText} tone="blue">
          <RichTextEditor
            value={logic}
            onChange={(md) => {
              setLogic(md)
              logicSave.schedule(md)
            }}
            onBlur={logicSave.flush}
            placeholder="Rules, conditions, and at least one edge case…"
            linkableItems={linkableForEditor}
            onOpenLink={(id, kind) => {
              const item = linkableForEditor.find((i) => i.id === id)
              if (kind === 'note') openTab({ kind: 'note', refId: id, title: item?.label ?? id, icon: 'FileText' })
              else openTab({ kind: 'section', refId: id, title: item?.label ?? id, icon: 'FileText' })
            }}
          />
          <div className="mt-1.5">
            <SaveIndicator state={logicSave.state} />
          </div>
        </FieldBlock>

        <FieldBlock
          label="Inbound Link(s)"
          icon={ArrowDownLeft}
          tone="green"
          count={backlinks?.length ?? 0}
          defaultOpen={(backlinks?.length ?? 0) > 0}
        >
          <LinkList notes={backlinks ?? []} emptyLabel="No notes link here yet." />
        </FieldBlock>

        <FieldBlock
          label="Outbound Link(s)"
          icon={ArrowUpRight}
          tone="blue"
          count={outboundNotes?.length ?? 0}
          defaultOpen={(outboundNotes?.length ?? 0) > 0}
        >
          <LinkList notes={outboundNotes ?? []} emptyLabel="This note doesn't link out to anything yet." />
        </FieldBlock>

        <FieldBlock label="Tag(s)" icon={Tags} tone="amber">
          <TagEditor tags={note.tags} onChange={(tags) => patch({ tags }, { summary: 'Updated tags.' })} />
        </FieldBlock>

        <FieldBlock label="Matching Tag(s)" icon={Search} tone="amber" defaultOpen={false}>
          {matchingByTag.every((row) => row.notes.length === 0) ? (
            <p className="text-xs-plus text-text3">No other notes share these tags yet.</p>
          ) : (
            <table className="w-full border-collapse text-xs-plus">
              <tbody>
                {matchingByTag.map(({ tag, notes }) => (
                  <tr key={tag} className="border-b border-border last:border-b-0">
                    <td className="w-1/3 py-1.5 pr-3 align-top font-mono text-text3">#{tag}</td>
                    <td className="py-1.5">
                      {notes.length === 0 ? (
                        <span className="text-text3">—</span>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {notes.map((n) => (
                            <button
                              key={n.id}
                              type="button"
                              onClick={() => openTab({ kind: 'note', refId: n.id, title: n.title, icon: 'FileText' })}
                              className="rounded bg-inset px-1.5 py-0.5 font-mono text-accent hover:underline"
                            >
                              {n.title}
                            </button>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </FieldBlock>

        <FieldBlock label="Extra(s)" icon={Paperclip} tone="gray" defaultOpen={note.extras.length > 0}>
          <RichTextEditor
            value={extras}
            onChange={(md) => {
              setExtras(md)
              extrasSave.schedule(md)
            }}
            onBlur={extrasSave.flush}
            placeholder="Anything else worth noting…"
            linkableItems={linkableForEditor}
            onOpenLink={(id, kind) => {
              const item = linkableForEditor.find((i) => i.id === id)
              if (kind === 'note') openTab({ kind: 'note', refId: id, title: item?.label ?? id, icon: 'FileText' })
              else openTab({ kind: 'section', refId: id, title: item?.label ?? id, icon: 'FileText' })
            }}
            allowHeadings={false}
          />
          <div className="mt-1.5">
            <SaveIndicator state={extrasSave.state} />
          </div>
        </FieldBlock>
      </div>
    </div>
  )
}

export function VaultNoteView({ noteId }: { noteId: string }) {
  const { data: note, loading } = useLogicNote(noteId)

  if (loading) {
    return (
      <div className="flex flex-col gap-4 p-8" aria-hidden="true">
        <div className="h-8 w-64 animate-pulse rounded bg-inset" />
        <div className="h-24 animate-pulse rounded bg-inset" />
      </div>
    )
  }

  if (!note) {
    return <EmptyDocument title="Note not found" body="This logic note doesn't exist in the vault anymore." />
  }

  return <EditableNote key={note.id} note={note} />
}
