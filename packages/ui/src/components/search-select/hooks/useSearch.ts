import Fuse from 'fuse.js'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type {
  SearchResultOrigin,
  SearchSelectHighlightRange,
  SearchSelectOption,
  UseSearchResult,
} from '../types'

type FuseMatch = NonNullable<Fuse.FuseResult<unknown>['matches']>[number]

const DEFAULT_DEBOUNCE_MS = 300
const DEFAULT_MIN_SEARCH_LENGTH = 2

interface UseSearchConfig<T> {
  options?: T[]
  onSearch?: (query: string) => Promise<T[]>
  getOptionLabel: (option: T) => string
  getOptionValue: (option: T) => string | number
  getOptionDescription?: (option: T) => string | undefined
  debounceMs?: number
  minSearchLength?: number
  enableFuzzyMatch?: boolean
  enableHighlight?: boolean
}

interface FuseSource<T> extends SearchSelectOption<T> {
  searchable: string
}

const toSearchable = (label: string, description?: string) =>
  [label, description].filter(Boolean).join(' ')

export function useSearch<T>(config: UseSearchConfig<T>): UseSearchResult<T> {
  const {
    options = [],
    onSearch,
    getOptionLabel,
    getOptionValue,
    getOptionDescription,
    debounceMs = DEFAULT_DEBOUNCE_MS,
    minSearchLength = DEFAULT_MIN_SEARCH_LENGTH,
    enableFuzzyMatch = true,
    enableHighlight = true,
  } = config

  const [query, setQuery] = useState('')
  const [localResults, setLocalResults] = useState<SearchSelectOption<T>[]>([])
  const [remoteResults, setRemoteResults] = useState<SearchSelectOption<T>[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mountedRef = useRef(true)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const normalizeOption = useCallback(
    (option: T, origin: SearchResultOrigin, highlightRanges?: SearchSelectHighlightRange[]) => {
      const value = String(getOptionValue(option))
      const description = getOptionDescription?.(option)

      return {
        raw: option,
        label: getOptionLabel(option),
        value,
        description,
        meta: {
          origin,
          ...(highlightRanges ? { highlightRanges } : null),
        },
      }
    },
    [getOptionLabel, getOptionValue, getOptionDescription]
  )

  const normalizedStaticOptions: FuseSource<T>[] = useMemo(() => {
    return options.map((option) => {
      const normalized = normalizeOption(option, 'static')
      return {
        ...normalized,
        searchable: toSearchable(normalized.label, normalized.description),
      }
    })
  }, [normalizeOption, options])

  const fuse = useMemo(() => {
    if (!enableFuzzyMatch || normalizedStaticOptions.length === 0) {
      return null
    }

    return new Fuse(normalizedStaticOptions, {
      keys: ['label', 'description', 'searchable'],
      includeMatches: true,
      threshold: 0.35,
      ignoreLocation: true,
      minMatchCharLength: 1,
    })
  }, [enableFuzzyMatch, normalizedStaticOptions])

  const buildHighlightRanges = useCallback(
    (matches: FuseMatch[] | undefined) => {
      if (!enableHighlight || !matches) {
        return undefined
      }

      const ranges: SearchSelectHighlightRange[] = []
      for (const match of matches) {
        if (match.key && match.key !== 'label') {
          continue
        }
        for (const [start, end] of match.indices) {
          ranges.push({ start, end })
        }
      }
      return ranges.length ? ranges : undefined
    },
    [enableHighlight]
  )

  const setDefaultLocalResults = useCallback(
    () => setLocalResults(normalizedStaticOptions),
    [normalizedStaticOptions]
  )

  // Filter static options with current query
  const filterLocalResults = useCallback(
    (searchQuery: string) => {
      const trimmed = searchQuery.trim()
      if (!trimmed) {
        setDefaultLocalResults()
      } else if (enableFuzzyMatch && fuse) {
        const fuseResults = fuse.search(trimmed)
        const mapped = fuseResults.map((result) => ({
          ...result.item,
          meta: {
            ...(result.item.meta ?? {}),
            origin: 'static' as const,
            highlightRanges: buildHighlightRanges(result.matches),
          },
        }))
        setLocalResults(mapped)
      } else {
        const filtered = normalizedStaticOptions.filter((option) =>
          option.searchable.toLowerCase().includes(trimmed.toLowerCase())
        )
        const normalized = filtered.map((option) => ({
          ...option,
          meta: {
            ...(option.meta ?? {}),
            origin: 'static' as const,
          },
        }))
        setLocalResults(normalized)
      }
    },
    [enableFuzzyMatch, fuse, normalizedStaticOptions, buildHighlightRanges, setDefaultLocalResults]
  )

  // When options update, re-filter with current query if there is one
  useEffect(() => {
    if (query) {
      filterLocalResults(query)
    } else {
      setDefaultLocalResults()
    }
  }, [normalizedStaticOptions, query, filterLocalResults, setDefaultLocalResults])

  useEffect(() => {
    return () => {
      mountedRef.current = false
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  const performRemoteSearch = useCallback(
    async (searchTerm: string) => {
      if (!onSearch) {
        return
      }

      const trimmed = searchTerm.trim()
      if (trimmed.length < minSearchLength) {
        setRemoteResults([])
        setIsSearching(false)
        return
      }

      abortControllerRef.current?.abort()
      const controller = new AbortController()
      abortControllerRef.current = controller
      setIsSearching(true)
      setError(null)

      try {
        const nextResults = await onSearch(trimmed)
        if (controller.signal.aborted || !mountedRef.current) {
          return
        }
        const normalized = nextResults.map((option) => normalizeOption(option, 'remote'))
        setRemoteResults(normalized)
      } catch (err) {
        if (controller.signal.aborted || !mountedRef.current) {
          return
        }
        const message = err instanceof Error ? err.message : 'Search failed'
        setError(message)
      } finally {
        if (!controller.signal.aborted && mountedRef.current) {
          setIsSearching(false)
        }
      }
    },
    [minSearchLength, normalizeOption, onSearch]
  )

  const scheduleRemoteSearch = useCallback(
    (searchTerm: string) => {
      if (!onSearch) {
        return
      }

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }

      debounceTimerRef.current = setTimeout(() => {
        performRemoteSearch(searchTerm)
      }, debounceMs)
    },
    [debounceMs, onSearch, performRemoteSearch]
  )

  const handleQueryChange = useCallback(
    (next: string) => {
      setQuery(next)

      const trimmed = next.trim()
      if (!trimmed) {
        setRemoteResults([])
        setError(null)
      }

      // Filter local results with the query
      filterLocalResults(next)

      if (onSearch && trimmed) {
        scheduleRemoteSearch(trimmed)
      }
    },
    [onSearch, scheduleRemoteSearch, filterLocalResults]
  )

  const clearResults = useCallback(() => {
    setQuery('')
    setError(null)
    setRemoteResults([])
    setDefaultLocalResults()
  }, [setDefaultLocalResults])

  const refresh = useCallback(async () => {
    if (!onSearch) {
      return
    }
    await performRemoteSearch(query)
  }, [onSearch, performRemoteSearch, query])

  const mergedResults = useMemo(() => {
    if (!remoteResults.length) {
      return localResults
    }

    const seen = new Set<string>()
    const combined: SearchSelectOption<T>[] = []

    const pushUnique = (option: SearchSelectOption<T>) => {
      if (seen.has(option.value)) {
        return
      }
      seen.add(option.value)
      combined.push(option)
    }

    localResults.forEach(pushUnique)
    remoteResults.forEach(pushUnique)
    return combined
  }, [localResults, remoteResults])

  return {
    query,
    results: mergedResults,
    isSearching,
    error,
    handleQueryChange,
    clearResults,
    refresh,
  }
}
