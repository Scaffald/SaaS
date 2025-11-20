import { api } from '@app/core/utils/api'
import { supabase } from '@app/core/utils/supabase/client'
import { NetInfoStateType, useNetInfo } from '@react-native-community/netinfo'
import { Buffer } from 'buffer'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Platform } from 'react-native'

import type {
  OfflineWorkLog,
  OfflineWorkLogMutator,
  OfflineWorkLogPhoto,
  SyncSettings,
  SyncStatus,
} from '../types/offline'
import { DEFAULT_SYNC_SETTINGS } from '../types/offline'
import { loadSyncSettings, saveSyncSettings } from '../utils/offline-storage'

const WORK_LOG_PHOTO_BUCKET = 'work-log-photos'
const BASE_RETRY_DELAY_MS = 5000
const MAX_RETRY_DELAY_MS = 5 * 60 * 1000

type FileSystemModule = typeof import('expo-file-system/legacy')

const ensureFileSystem = async (): Promise<FileSystemModule | null> => {
  if (Platform.OS === 'web') {
    return null
  }

  try {
    const FileSystem = await import('expo-file-system/legacy')
    return FileSystem
  } catch (error) {
    console.warn('[work-logs/useWorkLogSync] Unable to load expo-file-system', error)
    return null
  }
}

const computeBackoffDelay = (retryCount: number) => {
  const delay = BASE_RETRY_DELAY_MS * 2 ** Math.max(retryCount - 1, 0)
  return Math.min(delay, MAX_RETRY_DELAY_MS)
}

const createSyncError = (error: unknown): Error =>
  error instanceof Error ? error : new Error(String(error))

interface UseWorkLogSyncOptions {
  offlineWorkLogs: OfflineWorkLog[]
  markWorkLogForSync: (id: string, nextStatus?: SyncStatus) => Promise<void>
  mutateOfflineWorkLog: OfflineWorkLogMutator
  removeOfflineWorkLog: (id: string) => Promise<void>
}

interface UseWorkLogSyncResult {
  isSyncing: boolean
  lastSyncError: string | null
  syncSettings: SyncSettings
  settingsLoaded: boolean
  pendingSyncCount: number
  isOnline: boolean
  isWifiConnection: boolean
  syncNow: () => Promise<void>
  queueWorkLogForSync: (id: string) => Promise<void>
  updateSyncSettings: (updates: Partial<SyncSettings>) => Promise<void>
}

export const useWorkLogSync = ({
  offlineWorkLogs,
  markWorkLogForSync,
  mutateOfflineWorkLog,
  removeOfflineWorkLog,
}: UseWorkLogSyncOptions): UseWorkLogSyncResult => {
  const netInfo = useNetInfo()
  const [syncSettings, setSyncSettings] = useState<SyncSettings>(DEFAULT_SYNC_SETTINGS)
  const [settingsLoaded, setSettingsLoaded] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSyncError, setLastSyncError] = useState<string | null>(null)
  const syncInProgressRef = useRef(false)
  const fileSystemPromiseRef = useRef<Promise<FileSystemModule | null> | null>(null)

  const createWorkLogMutation = api.workLogs.create.useMutation()
  const updateWorkLogMutation = api.workLogs.update.useMutation()
  const uploadPhotoMutation = api.workLogs.uploadPhoto.useMutation()

  useEffect(() => {
    loadSyncSettings()
      .then((settings) => {
        setSyncSettings(settings)
        setSettingsLoaded(true)
      })
      .catch((error) => {
        console.error('[work-logs/useWorkLogSync] Failed to load sync settings', error)
        setSettingsLoaded(true)
      })
  }, [])

  const ensureFileSystemModule = useCallback(() => {
    if (!fileSystemPromiseRef.current) {
      fileSystemPromiseRef.current = ensureFileSystem()
    }
    return fileSystemPromiseRef.current
  }, [])

  const isOnline =
    Boolean(netInfo.isConnected) &&
    netInfo.isInternetReachable !== false &&
    netInfo.isInternetReachable !== null
  const isWifiConnection =
    netInfo.type === NetInfoStateType.wifi || netInfo.type === NetInfoStateType.ethernet

  const pendingSyncCount = useMemo(
    () =>
      offlineWorkLogs.filter((log) => ['pending', 'queued', 'syncing'].includes(log.syncStatus))
        .length,
    [offlineWorkLogs]
  )

  const updateSyncSettings = useCallback(
    async (updates: Partial<SyncSettings>) => {
      const next = { ...syncSettings, ...updates }
      setSyncSettings(next)
      await saveSyncSettings(next)
    },
    [syncSettings]
  )

  const queueWorkLogForSync = useCallback(
    async (id: string) => {
      await markWorkLogForSync(id, 'queued')
    },
    [markWorkLogForSync]
  )

  const syncOfflineWorkLog = useCallback(
    async (entry: OfflineWorkLog) => {
      const FileSystem = await ensureFileSystemModule()
      const payload = entry.payload
      let remoteWorkLogId: string

      if (payload.kind === 'create') {
        const created = await createWorkLogMutation.mutateAsync(payload.input)
        remoteWorkLogId = created.id
      } else {
        const updated = await updateWorkLogMutation.mutateAsync(payload.input)
        remoteWorkLogId = payload.input.workLogId ?? updated.workLog?.id ?? updated.id
      }

      if (!entry.photos.length) {
        return
      }

      if (!FileSystem) {
        throw new Error('File system unavailable for photo upload.')
      }

      for (const photo of entry.photos) {
        if (photo.status === 'uploaded') {
          continue
        }

        const base64 = await FileSystem.readAsStringAsync(photo.localUri, {
          encoding: FileSystem.EncodingType.Base64,
        })
        const fileBuffer = Uint8Array.from(Buffer.from(base64, 'base64'))

        const uploadRequest = await uploadPhotoMutation.mutateAsync({
          workLogId: remoteWorkLogId,
          fileName: photo.fileName,
          fileSizeBytes: photo.size,
          contentType: photo.mimeType,
          caption: photo.caption ?? undefined,
          photoType: photo.photoType ?? undefined,
          displayOrder: photo.displayOrder ?? undefined,
          showOnProfile: photo.showOnProfile ?? undefined,
          takenAt: photo.takenAt ?? undefined,
          gpsCapture: photo.gpsCapture ?? undefined,
        })

        const uploadPath =
          uploadRequest.filePath ??
          uploadRequest.photo?.file_path ??
          `${remoteWorkLogId}/${photo.fileName}`

        const { error: uploadError } = await supabase.storage
          .from(WORK_LOG_PHOTO_BUCKET)
          .uploadToSignedUrl(uploadPath, uploadRequest.token, fileBuffer, {
            contentType: photo.mimeType,
            upsert: false,
          })

        if (uploadError) {
          throw new Error(uploadError.message ?? 'Unable to upload work log photo.')
        }

        await mutateOfflineWorkLog(entry.id, (current) => {
          const photos = current.photos.map<OfflineWorkLogPhoto>((candidate) =>
            candidate.id === photo.id
              ? { ...candidate, status: 'uploaded' as const, lastError: null }
              : candidate
          )
          return { ...current, photos }
        })
      }
    },
    [
      createWorkLogMutation,
      ensureFileSystemModule,
      mutateOfflineWorkLog,
      updateWorkLogMutation,
      uploadPhotoMutation,
    ]
  )

  const processQueue = useCallback(
    async (force = false) => {
      if (syncInProgressRef.current) {
        return
      }

      if (!isOnline && !force) {
        return
      }

      if (syncSettings.syncOverWifiOnly && !isWifiConnection && !force) {
        return
      }

      syncInProgressRef.current = true
      setIsSyncing(true)
      setLastSyncError(null)

      try {
        const now = Date.now()
        const items = [...offlineWorkLogs].sort((a, b) => a.createdAt.localeCompare(b.createdAt))

        for (const entry of items) {
          const shouldSkipDueToRetry =
            entry.nextRetryAt && new Date(entry.nextRetryAt).getTime() > now && !force

          if (shouldSkipDueToRetry) {
            continue
          }

          if (entry.syncStatus === 'pending' || entry.syncStatus === 'failed') {
            if (entry.retryCount >= syncSettings.maxRetries && !force) {
              continue
            }

            await markWorkLogForSync(entry.id, 'queued')
          }

          if (entry.syncStatus !== 'queued') {
            continue
          }

          await mutateOfflineWorkLog(entry.id, (current) => ({
            ...current,
            syncStatus: 'syncing',
            lastError: null,
          }))

          try {
            await syncOfflineWorkLog(entry)
            await removeOfflineWorkLog(entry.id)
            const timestamp = new Date().toISOString()
            setSyncSettings((previous) => {
              const next = {
                ...previous,
                lastSyncedAt: timestamp,
              }
              void saveSyncSettings(next)
              return next
            })
          } catch (error) {
            const syncError = createSyncError(error)
            setLastSyncError(syncError.message)

            await mutateOfflineWorkLog(entry.id, (current) => {
              const retryCount = current.retryCount + 1
              const reachedLimit = retryCount >= syncSettings.maxRetries && !force
              const delayMs = computeBackoffDelay(retryCount)
              const nextRetryAt = reachedLimit ? null : new Date(Date.now() + delayMs).toISOString()
              return {
                ...current,
                retryCount,
                syncStatus: reachedLimit ? 'failed' : 'queued',
                nextRetryAt,
                lastError: syncError.message,
              }
            })
          }
        }
      } finally {
        syncInProgressRef.current = false
        setIsSyncing(false)
      }
    },
    [
      isOnline,
      isWifiConnection,
      markWorkLogForSync,
      mutateOfflineWorkLog,
      offlineWorkLogs,
      removeOfflineWorkLog,
      syncOfflineWorkLog,
      syncSettings.maxRetries,
      syncSettings.syncOverWifiOnly,
    ]
  )

  useEffect(() => {
    if (!settingsLoaded) {
      return
    }

    if (!syncSettings.autoSync) {
      return
    }

    if (!isOnline) {
      return
    }

    if (syncSettings.syncOverWifiOnly && !isWifiConnection) {
      return
    }

    const pendingEntries = offlineWorkLogs.filter((entry) => entry.syncStatus === 'pending')

    if (pendingEntries.length > 0) {
      void Promise.all(pendingEntries.map((entry) => markWorkLogForSync(entry.id, 'queued')))
    }
  }, [
    isOnline,
    isWifiConnection,
    markWorkLogForSync,
    offlineWorkLogs,
    settingsLoaded,
    syncSettings.autoSync,
    syncSettings.syncOverWifiOnly,
  ])

  useEffect(() => {
    if (!settingsLoaded) {
      return
    }

    if (!syncSettings.autoSync) {
      return
    }

    if (!isOnline) {
      return
    }

    if (syncSettings.syncOverWifiOnly && !isWifiConnection) {
      return
    }

    const hasQueued = offlineWorkLogs.some((entry) => entry.syncStatus === 'queued')

    if (hasQueued && !syncInProgressRef.current) {
      void processQueue()
    }
  }, [
    isOnline,
    isWifiConnection,
    offlineWorkLogs,
    processQueue,
    settingsLoaded,
    syncSettings.autoSync,
    syncSettings.syncOverWifiOnly,
  ])

  const syncNow = useCallback(async () => {
    if (!offlineWorkLogs.length) {
      return
    }

    await Promise.all(offlineWorkLogs.map((entry) => markWorkLogForSync(entry.id, 'queued')))
    await processQueue(true)
  }, [offlineWorkLogs, markWorkLogForSync, processQueue])

  return {
    isSyncing,
    lastSyncError,
    syncSettings,
    settingsLoaded,
    pendingSyncCount,
    isOnline,
    isWifiConnection,
    syncNow,
    queueWorkLogForSync,
    updateSyncSettings,
  }
}
