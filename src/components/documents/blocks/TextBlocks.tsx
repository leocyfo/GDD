import type { Block } from '../../../data/types/entities'
import { InlineMarkdown } from '../../common/InlineMarkdown'

type TextBlock = Extract<Block, { type: 'text' }>
type HeadingBlock = Extract<Block, { type: 'heading' }>
type ListBlock = Extract<Block, { type: 'list' }>
type CalloutBlock = Extract<Block, { type: 'callout' }>
type TableBlock = Extract<Block, { type: 'table' }>

export function TextBlockView({ block }: { block: TextBlock }) {
  return (
    <p className="text-base leading-relaxed text-text2">
      <InlineMarkdown text={block.markdown} />
    </p>
  )
}

export function HeadingBlockView({ block }: { block: HeadingBlock }) {
  const className = block.level === 2 ? 'text-md font-semibold text-text1' : 'text-sm-plus font-semibold text-text1'
  return block.level === 2 ? <h2 className={className}>{block.text}</h2> : <h3 className={className}>{block.text}</h3>
}

export function ListBlockView({ block }: { block: ListBlock }) {
  const ListTag = block.ordered ? 'ol' : 'ul'
  return (
    <ListTag className="flex flex-col gap-[9px]">
      {block.items.map((item, index) => (
        <li key={index} className="flex items-start gap-[9px] text-sm-plus leading-normal text-text2">
          {block.ordered ? (
            <span className="mt-px flex-shrink-0 font-mono text-2xs text-text3">{index + 1}.</span>
          ) : (
            <span className="mt-[7px] h-[3px] w-[3px] flex-shrink-0 bg-accent" aria-hidden="true" />
          )}
          <span>
            <InlineMarkdown text={item} />
          </span>
        </li>
      ))}
    </ListTag>
  )
}

const CALLOUT_STYLES: Record<CalloutBlock['variant'], { border: string; text: string; label: string }> = {
  note: { border: 'border-blue/40', text: 'text-blue', label: 'Note' },
  warning: { border: 'border-amber/40', text: 'text-amber', label: 'Warning' },
  decision: { border: 'border-accent/40', text: 'text-accent', label: 'Decision' },
  risk: { border: 'border-red/40', text: 'text-red', label: 'Risk' },
}

export function CalloutBlockView({ block }: { block: CalloutBlock }) {
  const style = CALLOUT_STYLES[block.variant]
  return (
    <div className={`rounded-lg border bg-inset p-3.5 ${style.border}`}>
      <div className={`mb-1 text-2xs font-semibold uppercase tracking-wide ${style.text}`}>{style.label}</div>
      <div className="text-sm-plus font-medium text-text1">{block.title}</div>
      <p className="mt-1 text-sm text-text2">
        <InlineMarkdown text={block.body} />
      </p>
    </div>
  )
}

export function TableBlockView({ block }: { block: TableBlock }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full border-collapse text-sm-plus">
        <thead>
          <tr className="border-b border-border bg-inset">
            {block.headers.map((header, index) => (
              <th key={index} className="px-3 py-2 text-left text-2xs font-semibold uppercase tracking-wide text-text3">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {block.rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-b border-border last:border-b-0">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-3 py-2 text-text2">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
