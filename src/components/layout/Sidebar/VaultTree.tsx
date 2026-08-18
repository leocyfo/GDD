import { ChevronRight, FileText, Plus } from 'lucide-react'
import { useMemo, useState, type KeyboardEvent } from 'react'
import { LOCAL_ACTOR, logChange } from '../../../data/changelog'
import { useActiveProject, useLogicNotes } from '../../../data/hooks/entityHooks'
import { createLogicNote } from '../../../data/newNote'
import { useRepository } from '../../../data/repository/RepositoryProvider'
import type { LogicNote } from '../../../data/types/entities'
import { VAULT_FOLDERS } from '../../../data/vaultFolders'
import { buildFolderTree, type FolderTreeNode } from '../../../lib/folderTree'
import { useNavStore } from '../../../stores/useNavStore'
import { notifyDataChanged } from '../../../stores/useDataVersion'
import { useTabsStore } from '../../../stores/useTabsStore'
import { resolveFolderIcon } from './vaultFolderIcons'

const NAME_EXAMPLES = ['playerHasKey', 'shopStockApples', 'questGiverMoodLevel', 'saveSlotIndex']

function NewNoteRow({
  folderPath,
  indent,
  onDone,
}: {
  folderPath: string
  indent: number
  onDone: (noteId: string, title?: string) => void
}) {
  const repo = useRepository()
  const { data: project } = useActiveProject()
  const [title, setTitle] = useState('')
  const [busy, setBusy] = useState(false)
  const placeholder = NAME_EXAMPLES[Math.abs(folderPath.length * 7) % NAME_EXAMPLES.length]

  async function commit() {
    const trimmed = title.trim()
    if (!trimmed || busy || !project) return
    setBusy(true)
    try {
      const note = await createLogicNote(repo, { projectId: project.id, folderPath, title: trimmed, createdBy: LOCAL_ACTOR })
      await logChange(repo, {
        projectId: project.id,
        by: LOCAL_ACTOR,
        target: { type: 'note', id: note.id, label: note.title },
        kind: 'created',
        diffSummary: `Created in ${folderPath}.`,
      })
      notifyDataChanged()
      onDone(note.id, note.title)
    } finally {
      setBusy(false)
    }
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault()
      commit()
    } else if (event.key === 'Escape') {
      onDone('')
    }
  }

  return (
    <div style={{ paddingLeft: indent + 22 }} className="flex h-7 items-center gap-1.5 pr-2">
      <FileText size={12} className="flex-shrink-0 text-text3" />
      <input
        autoFocus
        value={title}
        disabled={busy}
        onChange={(event) => setTitle(event.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => (title.trim() ? commit() : onDone(''))}
        placeholder={placeholder}
        className="min-w-0 flex-1 rounded border border-border bg-card px-1.5 py-0.5 font-mono text-xs-plus text-text1 outline-none focus-visible:border-accent"
      />
    </div>
  )
}

function VaultTreeNode({
  node,
  depth,
  notesByFolder,
}: {
  node: FolderTreeNode
  depth: number
  notesByFolder: Map<string, LogicNote[]>
}) {
  const expanded = useNavStore((s) => s.expandedVaultPaths.includes(node.path))
  const toggleVaultPath = useNavStore((s) => s.toggleVaultPath)
  const activeTabId = useTabsStore((s) => s.activeTabId)
  const openTab = useTabsStore((s) => s.openTab)
  const [creatingNote, setCreatingNote] = useState(false)

  const notes = notesByFolder.get(node.path) ?? []
  const hasChildren = node.children.length > 0
  const totalCount = hasChildren
    ? node.children.reduce((sum, child) => sum + (notesByFolder.get(child.path)?.length ?? 0), 0)
    : notes.length
  const Icon = resolveFolderIcon(node.name)
  const indent = 10 + depth * 14

  return (
    <div>
      <div className="group flex items-center">
        <button
          type="button"
          onClick={() => toggleVaultPath(node.path)}
          aria-expanded={expanded}
          style={{ paddingLeft: indent }}
          className="flex h-8 min-w-0 flex-1 items-center rounded-md pr-1 text-left text-sm font-medium text-text2 transition-colors hover:bg-inset/60"
        >
          <ChevronRight size={12} className={`flex-shrink-0 text-text3 transition-transform ${expanded ? 'rotate-90' : ''}`} />
          <Icon size={14} className="ml-1.5 flex-shrink-0 text-text3" />
          <span className="ml-2 min-w-0 flex-1 truncate">{node.name}</span>
          <span className="text-2xs text-text3">{totalCount}</span>
        </button>
        {!hasChildren && (
          <button
            type="button"
            aria-label={`New note in ${node.name}`}
            title={`New note in ${node.name}`}
            onClick={() => {
              if (!expanded) toggleVaultPath(node.path)
              setCreatingNote(true)
            }}
            className="mr-1.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded text-text3 opacity-0 transition-opacity hover:bg-inset hover:text-text2 focus-visible:opacity-100 group-hover:opacity-100"
          >
            <Plus size={13} />
          </button>
        )}
      </div>

      {expanded && hasChildren && node.children.map((child) => (
        <VaultTreeNode key={child.path} node={child} depth={depth + 1} notesByFolder={notesByFolder} />
      ))}

      {expanded && !hasChildren && notes.length === 0 && !creatingNote && (
        <div style={{ paddingLeft: indent + 22 }} className="py-1 text-xs-plus text-text3">
          Empty folder
        </div>
      )}

      {expanded &&
        !hasChildren &&
        notes.map((note) => {
          const active = activeTabId === `note:${note.id}`
          return (
            <button
              key={note.id}
              type="button"
              onClick={() => openTab({ kind: 'note', refId: note.id, title: note.title, icon: 'FileText' })}
              aria-current={active ? 'page' : undefined}
              style={{ paddingLeft: indent + 22 }}
              className={`flex h-7 w-full items-center rounded-md pr-2 text-left font-mono text-xs-plus transition-colors ${
                active ? 'bg-inset text-text1' : 'text-text2 hover:bg-inset/60'
              }`}
            >
              <FileText size={12} className="flex-shrink-0 text-text3" />
              <span className="ml-2 truncate">{note.title}</span>
            </button>
          )
        })}

      {expanded && creatingNote && (
        <NewNoteRow
          folderPath={node.path}
          indent={indent}
          onDone={(noteId, title) => {
            setCreatingNote(false)
            if (noteId) openTab({ kind: 'note', refId: noteId, title: title ?? 'Untitled', icon: 'FileText' })
          }}
        />
      )}
    </div>
  )
}

export function VaultTree() {
  const { data: project } = useActiveProject()
  const { data: notes, loading } = useLogicNotes(project?.id)
  const tree = useMemo(() => buildFolderTree(VAULT_FOLDERS), [])

  const notesByFolder = useMemo(() => {
    const map = new Map<string, LogicNote[]>()
    for (const note of notes ?? []) {
      const list = map.get(note.folderPath) ?? []
      list.push(note)
      map.set(note.folderPath, list)
    }
    for (const list of map.values()) list.sort((a, b) => a.title.localeCompare(b.title))
    return map
  }, [notes])

  if (loading) {
    return (
      <div className="flex flex-col gap-1" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-8 rounded-md bg-inset/60" />
        ))}
      </div>
    )
  }

  return (
    <nav aria-label="Game logic vault" className="flex flex-col gap-0.5">
      {tree.map((node) => (
        <VaultTreeNode key={node.path} node={node} depth={0} notesByFolder={notesByFolder} />
      ))}
    </nav>
  )
}
