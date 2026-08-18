import { createContext, useContext, type ReactNode } from 'react'
import type { Repository } from './types'
import { repo as defaultRepo } from './index'

const RepositoryContext = createContext<Repository>(defaultRepo)

export function RepositoryProvider({
  children,
  value = defaultRepo,
}: {
  children: ReactNode
  /** Override for tests — pass a repository backed by an isolated
   * in-memory/fake-indexeddb database instead of the app-wide singleton. */
  value?: Repository
}) {
  return <RepositoryContext.Provider value={value}>{children}</RepositoryContext.Provider>
}

export function useRepository(): Repository {
  return useContext(RepositoryContext)
}
