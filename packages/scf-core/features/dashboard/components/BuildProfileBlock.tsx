import { useRouter } from 'expo-router'
import { Button, Row, Stack, Text, useThemeContext } from '@scaffald/ui'
import { borderRadius, colors, fontSize, fontWeight, lineHeight } from '@scaffald/ui/tokens'
import { useProfileCompletion } from '../completion/useProfileCompletion'

/** How many unfinished sections the block names before "and n more". */
const SHOWN = 3

/**
 * What is left to do on the profile, as one compact block (#1033).
 *
 * This used to be the top of home: a profile-strength metric row and one band
 * per profile section, finished or not, each with an Add or Review button.
 * For a worker whose profile was done, home opened on a list of chores
 * already finished. The prototype keeps this as a small "raise your standing"
 * box in the right rail, so it is one now. It names the heaviest unfinished
 * sections, links to the first, and renders nothing once the profile is
 * complete. Still no new scoring: `useProfileCompletion` is the same source.
 */
export function BuildProfileBlock() {
  const router = useRouter()
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
  const { completionData, isLoading } = useProfileCompletion()

  const total = completionData?.totalItems ?? 0
  const done = completionData?.totalComplete ?? 0
  if (isLoading || total === 0 || done >= total) return null

  // Heavier sections first: weight is what the percentage responds to, so it
  // is the honest order for "do this next".
  const todo = (completionData?.items ?? [])
    .filter((item) => !item.complete)
    .sort((a, b) => (b.weight ?? 0) - (a.weight ?? 0))
  const next = todo.find((item) => item.actionRoute)

  return (
    <Stack
      gap={12}
      padding={16}
      style={{
        borderWidth: 1,
        borderColor: colors.border[t].default,
        borderRadius: borderRadius.l,
      }}
    >
      <Row justify="space-between" align="center" gap={8} wrap>
        <Text
          style={{
            fontSize: fontSize.h6,
            lineHeight: lineHeight.h6,
            fontWeight: fontWeight.medium,
            letterSpacing: 1.4,
            textTransform: 'uppercase',
            color: colors.text[t].attention,
          }}
        >
          Build your profile
        </Text>
        <Text style={{ color: colors.text[t].secondary }}>
          {completionData?.completionPercentage ?? 0}% · {done} of {total}
        </Text>
      </Row>

      <Stack>
        {todo.slice(0, SHOWN).map((item, index) => (
          <Row
            key={item.id}
            gap={12}
            align="center"
            paddingVertical={10}
            style={
              index > 0 ? { borderTopWidth: 1, borderTopColor: colors.border[t].default } : undefined
            }
          >
            <Text style={{ flex: 1, minWidth: 0, color: colors.text[t].primary }}>
              {item.title}
            </Text>
            {item.actionRoute ? (
              <Text
                accessibilityRole="link"
                style={{ color: colors.text[t].emphasis }}
                onPress={() => router.push(item.actionRoute as never)}
              >
                Add
              </Text>
            ) : null}
          </Row>
        ))}
        {todo.length > SHOWN ? (
          <Text style={{ color: colors.text[t].tertiary, paddingTop: 4 }}>
            and {todo.length - SHOWN} more
          </Text>
        ) : null}
      </Stack>

      {next?.actionRoute ? (
        <Button
          size="sm"
          variant="outline"
          color="primary"
          onPress={() => router.push(next.actionRoute as never)}
        >
          {`Continue with ${next.title.toLowerCase()}`}
        </Button>
      ) : null}
    </Stack>
  )
}
