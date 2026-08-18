import { CommandPaletteTrigger } from '../../command-palette/CommandPaletteTrigger'
import { ThemeToggle } from '../../common/ThemeToggle'
import { ProfileButton } from '../../profile/ProfileButton'
import { useNavStore } from '../../../stores/useNavStore'
import { DocumentStatusBox } from './DocumentStatusBox'
import { ModeToggle } from './ModeToggle'
import { NavList } from './NavList'
import { ProjectSelector } from './ProjectSelector'
import { SecondaryNav } from './SecondaryNav'
import { VaultTree } from './VaultTree'

export function Sidebar() {
  const mode = useNavStore((s) => s.mode)

  return (
    <aside className="flex h-full w-[228px] flex-shrink-0 flex-col overflow-y-auto border-r border-border bg-sidebar p-4">
      <div className="mb-5 flex items-center justify-between gap-2">
        <ProjectSelector />
        <ThemeToggle />
      </div>
      <CommandPaletteTrigger />
      <ModeToggle />

      {mode === 'gdd' ? <NavList /> : <VaultTree />}

      {mode === 'gdd' && (
        <>
          <div className="my-3.5 border-t border-border" />
          <SecondaryNav />
        </>
      )}

      <DocumentStatusBox />
      <div className="mt-3 border-t border-border pt-3">
        <ProfileButton />
      </div>
    </aside>
  )
}
