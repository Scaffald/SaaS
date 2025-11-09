import { useCallback, useEffect, useRef, useState } from 'react'
import { getNextNudgeMessage, type NudgeMessage } from '../utils/nudgeMessages'

interface UseCompletionNudgesOptions {
  userType: 'worker' | 'employer'
  incompleteSections: string[]
}

interface UseCompletionNudgesReturn {
  currentMessage: NudgeMessage | null
  advanceMessage: () => void
}

const SESSION_STORAGE_KEY = 'profile_completion_last_message_id'

export function useCompletionNudges({ userType, incompleteSections }: UseCompletionNudgesOptions): UseCompletionNudgesReturn {
  const [currentMessage, setCurrentMessage] = useState<NudgeMessage | null>(null)
  const storedIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (typeof sessionStorage !== 'undefined') {
      storedIdRef.current = sessionStorage.getItem(SESSION_STORAGE_KEY)
    }

    const next = getNextNudgeMessage({
      lastMessageId: storedIdRef.current,
      userType,
      incompleteSections,
    })

    setCurrentMessage(next)
  }, [userType, incompleteSections])

  const advanceMessage = useCallback(() => {
    setCurrentMessage((previous) => {
      const lastId = previous?.id ?? storedIdRef.current

      const next = getNextNudgeMessage({
        lastMessageId: lastId,
        userType,
        incompleteSections,
      })

      if (next && typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(SESSION_STORAGE_KEY, next.id)
        storedIdRef.current = next.id
      }

      return next
    })
  }, [userType, incompleteSections])

  return {
    currentMessage,
    advanceMessage,
  }
}


