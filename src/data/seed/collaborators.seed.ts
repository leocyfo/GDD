import type { Collaborator } from '../types/entities'
import { PROJECT_ID, SEED_UPDATED_BY } from './constants'
import { daysBeforeAnchor, SEED_ANCHOR } from './dates'
import { mkId } from './ids'

export const COLLABORATOR_IDS = {
  priya: mkId('collaborator', 'priya'),
  deshawn: mkId('collaborator', 'deshawn'),
  ines: mkId('collaborator', 'ines'),
  malik: mkId('collaborator', 'malik'),
  sofia: mkId('collaborator', 'sofia'),
} as const

function minutesBeforeAnchor(minutes: number): string {
  const d = new Date(SEED_ANCHOR)
  d.setUTCMinutes(d.getUTCMinutes() - minutes)
  return d.toISOString()
}

export function buildCollaborators(): Collaborator[] {
  const createdAt = daysBeforeAnchor(150)
  return [
    {
      id: COLLABORATOR_IDS.priya,
      projectId: PROJECT_ID,
      userId: null,
      name: 'Priya',
      discipline: 'Design',
      role: 'owner',
      presence: 'online',
      lastSeen: minutesBeforeAnchor(1),
      createdAt,
      updatedAt: minutesBeforeAnchor(1),
      updatedBy: SEED_UPDATED_BY,
    },
    {
      id: COLLABORATOR_IDS.deshawn,
      projectId: PROJECT_ID,
      userId: null,
      name: 'Deshawn',
      discipline: 'Programming',
      role: 'editor',
      presence: 'online',
      lastSeen: minutesBeforeAnchor(3),
      createdAt,
      updatedAt: minutesBeforeAnchor(3),
      updatedBy: SEED_UPDATED_BY,
    },
    {
      id: COLLABORATOR_IDS.ines,
      projectId: PROJECT_ID,
      userId: null,
      name: 'Ines',
      discipline: 'Art',
      role: 'editor',
      presence: 'online',
      lastSeen: minutesBeforeAnchor(9),
      createdAt,
      updatedAt: minutesBeforeAnchor(9),
      updatedBy: SEED_UPDATED_BY,
    },
    {
      id: COLLABORATOR_IDS.malik,
      projectId: PROJECT_ID,
      userId: null,
      name: 'Malik',
      discipline: 'Level Design',
      role: 'editor',
      presence: 'away',
      lastSeen: minutesBeforeAnchor(37),
      createdAt,
      updatedAt: minutesBeforeAnchor(37),
      updatedBy: SEED_UPDATED_BY,
    },
    {
      id: COLLABORATOR_IDS.sofia,
      projectId: PROJECT_ID,
      userId: null,
      name: 'Sofia',
      discipline: 'Audio',
      role: 'commenter',
      presence: 'offline',
      lastSeen: daysBeforeAnchor(1),
      createdAt,
      updatedAt: daysBeforeAnchor(1),
      updatedBy: SEED_UPDATED_BY,
    },
  ]
}
