/** There's exactly one scope matrix per project in this app (no "create a
 * new matrix" flow) — same rationale as `vaultFolders.ts`/`sectionDefinitions.ts`:
 * structural, not demo content, so it lives here rather than in `data/seed/`
 * even though the seed is currently its only writer. */
export const SCOPE_MATRIX_ID = 'scope:main'
