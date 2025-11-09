import { useEffect, useState } from 'react'

export type ProfileSyncStatus = 'idle' | 'syncing' | 'error'

let status: ProfileSyncStatus = 'idle'
let inFlight = 0
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
  inFlight += 1
  if (status !== 'error') {
    setStatus('syncing')
  }
}

export const completeProfileSync = () => {
  inFlight = Math.max(0, inFlight - 1)
  if (inFlight === 0 && status !== 'error') {
    setStatus('idle')
  }
}

export const failProfileSync = () => {
  inFlight = Math.max(0, inFlight - 1)
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

