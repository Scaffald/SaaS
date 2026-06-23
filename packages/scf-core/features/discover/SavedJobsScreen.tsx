/**
 * Saved Jobs — the "revisit" half of save/revisit (SC-34 / SC-134).
 * Pairs the saved-job follow rows with the published-jobs data the discover
 * list already renders, so we reuse InternalJobCard with zero shape risk.
 */
import { useMemo } from 'react'
import { ScrollView } from 'react-native'
import { Bookmark } from 'lucide-react-native'
import { Spinner, Stack, Text, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { usePublishedJobs, useSavedJobIds } from '@scf/core/utils/jobs-sdk-hooks'
import { type InternalJob, InternalJobCard } from './components/InternalJobCard'

export function SavedJobsScreen() {
  const { theme } = useThemeContext()
  const savedQuery = useSavedJobIds({ limit: 100 })
  const jobsQuery = usePublishedJobs({ limit: 100 })

  const isLoading = savedQuery.isLoading || jobsQuery.isLoading

  const savedJobs = useMemo(() => {
    const savedIds = new Set(
      (savedQuery.data?.data ?? []).map((f) => f.followee_id),
    )
    if (savedIds.size === 0) return [] as InternalJob[]
    const published = (jobsQuery.data?.data ?? []) as InternalJob[]
    return published.filter((j) => savedIds.has(j.id))
  }, [savedQuery.data, jobsQuery.data])

  if (isLoading) {
    return (
      <Stack align="center" justify="center" gap={12} style={{ paddingVertical: 48 }}>
        <Spinner size="lg" />
        <Text style={{ color: colors.text[theme].secondary }}>Loading saved jobs…</Text>
      </Stack>
    )
  }

  if (savedJobs.length === 0) {
    return (
      <Stack align="center" gap={8} style={{ padding: 32 }} testID="saved-jobs-empty">
        <Bookmark size={32} color={colors.icon[theme].muted} />
        <Text weight="semibold" style={{ color: colors.text[theme].primary, textAlign: 'center' }}>
          No saved jobs yet
        </Text>
        <Text size="sm" style={{ color: colors.text[theme].secondary, textAlign: 'center' }}>
          Tap the bookmark on any job to save it here for later.
        </Text>
      </Stack>
    )
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
      <Stack gap={12} testID="saved-jobs-list">
        <Text style={{ color: colors.text[theme].secondary, fontSize: 13 }}>
          {savedJobs.length} saved {savedJobs.length === 1 ? 'job' : 'jobs'}
        </Text>
        {savedJobs.map((job) => (
          <InternalJobCard key={job.id} job={job} />
        ))}
      </Stack>
    </ScrollView>
  )
}
