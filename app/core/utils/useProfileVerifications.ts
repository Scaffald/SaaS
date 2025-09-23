import type { Database } from '@app/supabase/types'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo } from 'react'

import { useSupabase } from './supabase/useSupabase'

const SUBJECT_TYPES = ['profile', 'user', 'user_private'] as const

type SubjectType = (typeof SUBJECT_TYPES)[number]

type ProfileVerificationRow = Pick<
  Database['public']['Tables']['profile_verifications']['Row'],
  | 'id'
  | 'subject_type'
  | 'subject_id'
  | 'field'
  | 'verified_at'
  | 'verified_by'
  | 'revoked_at'
  | 'source'
  | 'notes'
>

type ActiveVerificationMap = Record<string, ProfileVerificationRow>

export type ProfileVerificationState = {
  records: ProfileVerificationRow[]
  activeByField: ActiveVerificationMap
  activeFields: string[]
  isVerified: (field: string | string[]) => boolean
  isPending: boolean
  refetch: () => Promise<unknown>
}

export const useProfileVerifications = (
  subjectId?: string | null,
  subjectTypes: SubjectType[] = SUBJECT_TYPES
): ProfileVerificationState => {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['profile-verifications', subjectId, subjectTypes.join(':')],
    enabled: Boolean(subjectId),
    queryFn: async () => {
      if (!subjectId) return [] as ProfileVerificationRow[]

      const { data, error } = await supabase
        .from('profile_verifications')
        .select(
          'id, subject_type, subject_id, field, verified_at, verified_by, revoked_at, source, notes'
        )
        .eq('subject_id', subjectId)
        .in('subject_type', subjectTypes)
        .order('verified_at', { ascending: false })

      if (error) {
        throw new Error(error.message)
      }

      return (data ?? []) as ProfileVerificationRow[]
    },
  })

  useEffect(() => {
    if (!subjectId) return

    const channel = supabase
      .channel(`profile-verifications:${subjectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profile_verifications',
          filter: `subject_id=eq.${subjectId}`,
        },
        () => {
          queryClient
            .invalidateQueries({
              queryKey: ['profile-verifications', subjectId, subjectTypes.join(':')],
            })
            .catch(() => {})
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [queryClient, subjectId, subjectTypes, supabase])

  const activeByField = useMemo<ActiveVerificationMap>(() => {
    const entries: ActiveVerificationMap = {}
    for (const row of query.data ?? []) {
      if (!row.field || row.revoked_at) continue
      entries[row.field] = row
    }
    return entries
  }, [query.data])

  const isVerified = useCallback(
    (field: string | string[]) => {
      if (Array.isArray(field)) {
        return field.some((name) => Boolean(activeByField[name]))
      }
      return Boolean(activeByField[field])
    },
    [activeByField]
  )

  return {
    records: query.data ?? [],
    activeByField,
    activeFields: Object.keys(activeByField),
    isVerified,
    isPending: query.isPending,
    refetch: async () => query.refetch(),
  }
}
