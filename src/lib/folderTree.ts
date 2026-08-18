export interface FolderTreeNode {
  name: string
  /** Full path from the vault root, e.g. "GAME LOGIC" or "GAME LOGIC/PLAYER". */
  path: string
  children: FolderTreeNode[]
}

/** Turns the flat canonical folder list ("GAME LOGIC/PLAYER", …) into a
 * two-level tree for the sidebar. Folder existence is its own concept
 * (the spec allows creating an empty folder before any note lives in it),
 * so this always builds the tree from the canonical folder list — never
 * inferred from which folders currently hold notes. */
export function buildFolderTree(folders: readonly string[]): FolderTreeNode[] {
  const roots = new Map<string, FolderTreeNode>()
  for (const folder of folders) {
    const [topName, ...rest] = folder.split('/')
    let root = roots.get(topName)
    if (!root) {
      root = { name: topName, path: topName, children: [] }
      roots.set(topName, root)
    }
    if (rest.length > 0 && !root.children.some((c) => c.path === folder)) {
      root.children.push({ name: rest.join('/'), path: folder, children: [] })
    }
  }
  return Array.from(roots.values())
}
