import { formatDate } from '@scf/core/features/profile/utils/date-formatting'
import type { PublicWorkLog, PublicWorkLogPhoto } from '@scf/schemas'
import { usePublicWorkLogsFeed } from '@scf/core/utils/work-logs-sdk-hooks'
import { ShieldCheck } from 'lucide-react-native'
import { useMemo } from 'react'
import { Card, Image, Paragraph, Spinner, Text, Row, Stack } from '@unicornlove/beyond-ui'

interface WorkLogPortfolioWidgetProps {
  userId: string
}

export function WorkLogPortfolioWidget({ userId }: WorkLogPortfolioWidgetProps) {
  const { data, isLoading } = usePublicWorkLogsFeed(
    userId ? { userId, limit: 12 } : undefined,
    { enabled: Boolean(userId), staleTime: 60_000 }
  )

  const workLogs: PublicWorkLog[] = data ?? []

  const groupedLogs = useMemo(() => {
    const groups = new Map<
      string,
      {
        projectName: string | null
        organizationName: string | null
        entries: PublicWorkLog[]
      }
    >()

    for (const log of workLogs) {
      const key = log.projectId ?? log.id
      const existing = groups.get(key)
      if (existing) {
        existing.entries.push(log)
      } else {
        groups.set(key, {
          projectName: log.projectName,
          organizationName: log.organizationName,
          entries: [log],
        })
      }
    }

    return Array.from(groups.entries()).map(([key, value]) => ({
      id: key,
      projectName: value.projectName,
      organizationName: value.organizationName,
      entries: value.entries,
    }))
  }, [workLogs])

  return (
    <Card borderColor="$color6" borderWidth={1}>
      <Stack gap="$4" padding="$4">
        <Stack gap="$2">
          <Text fontSize="$6" fontWeight="700">
            Verified work history
          </Text>
          <Paragraph color="$color10">
            Recent verified work logs selected by this worker. Projects appear here only when the
            worker has chosen to share them publicly.
          </Paragraph>
        </Stack>

        {isLoading ? (
          <Row gap="$2" alignItems="center">
            <Spinner size="small" />
            <Text color="$color10">Loading work history…</Text>
          </Row>
        ) : workLogs.length === 0 ? (
          <Paragraph color="$color10">
            No verified work logs are currently visible on this profile.
          </Paragraph>
        ) : (
          <Stack gap="$4">
            {groupedLogs.map((group) => {
              const allDates = group.entries
                .map((entry) => entry.logDate)
                .filter((value): value is string => Boolean(value))
              const earliest = allDates.reduce<string | null>((current, candidate) => {
                if (!current) return candidate
                return current <= candidate ? current : candidate
              }, null)
              const latest = allDates.reduce<string | null>((current, candidate) => {
                if (!current) return candidate
                return current >= candidate ? current : candidate
              }, null)

              const dateLabel = (() => {
                if (!allDates.length) return 'Date hidden by worker'
                if (earliest && latest && earliest !== latest) {
                  return `${formatDate(earliest)} – ${formatDate(latest)}`
                }
                if (earliest) {
                  return formatDate(earliest)
                }
                return 'Date hidden by worker'
              })()

              const photos = group.entries.flatMap((entry) => entry.photos) as PublicWorkLogPhoto[]

              return (
                <Stack
                  key={group.id}
                  borderWidth={1}
                  borderColor="$color6"
                  borderRadius="$4"
                  paddingHorizontal="$3"
                  paddingVertical="$3"
                  gap="$3"
                  backgroundColor="$color2"
                >
                  <Row alignItems="center" justifyContent="space-between">
                    <Stack gap="$1">
                      <Text fontWeight="700">{group.projectName ?? 'Project'}</Text>
                      {group.organizationName ? (
                        <Text color="$color10">{group.organizationName}</Text>
                      ) : null}
                      <Text color="$color10">{dateLabel}</Text>
                    </Stack>
                    <Row
                      gap="$2"
                      alignItems="center"
                      paddingHorizontal="$2"
                      paddingVertical="$1"
                      borderRadius="$4"
                      backgroundColor="$green4"
                    >
                      <ShieldCheck size={16} color="$green11" />
                      <Text color="$green11" fontSize="$2" fontWeight="600">
                        Verified by Scaffald
                      </Text>
                    </Row>
                  </Row>

                  {photos.length > 0 ? (
                    <Row gap="$2" flexWrap="wrap">
                      {photos.map((photo) => (
                        <Card
                          key={`${group.id}-${photo.id}`}
                          width="30%"
                          minWidth={120}
                          height={90}
                          overflow="hidden"
                          borderWidth={1}
                          borderColor="$color5"
                        >
                          {photo.thumbnailSignedUrl || photo.signedUrl ? (
                            <Image
                              source={{
                                uri: photo.thumbnailSignedUrl ?? photo.signedUrl ?? undefined,
                              }}
                              width="100%"
                              height="100%"
                              resizeMode="cover"
                            />
                          ) : (
                            <Stack
                              flex={1}
                              alignItems="center"
                              justifyContent="center"
                              backgroundColor="$color3"
                            >
                              <Text color="$color10" fontSize="$2">
                                Photo unavailable
                              </Text>
                            </Stack>
                          )}
                        </Card>
                      ))}
                    </Row>
                  ) : (
                    <Paragraph color="$color10">No photos were shared for this project.</Paragraph>
                  )}
                </Stack>
              )
            })}
          </Stack>
        )}
      </Stack>
    </Card>
  )
}
