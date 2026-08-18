import { useNavStore } from '../../../stores/useNavStore'

export function ModeToggle() {
  const mode = useNavStore((s) => s.mode)
  const setMode = useNavStore((s) => s.setMode)

  return (
    <div role="tablist" aria-label="Workspace" className="mb-4 flex rounded-md border border-border bg-inset p-0.5">
      {(['gdd', 'vault'] as const).map((option) => {
        const active = mode === option
        return (
          <button
            key={option}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => setMode(option)}
            className={`flex-1 rounded-[5px] py-1.5 text-xs-plus font-medium transition-colors ${
              active ? 'bg-card text-text1 shadow-card' : 'text-text3 hover:text-text2'
            }`}
          >
            {option === 'gdd' ? 'GDD' : 'Vault'}
          </button>
        )
      })}
    </div>
  )
}
