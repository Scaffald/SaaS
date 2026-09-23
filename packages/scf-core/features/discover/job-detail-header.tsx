/**
 * The job detail screen's header — the shared `ScreenHeader` the layout
 * already draws, filled from the posting.
 *
 * Both job detail routes (`/jobs/view/[id]` for members, `/jobs/[slug]` for
 * the public) rendered the title as a plain `<Text>` inside the content
 * column, so the screen had no heading in the accessibility tree and opened
 * a fourth way to introduce a screen. The prototype leads its posting with a
 * kicker (employer · location), the role as the heading, and Apply on the
 * title row — which is what `ScreenHeader` already does everywhere else.
 *
 * Apply lives here rather than above the content because #392 moved the
 * apply panel to the sidebar: correct reading order, but on a phone that put
 * the only call to action below the whole posting.
 */

import { useRouter } from 'expo-router'
import { Button } from '@scaffald/ui'
import { ExternalLink } from 'lucide-react-native'
import { ROUTES, buildPath } from '@scf/core/constants/routes'
import { useUser } from '@scf/core/utils/useUser'
import {
  useExternalJobs,
  useJobDetails,
  useMyApplicationForJob,
} from '@scf/core/utils/jobs-sdk-hooks'
import { openExternalLink } from '@scf/core/utils/platform'

type JobLocation =
  | string
  | {
      city?: string | null
      state?: string | null
      zip_code?: string | null
      country?: string | null
    }
  | null
  | undefined

/** "Portland, OR" — a posting's location may arrive as a string or a row. */
export function formatJobLocation(location: JobLocation): string {
  if (!location) return ''
  if (typeof location === 'string') return location
  if (typeof location !== 'object') return ''
  return [location.city, location.state, location.zip_code, location.country]
    .filter(Boolean)
    .join(', ')
}

/**
 * "Hoffman Structures · Portland, OR". Returns undefined when neither half is
 * known, so `ScreenHeader` renders the title alone rather than an empty line.
 */
export function jobDetailKicker(
  organizationName: string | null | undefined,
  location: JobLocation
): string | undefined {
  const parts = [organizationName, formatJobLocation(location)].filter(
    (part): part is string => !!part && part.trim().length > 0
  )
  return parts.length > 0 ? parts.join(' · ') : undefined
}

/**
 * The header's primary action.
 *
 * The label only changes once the viewer is known to have applied, and that
 * query needs a session — so the server and the first client render both say
 * "Apply" and hydration has nothing to reconcile. Where the button goes does
 * vary: signed out it leads to sign-in, an external posting opens the host's
 * own form, and an internal one opens the application screen (#829).
 */
export function JobDetailApplyAction({ jobId }: { jobId: string }) {
  const router = useRouter()
  const { user } = useUser()
  const signedIn = !!user

  const { data: internalJob, isLoading: internalLoading } = useJobDetails(jobId, {
    enabled: !!jobId,
  })
  const { data: externalJobsList } = useExternalJobs({
    enabled: !!jobId && !internalJob && !internalLoading,
  })
  const { data: myApplication } = useMyApplicationForJob(jobId, { enabled: !!jobId && signedIn })

  const externalJob = externalJobsList?.find((job: { id: string }) => job.id === jobId)
  const externalUrl = externalJob?.url ?? null

  if (myApplication) {
    return (
      <Button
        size="sm"
        variant="outline"
        onPress={() =>
          router.push(
            buildPath(ROUTES.JOBS.APPLICATIONS.DETAIL, { applicationId: myApplication.id })
          )
        }
      >
        View application
      </Button>
    )
  }

  if (!signedIn) {
    return (
      <Button
        size="sm"
        variant="filled"
        color="primary"
        onPress={() => router.push(ROUTES.AUTH.LOGIN.path)}
      >
        Apply
      </Button>
    )
  }

  if (externalUrl) {
    return (
      <Button
        size="sm"
        variant="filled"
        color="primary"
        iconStart={ExternalLink}
        onPress={() => openExternalLink(externalUrl)}
      >
        Apply
      </Button>
    )
  }

  return (
    <Button
      size="sm"
      variant="filled"
      color="primary"
      onPress={() => router.push(buildPath(ROUTES.JOBS.DETAIL.APPLY, { id: jobId }))}
    >
      Apply
    </Button>
  )
}
