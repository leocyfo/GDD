import type { Tab } from '../../stores/useTabsStore'
import { AssetListView } from './AssetListView'
import { ChangelogView } from './ChangelogView'
import { DecisionsView } from './DecisionsView'
import { FeatureCardsView } from './FeatureCardsView'
import { LoopsView } from './LoopsView'
import { MilestonesView } from './MilestonesView'
import { OverviewView } from './OverviewView'
import { ScopeMatrixView } from './ScopeMatrixView'
import { SectionView } from './SectionView'
import { TeamView } from './TeamView'
import { VaultNoteView } from './VaultNoteView'

export function DocumentView({ tab }: { tab: Tab }) {
  switch (tab.kind) {
    case 'overview':
      return <OverviewView />
    case 'section':
      return tab.refId ? <SectionView sectionKey={tab.refId} /> : null
    case 'note':
      return tab.refId ? <VaultNoteView noteId={tab.refId} /> : null
    case 'changelog':
      return <ChangelogView />
    case 'team':
      return <TeamView />
    case 'features':
      return <FeatureCardsView />
    case 'decisions':
      return <DecisionsView />
    case 'milestones':
      return <MilestonesView />
    case 'scopeMatrix':
      return <ScopeMatrixView />
    case 'loops':
      return <LoopsView />
    case 'assets':
      return <AssetListView />
  }
}
