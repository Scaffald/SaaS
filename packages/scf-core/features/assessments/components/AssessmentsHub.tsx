import { useMemo, useState } from 'react'
import { useRouter } from 'expo-router'
import {
  Button,
  ListToolbar,
  Row,
  Skeleton,
  SkeletonGroup,
  Stack,
  Tabs,
  Text,
  useThemeContext,
} from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { useAssessmentCatalogue } from '../assessment-catalogue'

/**
 * The assessments hub: one list, with status.
 *
 * It was four marketing cards — a title, a paragraph, a full-width filled
 * button each — and no indication anywhere of which ones the viewer had
 * already done. A worker who had finished three of the four saw the same
 * screen as one who had finished none, with four equally loud calls to
 * action inviting them to start over.
 *
 * Rows on hairlines, each saying what it proves, how long it takes and
 * whether it is done, with one action that changes accordingly. The tabs
 * partition the same list rather than filtering a different one.
 */

type HubFilter = 'all' | 'available' | 'completed'

const FILTERS: { key: HubFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'available', label: 'Available' },
  { key: 'completed', label: 'Completed' },
]

export function AssessmentsHub() {
  const router = useRouter()
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
  const [filter, setFilter] = useState<HubFilter>('all')
  const [search, setSearch] = useState('')
  const { entries, isLoading } = useAssessmentCatalogue()

  const counts = useMemo(
    () => ({
      all: entries.length,
      available: entries.filter((entry) => !entry.complete).length,
      completed: entries.filter((entry) => entry.complete).length,
    }),
    [entries]
  )

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase()
    return entries.filter((entry) => {
      if (filter === 'available' && entry.complete) return false
      if (filter === 'completed' && !entry.complete) return false
      if (!term) return true
      return `${entry.title} ${entry.proves}`.toLowerCase().includes(term)
    })
  }, [entries, filter, search])

  if (isLoading) {
    return (
      <SkeletonGroup gap={16} animation="wave">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} width="100%" height={24} borderRadius={4} />
        ))}
      </SkeletonGroup>
    )
  }

  return (
    <Stack gap={20}>
      <Tabs type="folder" value={filter} onValueChange={(next) => setFilter(next as HubFilter)}>
        {FILTERS.map((entry) => (
          <Tabs.Item key={entry.key} value={entry.key}>
            <Tabs.Trigger>
              {entry.label} {counts[entry.key]}
            </Tabs.Trigger>
          </Tabs.Item>
        ))}
      </Tabs>

      <ListToolbar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search assessments…"
        resultCount={visible.length}
        resultNoun="assessment"
      />

      {visible.length === 0 ? (
        <Text style={{ color: colors.text[t].secondary }}>
          {filter === 'completed'
            ? "You haven't finished any of these yet."
            : 'Nothing matches that.'}
        </Text>
      ) : (
        <Stack>
          {visible.map((entry) => (
            <Row
              key={entry.key}
              gap={12}
              align="center"
              wrap
              paddingVertical={14}
              style={{ borderBottomWidth: 1, borderBottomColor: colors.border[t].default }}
            >
              <Stack gap={2} flex={1} minWidth={220}>
                <Row gap={8} align="center" wrap>
                  <Text style={{ color: colors.text[t].primary }}>{entry.title}</Text>
                  <Text
                    style={{
                      color: entry.complete ? colors.fg[t].success : colors.text[t].tertiary,
                    }}
                  >
                    {entry.complete ? 'Completed' : 'Not taken'}
                  </Text>
                </Row>
                <Text style={{ color: colors.text[t].secondary }}>{entry.proves}</Text>
                <Text style={{ color: colors.text[t].tertiary }}>{entry.estimate}</Text>
              </Stack>
              <Button
                size="sm"
                variant={entry.complete ? 'outline' : 'filled'}
                color="primary"
                onPress={() =>
                  router.push(
                    entry.resultsRoute && entry.complete ? entry.resultsRoute : entry.route
                  )
                }
              >
                {entry.complete ? (entry.resultsRoute ? 'Review' : 'Take again') : 'Begin'}
              </Button>
            </Row>
          ))}
        </Stack>
      )}
    </Stack>
  )
}
