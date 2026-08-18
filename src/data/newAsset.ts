import type { Repository } from './repository/types'
import type { Asset, AssetKind } from './types/entities'

function kindForMimeType(mimeType: string): AssetKind {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType.startsWith('audio/')) return 'audio'
  return 'file'
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error ?? new Error('Could not read file'))
    reader.readAsDataURL(file)
  })
}

/**
 * There's no backend to upload to — this app is local-first IndexedDB, so
 * "uploading" means reading the file into a data: URL and storing that
 * directly as `Asset.url`, which every `<img src>` in the app already
 * knows how to render. Fine at the scale a single GDD's art references
 * actually reach; a real backend would swap this for a real upload
 * without any caller needing to change.
 */
export async function uploadAsset(
  repo: Repository,
  params: { projectId: string; file: File; createdBy?: string },
): Promise<Asset> {
  const url = await readAsDataUrl(params.file)
  return repo.assets.create({
    projectId: params.projectId,
    kind: kindForMimeType(params.file.type),
    url,
    caption: params.file.name.replace(/\.[a-z0-9]+$/i, ''),
    tags: [],
    updatedBy: params.createdBy ?? 'you',
  })
}
