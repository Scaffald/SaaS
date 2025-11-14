import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react'

type HighlightStatus = 'added' | 'removed'

export interface ProfileCertificationsHighlightContextValue {
  highlights: Record<string, HighlightStatus>
  triggerHighlight: (certId: string, status: HighlightStatus) => void
}

const ProfileCertificationsHighlightContext = createContext<
  ProfileCertificationsHighlightContextValue | undefined
>(undefined)

export function ProfileCertificationsHighlightProvider({ children }: PropsWithChildren) {
  const [highlights, setHighlights] = useState<Record<string, HighlightStatus>>({})
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const triggerHighlight = useCallback((certId: string, status: HighlightStatus) => {
    setHighlights((prev) => ({ ...prev, [certId]: status }))

    if (timers.current[certId]) {
      clearTimeout(timers.current[certId])
    }

    timers.current[certId] = setTimeout(() => {
      setHighlights((prev) => {
        const next = { ...prev }
        delete next[certId]
        return next
      })

      delete timers.current[certId]
    }, 3000)
  }, [])

  useEffect(() => {
    return () => {
      for (const timer of Object.values(timers.current)) {
        clearTimeout(timer)
      }
    }
  }, [])

  const value = useMemo(
    () => ({
      highlights,
      triggerHighlight,
    }),
    [highlights, triggerHighlight]
  )

  return (
    <ProfileCertificationsHighlightContext.Provider value={value}>
      {children}
    </ProfileCertificationsHighlightContext.Provider>
  )
}

export function useProfileCertificationsHighlight(): ProfileCertificationsHighlightContextValue {
  const ctx = useContext(ProfileCertificationsHighlightContext)
  if (!ctx) {
    throw new Error(
      'useProfileCertificationsHighlight must be used within ProfileCertificationsHighlightProvider'
    )
  }
  return ctx
}

