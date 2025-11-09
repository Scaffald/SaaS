import { useEffect, useState } from 'react'

export type ProfileSyncStatus = 'idle' | 'syncing' | 'error'

let status: ProfileSyncStatus = 'idle'
let inFlight = 0
let syncStartTime: number | null = null
const listeners = new Set<(next: ProfileSyncStatus) => void>()

const notify = () => {
  for (const listener of listeners) {
    listener(status)
  }
}

const setStatus = (next: ProfileSyncStatus) => {
  status = next
  notify()
}

export const startProfileSync = () => {
  const isFirstInFlight = inFlight === 0
  inFlight += 1
  if (status !== 'error') {
    if (isFirstInFlight) {
      syncStartTime = Date.now()
    }
    setStatus('syncing')
  }
}

export const completeProfileSync = () => {
  inFlight = Math.max(0, inFlight - 1)
  if (inFlight === 0 && status !== 'error') {
    syncStartTime = null
    setStatus('idle')
  }
}

export const failProfileSync = () => {
  inFlight = Math.max(0, inFlight - 1)
  syncStartTime = null
  setStatus('error')
}

export const resetProfileSyncError = () => {
  if (status === 'error') {
    setStatus(inFlight > 0 ? 'syncing' : 'idle')
  }
}

export const useProfileSyncStatus = (): ProfileSyncStatus => {
  const [current, setCurrent] = useState<ProfileSyncStatus>(status)

  useEffect(() => {
    listeners.add(setCurrent)
    return () => {
      listeners.delete(setCurrent)
    }
  }, [])

  return current
}

export const useAdaptiveProfileSync = (delayMs = 300): ProfileSyncStatus => {
  const actualStatus = useProfileSyncStatus()
  const [displayStatus, setDisplayStatus] = useState<ProfileSyncStatus>(() => {
    if (actualStatus === 'syncing') {
      const elapsed = syncStartTime ? Date.now() - syncStartTime : 0
      if (elapsed >= delayMs) {
        return 'syncing'
      }
    }
    return actualStatus
  })

  useEffect(() => {
    if (actualStatus === 'syncing') {
      const elapsed = syncStartTime ? Date.now() - syncStartTime : 0
      if (elapsed >= delayMs) {
        setDisplayStatus('syncing')
        return
      }

      const remaining = delayMs - elapsed
      const timer = setTimeout(() => {
        setDisplayStatus('syncing')
      }, remaining)

      return () => {
        clearTimeout(timer)
      }
    }

    setDisplayStatus(actualStatus)
    return undefined
  }, [actualStatus, delayMs])

  return displayStatus
}

