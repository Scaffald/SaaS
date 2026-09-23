import { ROUTES, buildPath } from '@scf/core/constants/routes'
import { useEmployer } from '@scf/core/utils/employers-sdk-hooks'
import { usePublishedJobs } from '@scf/core/utils/jobs-sdk-hooks'
import { extractPlainText, useThemeContext } from '@scaffald/ui'
import type { JSONContent } from '@tiptap/core'
import { useRouter } from 'expo-router'
import { Button, H3, Separator, Skeleton, SkeletonText, Text, Row, Stack } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

type DiscoverEmployerDetailLeftProps = {
  employerId: string
}

/**
 * An employer, as a worker reads it.
 *
 * The screen carried the organisation's name in a card next to a Back button
 * the breadcrumb already provides, then four labelled blocks — Industry,
 * About, Location, Website — each a heading and a line, and closed with
 * "Created: 3/14/2024", which answers a question nobody asked. What it never
 * showed was the one thing a worker comes here for: what this employer is
 * hiring.
 *
 * Open roles are rows now, each linking to its posting. The identity moved
 * to the screen header (#828), so this column is what there is to read.
 */
function SectionHeading({ children }: { children: string }) {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
  return <H3 style={{ color: colors.text[t].primary }}>{children}</H3>
}

export function DiscoverEmployerDetailLeft({ employerId }: DiscoverEmployerDetailLeftProps) {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
  const router = useRouter()

  const { data: employer, isLoading } = useEmployer(
    { id: employerId },
    { enabled: Boolean(employerId) }
  )

  const { data: jobs, isLoading: jobsLoading } = usePublishedJobs(
    { organizationId: employerId, limit: 20 },
    { enabled: Boolean(employerId) }
  )

  if (!employerId) {
    return (
      <Stack gap={12} align="flex-start" paddingVertical={24}>
        <Text style={{ color: colors.text[t].secondary }}>No employer was named in this link.</Text>
        <Button size="md" variant="outline" onPress={() => router.replace(ROUTES.EMPLOYERS.path)}>
          Browse employers
        </Button>
      </Stack>
    )
  }

  if (isLoading) {
    return (
      <Stack gap={16}>
        <Skeleton width={220} height={20} shape="text" />
        <SkeletonText lines={3} lastLineWidth="70%" />
        <SkeletonText lines={2} lastLineWidth="50%" />
      </Stack>
    )
  }

  if (!employer) {
    return (
      <Stack gap={12} align="flex-start" paddingVertical={24}>
        <Text style={{ color: colors.text[t].secondary }}>This employer is no longer listed.</Text>
        <Button size="md" variant="outline" onPress={() => router.replace(ROUTES.EMPLOYERS.path)}>
          Browse employers
        </Button>
      </Stack>
    )
  }

  const description =
    typeof employer.description === 'string'
      ? employer.description
      : employer.description
        ? extractPlainText(employer.description as JSONContent)
        : ''

  const openRoles = jobs?.data ?? []

  return (
    <Stack gap={24}>
      {description ? (
        <Stack gap={12}>
          <SectionHeading>About</SectionHeading>
          <Text style={{ color: colors.text[t].secondary, lineHeight: 22 }}>{description}</Text>
        </Stack>
      ) : null}

      <Separator />

      <Stack gap={12}>
        <Row justify="space-between" align="center" gap={12} wrap>
          <SectionHeading>Open roles</SectionHeading>
          {openRoles.length > 0 ? (
            <Text style={{ color: colors.text[t].secondary }}>
              {openRoles.length} {openRoles.length === 1 ? 'role' : 'roles'}
            </Text>
          ) : null}
        </Row>

        {jobsLoading ? (
          <SkeletonText lines={3} lastLineWidth="60%" />
        ) : openRoles.length === 0 ? (
          <Text style={{ color: colors.text[t].secondary }}>
            Nothing open here right now. Following this employer is how you hear when that changes.
          </Text>
        ) : (
          <Stack>
            {openRoles.map((job) => (
              <Row
                key={job.id}
                gap={12}
                align="center"
                wrap
                paddingVertical={12}
                style={{ borderBottomWidth: 1, borderBottomColor: colors.border[t].default }}
              >
                <Stack gap={2} flex={1} minWidth={200}>
                  <Text style={{ color: colors.text[t].primary }}>{job.title}</Text>
                  <Text style={{ color: colors.text[t].secondary }}>
                    {[job.location, formatEmploymentType(job.employment_type)]
                      .filter(Boolean)
                      .join(' · ') || 'Details on the posting'}
                  </Text>
                </Stack>
                <Button
                  size="sm"
                  variant="outline"
                  onPress={() => router.push(buildPath(ROUTES.JOBS.DETAIL, { id: job.id }))}
                >
                  View role
                </Button>
              </Row>
            ))}
          </Stack>
        )}
      </Stack>
    </Stack>
  )
}

function formatEmploymentType(type: string | null | undefined): string | null {
  if (!type) return null
  const map: Record<string, string> = {
    full_time: 'Full-Time',
    part_time: 'Part-Time',
    contract: 'Contract',
    temp: 'Temporary',
    intern: 'Internship',
  }
  return map[type] ?? type
}
