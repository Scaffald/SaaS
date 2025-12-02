import { randomUUID } from 'expo-crypto'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Platform } from 'react-native'

import type {
  OfflineWorkLog,
  OfflineWorkLogMutator,
  OfflineWorkLogPhoto,
  OfflineWorkLogPhotoInput,
  QueueOfflineWorkLogOptions,
  SyncStatus,
} from '../types/offline.ts'
import {
  clearOfflineWorkLogs,
  loadOfflineWorkLogs,
  saveOfflineWorkLogs,
} from '../utils/offline-storage.ts'

type FileSystemModule = typeof import('expo-file-system/legacy')

const WORK_LOG_PHOTO_DIR_NAME = 'work-logs-offline'
const DEFAULT_PHOTO_EXTENSION = '.jpg'

const getFileNameFromUri = (uri: string): string | null => {
  try {
    const parts = uri.split(/[/?#]/).pop()
    if (!parts) return null
    const sanitized = parts.split('#')[0]?.split('?')[0]
    return sanitized?.trim() ? sanitized : null
  } catch {
    return null
  }
}

const inferExtensionFromMime = (mimeType: string): string => {
  if (mimeType === 'image/png') return '.png'
  if (mimeType === 'image/webp') return '.webp'
  if (mimeType === 'image/jpeg') return '.jpg'
  return DEFAULT_PHOTO_EXTENSION
}

const estimateBase64Size = (base64: string) => Math.floor((base64.length * 3) / 4)

const isNativePlatform = Platform.OS !== 'web'

const ensureFileSystem = async (): Promise<FileSystemModule | null> => {
  if (!isNativePlatform) {
    return null
  }

  try {
    const FileSystem = await import('expo-file-system/legacy')
    return FileSystem
  } catch (error) {
    console.warn('[work-logs/useOfflineWorkLogs] Unable to load expo-file-system', error)
    return null
  }
}

interface UseOfflineWorkLogsResult {
  offlineWorkLogs: OfflineWorkLog[]
  isLoading: boolean
  queueWorkLog: (options: QueueOfflineWorkLogOptions) => Promise<OfflineWorkLog>
  markWorkLogForSync: (id: string, nextStatus?: SyncStatus) => Promise<void>
  mutateOfflineWorkLog: OfflineWorkLogMutator
  removeOfflineWorkLog: (id: string) => Promise<void>
  refreshOfflineWorkLogs: () => Promise<void>
  resetOfflineWorkLogs: () => Promise<void>
}

export const useOfflineWorkLogs = (): UseOfflineWorkLogsResult => {
  const [offlineWorkLogs, setOfflineWorkLogs] = useState<OfflineWorkLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const photoDirectoryRef = useRef<string | null>(null)
  const fileSystemPromiseRef = useRef<Promise<FileSystemModule | null> | null>(null)

  const getFileSystem = useCallback(async () => {
    if (!fileSystemPromiseRef.current) {
      fileSystemPromiseRef.current = ensureFileSystem()
    }
    return fileSystemPromiseRef.current
  }, [])

  const ensurePhotoDirectory = useCallback(async (): Promise<string | null> => {
    const FileSystem = await getFileSystem()
    if (!FileSystem) {
      return null
    }

    if (photoDirectoryRef.current) {
      return photoDirectoryRef.current
    }

    const baseDirectory = FileSystem.documentDirectory ?? FileSystem.cacheDirectory
    if (!baseDirectory) {
      console.warn('[work-logs/useOfflineWorkLogs] Missing base directory for file storage')
      return null
    }

    const directoryUri = `${baseDirectory.replace(/\/$/, '')}/${WORK_LOG_PHOTO_DIR_NAME}`
    const dirInfo = await FileSystem.getInfoAsync(directoryUri)
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(directoryUri, {
        intermediates: true,
      })
    }

    photoDirectoryRef.current = directoryUri
    return directoryUri
  }, [getFileSystem])

  const loadInitialQueue = useCallback(async () => {
    setIsLoading(true)
    const logs = await loadOfflineWorkLogs()
    setOfflineWorkLogs(logs)
    setIsLoading(false)
  }, [])

  useEffect(() => {
    loadInitialQueue().catch((error) => {
      console.error('[work-logs/useOfflineWorkLogs] Failed to load offline work logs', error)
      setIsLoading(false)
    })
  }, [loadInitialQueue])

  const applyUpdate = useCallback(async (updater: (logs: OfflineWorkLog[]) => OfflineWorkLog[]) => {
    let nextState: OfflineWorkLog[] = []
    setOfflineWorkLogs((previous) => {
      nextState = updater(previous)
      return nextState
    })
    await saveOfflineWorkLogs(nextState)
    return nextState
  }, [])

  const copyPhotoToCache = useCallback(
    async (
      photo: OfflineWorkLogPhotoInput
    ): Promise<Pick<OfflineWorkLogPhoto, 'localUri' | 'size' | 'fileName'>> => {
      const FileSystem = await getFileSystem()
      const directory = await ensurePhotoDirectory()

      if (!FileSystem || !directory || !isNativePlatform) {
        const guessedFileName =
          photo.fileName ??
          getFileNameFromUri(photo.uri) ??
          `${randomUUID()}${inferExtensionFromMime(photo.mimeType)}`
        return {
          localUri: photo.uri,
          size: photo.size ?? 0,
          fileName: guessedFileName,
        }
      }

      const extension =
        photo.fileName?.split('.').pop() ?? inferExtensionFromMime(photo.mimeType).slice(1)
      const fileName =
        photo.fileName ?? getFileNameFromUri(photo.uri) ?? `${randomUUID()}.${extension}`
      const destination = `${directory}/${randomUUID()}-${fileName}`

      try {
        const info = await FileSystem.getInfoAsync(photo.uri)

        if (info.exists && info.isDirectory === false) {
          await FileSystem.copyAsync({
            from: photo.uri,
            to: destination,
          })
          return {
            localUri: destination,
            size: info.size ?? photo.size ?? 0,
            fileName,
          }
        }

        if (photo.uri.startsWith('data:')) {
          const base64String = photo.uri.split(',')[1]
          if (base64String) {
            await FileSystem.writeAsStringAsync(destination, base64String, {
              encoding: FileSystem.EncodingType.Base64,
            })
            return {
              localUri: destination,
              size: estimateBase64Size(base64String),
              fileName,
            }
          }
        }
      } catch (error) {
        console.warn('[work-logs/useOfflineWorkLogs] Unable to cache photo', error)
      }

      return {
        localUri: photo.uri,
        size: photo.size ?? 0,
        fileName,
      }
    },
    [ensurePhotoDirectory, getFileSystem]
  )

  const queueWorkLog = useCallback(
    async (options: QueueOfflineWorkLogOptions) => {
      const now = new Date().toISOString()
      const photos: OfflineWorkLogPhoto[] = []

      if (options.photos?.length) {
        for (const candidate of options.photos) {
          const cached = await copyPhotoToCache(candidate)
          photos.push({
            id: randomUUID(),
            localUri: cached.localUri,
            mimeType: candidate.mimeType,
            fileName: cached.fileName,
            size: cached.size ?? candidate.size ?? 0,
            caption: candidate.caption,
            photoType: candidate.photoType,
            displayOrder: candidate.displayOrder,
            showOnProfile: candidate.showOnProfile,
            takenAt: candidate.takenAt,
            gpsCapture: candidate.gpsCapture,
            status: 'pending',
          })
        }
      }

      const offlineRecord: OfflineWorkLog = {
        id: randomUUID(),
        createdAt: now,
        updatedAt: now,
        payload: options.payload,
        photos,
        syncStatus: options.initialStatus ?? 'pending',
        retryCount: 0,
        nextRetryAt: null,
        lastError: null,
      }

      await applyUpdate((previous) => [...previous, offlineRecord])
      return offlineRecord
    },
    [applyUpdate, copyPhotoToCache]
  )

  const mutateOfflineWorkLog: OfflineWorkLogMutator = useCallback(
    async (id, updater) => {
      let nextValue: OfflineWorkLog | null = null
      await applyUpdate((previous) => {
        const index = previous.findIndex((item) => item.id === id)
        if (index === -1) {
          return previous
        }

        const updated = updater(previous[index])
        if (!updated) {
          nextValue = null
          return previous
        }

        const merged: OfflineWorkLog = {
          ...previous[index],
          ...updated,
          updatedAt: new Date().toISOString(),
          photos: updated.photos ?? previous[index].photos,
        }

        const clone = [...previous]
        clone[index] = merged
        nextValue = merged
        return clone
      })

      return nextValue
    },
    [applyUpdate]
  )

  const removePhotoFromDisk = useCallback(
    async (uri: string) => {
      const FileSystem = await getFileSystem()
      if (!FileSystem) {
        return
      }

      try {
        const info = await FileSystem.getInfoAsync(uri)
        if (info.exists) {
          await FileSystem.deleteAsync(uri, { idempotent: true })
        }
      } catch (error) {
        console.warn('[work-logs/useOfflineWorkLogs] Unable to delete cached photo', error)
      }
    },
    [getFileSystem]
  )

  const removeOfflineWorkLog = useCallback(
    async (id: string) => {
      const current = offlineWorkLogs.find((entry) => entry.id === id)
      if (current?.photos?.length) {
        await Promise.all(
          current.photos.map((photo) => removePhotoFromDisk(photo.localUri).catch(() => undefined))
        )
      }

      await applyUpdate((previous) => previous.filter((workLog) => workLog.id !== id))
    },
    [applyUpdate, offlineWorkLogs, removePhotoFromDisk]
  )

  const markWorkLogForSync = useCallback(
    async (id: string, nextStatus: SyncStatus = 'queued') => {
      await mutateOfflineWorkLog(id, (current) => ({
        ...current,
        syncStatus: nextStatus,
        lastError: null,
        nextRetryAt: null,
      }))
    },
    [mutateOfflineWorkLog]
  )

  const refreshOfflineWorkLogs = useCallback(async () => {
    const refreshed = await loadOfflineWorkLogs()
    setOfflineWorkLogs(refreshed)
  }, [])

  const resetOfflineWorkLogs = useCallback(async () => {
    await clearOfflineWorkLogs()
    setOfflineWorkLogs([])
  }, [])

  return {
    offlineWorkLogs,
    isLoading,
    queueWorkLog,
    markWorkLogForSync,
    mutateOfflineWorkLog,
    removeOfflineWorkLog,
    refreshOfflineWorkLogs,
    resetOfflineWorkLogs,
  }
}
