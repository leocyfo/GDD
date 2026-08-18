/** Shared classNames for the small form controls scattered across the
 * editable views (vault notes, feature cards, decisions, milestones) — one
 * definition so every text input/select/textarea in the app looks and
 * focuses the same way.
 *
 * `min-w-0` matters more than it looks: these controls are almost always
 * one flex item among several (a label input next to fixed-width number
 * fields and a remove button, say). Text inputs have a non-zero intrinsic
 * min-width by default, so without `min-w-0` a flex row can't actually
 * shrink them to fit — the row just overflows its container instead of
 * respecting it. Harmless when a control isn't in a flex row at all. */
export const inputClass =
  'w-full min-w-0 rounded-md border border-border bg-card px-2.5 py-1.5 text-sm-plus text-text1 outline-none transition-colors placeholder:text-text3 focus-visible:border-accent'

/** Same control, without a baked-in `w-full` — for the few spots that pair
 * it with their own fixed width (`${fixedWidthInputClass} w-16`, say).
 * Don't just tack a width class onto `inputClass` instead: Tailwind gives
 * both `w-*` utilities equal specificity, so which one wins depends on
 * generated stylesheet order, not on source order in the className string
 * — `w-full` can silently win and blow the field back out to full width. */
export const fixedWidthInputClass =
  'min-w-0 rounded-md border border-border bg-card px-2.5 py-1.5 text-sm-plus text-text1 outline-none transition-colors placeholder:text-text3 focus-visible:border-accent'

export const selectClass =
  'min-w-0 rounded-md border border-border bg-card px-2 py-1.5 text-sm-plus text-text1 outline-none transition-colors focus-visible:border-accent'
