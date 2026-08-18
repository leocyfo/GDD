import Placeholder from '@tiptap/extension-placeholder'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useRef } from 'react'
import { Markdown } from 'tiptap-markdown'
import { createWikilinkExtension, type WikilinkItem } from './wikilinkExtension'

interface MarkdownEditorStorage {
  markdown: { getMarkdown: () => string }
}

/**
 * The rich-text editor used for prose fields (a section's `text` blocks, a
 * callout body, a vault note's Logic/Extras) — real formatting via markdown
 * shortcuts (`**bold**`, `# heading`, `- list`, as-you-type, TipTap's
 * built-in input rules) plus `[[` wikilink autocomplete. Mount a fresh
 * instance per document (`key={note.id}` at the call site) rather than
 * feeding it a changing `value` prop — TipTap editors own their content
 * imperatively once created.
 */
export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Write something…',
  linkableItems,
  onOpenLink,
  autoFocus = false,
  className = '',
  allowHeadings = true,
  onBlur,
}: {
  value: string
  onChange: (markdown: string) => void
  placeholder?: string
  linkableItems: WikilinkItem[]
  onOpenLink: (id: string, kind: WikilinkItem['kind']) => void
  autoFocus?: boolean
  className?: string
  allowHeadings?: boolean
  /** Fires when the editor loses focus — the natural place to flush a
   * pending debounced autosave immediately rather than waiting it out. */
  onBlur?: () => void
}) {
  // The wikilink extension calls back into whatever these currently point
  // at, without needing the editor itself to be recreated when the
  // linkable-item list (loaded async) or callback identity changes.
  const linkableItemsRef = useRef(linkableItems)
  linkableItemsRef.current = linkableItems
  const onOpenLinkRef = useRef(onOpenLink)
  onOpenLinkRef.current = onOpenLink
  const onBlurRef = useRef(onBlur)
  onBlurRef.current = onBlur

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: allowHeadings ? { levels: [2, 3] } : false }),
      Placeholder.configure({ placeholder }),
      Markdown.configure({ html: false, linkify: false, breaks: false }),
      createWikilinkExtension(
        () => linkableItemsRef.current,
        (id, kind) => onOpenLinkRef.current(id, kind),
      ),
    ],
    content: value,
    autofocus: autoFocus,
    onUpdate: ({ editor: instance }) => {
      const storage = instance.storage as unknown as MarkdownEditorStorage
      onChange(storage.markdown.getMarkdown())
    },
    onBlur: () => {
      onBlurRef.current?.()
    },
  })

  return <EditorContent editor={editor} className={`prose-editor text-base leading-relaxed text-text2 ${className}`} />
}
