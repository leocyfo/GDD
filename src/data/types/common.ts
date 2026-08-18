/** Every persisted record carries these four fields — enforced here once
 * rather than repeated on each entity. */
export interface BaseEntity {
  id: string
  createdAt: string
  updatedAt: string
  updatedBy: string
}
