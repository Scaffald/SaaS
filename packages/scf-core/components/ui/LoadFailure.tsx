import { ErrorState, Stack, Button } from '@scaffald/ui'
import { useRouter } from 'expo-router'
import { describeLoadFailure } from './load-failure'

type LoadFailureProps = {
  error: unknown
  /** What the page shows: "candidate", "organization". */
  noun: string
  retry?: () => void
  /** Where to go instead — the page's parent, named as the nav names it. */
  back?: { label: string; href: string }
}

/**
 * A page that could not load: a plain-language title, Retry when retrying can
 * help, and a named way back (#1165). The raw error message is deliberately
 * not passed to ErrorState, which would print it.
 */
export function LoadFailure({ error, noun, retry, back }: LoadFailureProps) {
  const router = useRouter()
  const copy = describeLoadFailure(error, noun)
  return (
    <Stack gap={0} align="center">
      <ErrorState
        title={copy.title}
        description={copy.description}
        retry={copy.canRetry ? retry : undefined}
      />
      {back ? (
        <Button variant="outline" onPress={() => router.push(back.href as never)}>
          {`Back to ${back.label}`}
        </Button>
      ) : null}
    </Stack>
  )
}
