import type { Project } from '../types/entities'
import { PROJECT_ID, SEED_UPDATED_BY } from './constants'
import { daysBeforeAnchor } from './dates'

export function buildProject(): Project {
  return {
    id: PROJECT_ID,
    name: 'Stormline',
    version: '0.9.0',
    status: 'active',
    editPolicy: 'everyone',
    intro:
      "This document evolves as we learn, prototype, and gather feedback. It's our single source of truth for the game — not a snapshot of it.",
    createdAt: daysBeforeAnchor(150),
    updatedAt: daysBeforeAnchor(1),
    updatedBy: SEED_UPDATED_BY,
  }
}
