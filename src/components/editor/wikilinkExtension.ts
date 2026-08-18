import Mention from '@tiptap/extension-mention'
import { ReactRenderer } from '@tiptap/react'
import { WikilinkSuggestionList, type WikilinkSuggestionListRef } from './WikilinkSuggestionList'

export interface WikilinkItem {
  id: string
  label: string
  kind: 'note' | 'section'
}

/**
 * `[[` triggers a suggestion popup over every linkable note/section title;
 * picking one inserts an atom "wikilink" node (not just styled text) that
 * serializes back to `[[Title]]` markdown on save (see `addStorage` below —
 * `tiptap-markdown` looks up each extension's own `storage.markdown.serialize`,
 * so this node needs to say how to write itself). Clicking a wikilink in an
 * already-rendered editor opens the note/section it points at.
 *
 * Note: this only styles/links-up wikilinks *typed through this menu* —
 * pre-existing `[[Title]]` text loaded from storage (e.g. the seeded demo
 * notes) still displays as plain text inside the editor until re-typed;
 * the read-only `InlineMarkdown` renderer is what makes those clickable
 * outside the editor.
 */
export function createWikilinkExtension(
  getItems: () => WikilinkItem[],
  onOpenLink: (id: string, kind: WikilinkItem['kind']) => void,
) {
  return Mention.extend({
    name: 'wikilink',

    addAttributes() {
      return {
        ...this.parent?.(),
        kind: {
          default: 'note',
          parseHTML: (element: HTMLElement) => element.getAttribute('data-kind') ?? 'note',
          renderHTML: (attributes: { kind?: string }) => (attributes.kind ? { 'data-kind': attributes.kind } : {}),
        },
      }
    },

    addStorage() {
      return {
        markdown: {
          serialize: (state: { write: (text: string) => void }, node: { attrs: { label?: string; id?: string } }) => {
            state.write(`[[${node.attrs.label ?? node.attrs.id}]]`)
          },
        },
      }
    },

    addNodeView() {
      return ({ node }) => {
        const dom = document.createElement('span')
        dom.className =
          'rounded bg-inset px-1 font-mono text-[0.92em] text-accent cursor-pointer hover:underline'
        dom.textContent = node.attrs.label ?? node.attrs.id
        dom.addEventListener('click', (event) => {
          event.preventDefault()
          onOpenLink(node.attrs.id, node.attrs.kind ?? 'note')
        })
        return { dom }
      }
    },
  }).configure({
    HTMLAttributes: {},
    renderText({ node }) {
      return `[[${node.attrs.label ?? node.attrs.id}]]`
    },
    suggestion: {
      char: '[[',
      allowSpaces: true,
      items: ({ query }: { query: string }) => {
        const q = query.trim().toLowerCase()
        const items = getItems()
        const filtered = q ? items.filter((item) => item.label.toLowerCase().includes(q)) : items
        return filtered.slice(0, 8)
      },
      render: () => {
        let component: ReactRenderer<WikilinkSuggestionListRef>
        let unmount: (() => void) | undefined
        return {
          onStart: (props) => {
            component = new ReactRenderer(WikilinkSuggestionList, { props, editor: props.editor })
            unmount = props.mount(component.element as HTMLElement)
          },
          onUpdate: (props) => {
            component.updateProps(props)
          },
          onKeyDown: (props) => component.ref?.onKeyDown(props) ?? false,
          onExit: () => {
            unmount?.()
            component.destroy()
          },
        }
      },
    },
  })
}
