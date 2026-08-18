import type { Table } from 'dexie'
import type { BaseEntity } from '../types/common'
import type { CrudRepository } from './types'

/** Shared with `createSupabaseCrud` (`SupabaseRepository.ts`) — both
 * backends generate ids/timestamps the exact same way, so a record created
 * under one and later migrated to the other never looks any different. */
export function nowIso(): string {
  return new Date().toISOString()
}

export function generateId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`
}

/** One generic implementation of `CrudRepository<T>`, reused for every
 * table — the entity-specific repositories layer their extra query methods
 * on top of what this returns. */
export function createDexieCrud<T extends BaseEntity>(
  table: Table<T, string>,
  idPrefix: string,
): CrudRepository<T> {
  return {
    async get(id) {
      return table.get(id)
    },
    async list(filter) {
      if (!filter || Object.keys(filter).length === 0) return table.toArray()
      const all = await table.toArray()
      const keys = Object.keys(filter) as (keyof T)[]
      return all.filter((item) => keys.every((key) => item[key] === filter[key]))
    },
    async create(input) {
      const record = {
        ...input,
        id: generateId(idPrefix),
        createdAt: nowIso(),
        updatedAt: nowIso(),
      } as T
      await table.put(record)
      return record
    },
    async update(id, patch) {
      const existing = await table.get(id)
      if (!existing) throw new Error(`${idPrefix}: no record with id "${id}"`)
      const updated = { ...existing, ...patch, id, updatedAt: nowIso() } as T
      await table.put(updated)
      return updated
    },
    async delete(id) {
      await table.delete(id)
    },
    async bulkPut(items) {
      await table.bulkPut(items)
    },
  }
}
