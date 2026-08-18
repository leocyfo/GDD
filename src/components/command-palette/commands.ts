/** Non-navigation command categories the spec calls for but that depend on
 * work later phases own (the block editor, the query engine, feature
 * status editing). Listed and clearly disabled rather than omitted or
 * silently doing nothing — the palette should never pretend a command
 * exists and then eat the keystroke. */
export interface StubCommand {
  id: string
  label: string
  disabledReason: string
}

export const STUB_COMMANDS: StubCommand[] = [
  { id: 'insert-block', label: 'Insert block', disabledReason: 'Coming in a later phase — the block editor ships in Phase 2.' },
  { id: 'run-query', label: 'Run query', disabledReason: 'Coming in a later phase — the query engine ships in Phase 4.' },
  { id: 'change-status', label: 'Change feature status', disabledReason: 'Coming in a later phase — feature card editing ships in Phase 5.' },
]
