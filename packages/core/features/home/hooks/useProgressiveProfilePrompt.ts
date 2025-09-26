import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useHireScore, type HireScoreFactorResult } from './useHireScore'
import {
  PROGRESSIVE_PROMPT_REGISTRY,
  type ProgressivePromptDefinition,
  type ProgressivePromptSurface,
} from '../progressive-tasks'

const STORAGE_KEY = 'progressive-profile-prompts'
const ONE_DAY_MS = 24 * 60 * 60 * 1000

type PromptStorageEntry = {
  lastShownAt?: string
  lastCompletedAt?: string
}

type PromptStorage = Record<string, PromptStorageEntry>

type UseProgressiveProfilePromptOptions = {
  surface?: ProgressivePromptSurface
}

export type ProgressivePrompt = ProgressivePromptDefinition & {
  factor?: HireScoreFactorResult
  completed: boolean
  coolingDown: boolean
}

type PromptStatus = {
  prompt: ProgressivePrompt
  raw: ProgressivePromptDefinition
}

const readStorage = (): PromptStorage => {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object') {
      return parsed as PromptStorage
    }
  } catch (error) {
    console.warn('Failed to read progressive prompt storage', error)
  }
  return {}
}

const persistStorage = (value: PromptStorage) => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
  } catch (error) {
    console.warn('Failed to persist progressive prompt storage', error)
  }
}

const isCoolingDown = (entry: PromptStorageEntry | undefined, cooldownDays: number) => {
  if (!entry?.lastShownAt) return false
  const lastShown = new Date(entry.lastShownAt).getTime()
  if (Number.isNaN(lastShown)) return false
  const now = Date.now()
  return now - lastShown < cooldownDays * ONE_DAY_MS
}

export const useProgressiveProfilePrompt = (options: UseProgressiveProfilePromptOptions = {}) => {
  const hireScore = useHireScore()
  const [storage, setStorage] = useState<PromptStorage>({})
  const seenPromptRef = useRef<string | null>(null)
  const surface = options.surface

  useEffect(() => {
    setStorage(readStorage())
  }, [])

  const definitions = useMemo(() => {
    if (!surface) return PROGRESSIVE_PROMPT_REGISTRY
    return PROGRESSIVE_PROMPT_REGISTRY.filter((definition) => definition.surfaces.includes(surface))
  }, [surface])

  const prompts: PromptStatus[] = useMemo(() => {
    return definitions.map((definition) => {
      const factor = definition.factorId
        ? hireScore.factors.find((item) => item.id === definition.factorId)
        : undefined

      const storageEntry = storage[definition.id]
      const completed = Boolean(factor?.completed)
      const prompt: ProgressivePrompt = {
        ...definition,
        factor,
        completed,
        coolingDown: isCoolingDown(storageEntry, definition.cooldownDays),
      }

      return { prompt, raw: definition }
    })
  }, [definitions, hireScore.factors, storage])

  const pendingPrompts = useMemo(() => {
    return prompts
      .filter((item) => !item.prompt.completed && !item.prompt.coolingDown)
      .sort((a, b) => b.prompt.priority - a.prompt.priority)
  }, [prompts])

  const activePrompt = pendingPrompts[0]?.prompt

  const updateStorage = useCallback((updater: (value: PromptStorage) => PromptStorage) => {
    setStorage((current) => {
      const next = updater(current)
      persistStorage(next)
      return next
    })
  }, [])

  const markPromptSeen = useCallback(
    (promptId: string) => {
      updateStorage((current) => ({
        ...current,
        [promptId]: {
          ...current[promptId],
          lastShownAt: new Date().toISOString(),
        },
      }))
      seenPromptRef.current = promptId
    },
    [updateStorage]
  )

  useEffect(() => {
    if (!activePrompt) return
    if (seenPromptRef.current === activePrompt.id) return
    markPromptSeen(activePrompt.id)
  }, [activePrompt, markPromptSeen])

  const markPromptCompleted = useCallback(
    (promptId: string) => {
      updateStorage((current) => ({
        ...current,
        [promptId]: {
          ...current[promptId],
          lastCompletedAt: new Date().toISOString(),
          lastShownAt: new Date().toISOString(),
        },
      }))
    },
    [updateStorage]
  )

  return {
    prompt: activePrompt,
    prompts: prompts.map((item) => item.prompt),
    pendingPrompts: pendingPrompts.map((item) => item.prompt),
    markPromptSeen,
    markPromptCompleted,
    storage,
    isLoading: hireScore.isLoading,
  }
}
