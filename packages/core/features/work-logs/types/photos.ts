export type WorkLogPhotoType = 'before' | 'progress' | 'after' | 'general' | null

export interface WorkLogPhoto {
  id: string
  workLogId: string
  filePath: string
  mediumPath?: string | null
  thumbnailPath?: string | null
  caption: string | null
  photoType: WorkLogPhotoType
  displayOrder: number
  showOnProfile: boolean
  fileSizeBytes: number
  takenAt: string | null
  createdAt: string | null
  updatedAt: string | null
}

export interface ResolvedWorkLogPhoto extends WorkLogPhoto {
  signedUrl: string | null
  isRefreshingUrl: boolean
}
