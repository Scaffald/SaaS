/**
 * Public Review Submission Route (SC-38).
 *
 * Accessed at /reviews/[token] without authentication. The reviewer is
 * an external party — a former employer, instructor, foreman, client,
 * etc. — and explicitly does not need a Scaffald account.
 *
 * Flow:
 *  1. Look up the token via `useReviewLinkByToken(token)`. On 404 we
 *     show an "invalid link" screen with a CTA back to scaffald.com.
 *  2. Render the worker's name + headline so the reviewer knows who
 *     they're reviewing.
 *  3. Show the form: reviewer name, optional email, relationship,
 *     1-5 star rating, optional headline, body (required, max 2000).
 *  4. On submit, call `useSubmitReviewByTokenMutation(token)`. On
 *     success show a "Thanks!" screen with a link to the worker's
 *     public profile.
 */

import {
  useReviewLinkByToken,
  useSubmitReviewByTokenMutation,
} from '@scf/core/utils/review-links-sdk-hooks'
import { useTranslation } from '@scf/core/utils/useTranslation'
import type { ReviewerRelationship } from '@scaffald/sdk/resources/review-links'
import {
  Button,
  Card,
  H3,
  H5,
  Input,
  Paragraph,
  Row,
  Spinner,
  Stack,
  Text,
  TextArea,
  useThemeContext,
} from '@scaffald/ui'
import { colors, spacing } from '@scaffald/ui/tokens'
import { CheckCircle2, ExternalLink, Star } from 'lucide-react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useState } from 'react'
import { Pressable, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const RELATIONSHIPS: { value: ReviewerRelationship; label: string }[] = [
  { value: 'instructor', label: 'Instructor / Faculty' },
  { value: 'manager', label: 'Manager / Employer' },
  { value: 'foreman', label: 'Foreman' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'coworker', label: 'Coworker' },
  { value: 'client', label: 'Client' },
  { value: 'other', label: 'Other' },
]

function StarRow({
  value,
  onChange,
  theme,
}: {
  value: number
  onChange: (next: number) => void
  theme: 'light' | 'dark'
}) {
  return (
    <Row gap={spacing[6]} accessibilityRole="adjustable" accessibilityLabel="Rating">
      {[1, 2, 3, 4, 5].map((n) => {
        const active = n <= value
        return (
          <Pressable
            key={n}
            onPress={() => onChange(n)}
            accessibilityRole="button"
            accessibilityLabel={`${n} star${n === 1 ? '' : 's'}`}
            hitSlop={6}
          >
            <Star
              size={32}
              color={active ? colors.warning[500] : colors.text[theme].tertiary}
              fill={active ? colors.warning[500] : 'transparent'}
            />
          </Pressable>
        )
      })}
    </Row>
  )
}

function RelationshipPicker({
  value,
  onChange,
  theme,
}: {
  value: ReviewerRelationship | null
  onChange: (next: ReviewerRelationship) => void
  theme: 'light' | 'dark'
}) {
  return (
    <Stack gap={spacing[6]}>
      {RELATIONSHIPS.map((option) => {
        const active = value === option.value
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Row
              gap={spacing[10]}
              align="center"
              padding={spacing[10]}
              style={{
                backgroundColor: active ? colors.primary[50] : colors.bg[theme].subtle,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: active ? colors.primary[400] : colors.border[theme].subtle,
              }}
            >
              <View
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 9,
                  borderWidth: 2,
                  borderColor: active ? colors.primary[500] : colors.border[theme].default,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {active && (
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: colors.primary[500],
                    }}
                  />
                )}
              </View>
              <Text
                size="sm"
                style={{
                  color: active ? colors.primary[700] : colors.text[theme].primary,
                  fontWeight: active ? '600' : '400',
                }}
              >
                {option.label}
              </Text>
            </Row>
          </Pressable>
        )
      })}
    </Stack>
  )
}

export default function PublicReviewSubmissionRoute() {
  const router = useRouter()
  const { token } = useLocalSearchParams<{ token: string }>()
  const { theme } = useThemeContext()
  const { t: _t } = useTranslation()

  const themeKey: 'light' | 'dark' = theme === 'dark' ? 'dark' : 'light'

  const { data, isLoading, isError, error } = useReviewLinkByToken(token)

  const [reviewerName, setReviewerName] = useState('')
  const [reviewerEmail, setReviewerEmail] = useState('')
  const [relationship, setRelationship] = useState<ReviewerRelationship | null>(null)
  const [rating, setRating] = useState(0)
  const [headline, setHeadline] = useState('')
  const [body, setBody] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [submittedSlug, setSubmittedSlug] = useState<string | null>(null)

  const submit = useSubmitReviewByTokenMutation(token ?? '', {
    onSuccess: (result) => {
      setSubmittedSlug(result.subject_slug)
    },
    onError: (err) => {
      setFormError(err.message || 'Submission failed. Please try again.')
    },
  })

  const screenBg = { flex: 1, backgroundColor: colors.bg[themeKey].default }

  const handleSubmit = () => {
    setFormError(null)
    const name = reviewerName.trim()
    if (!name) {
      setFormError('Please enter your name.')
      return
    }
    if (!relationship) {
      setFormError('Please tell us how you know this person.')
      return
    }
    if (rating < 1 || rating > 5) {
      setFormError('Please choose a rating from 1 to 5.')
      return
    }
    const trimmedBody = body.trim()
    if (!trimmedBody) {
      setFormError('Please write a short review.')
      return
    }
    const email = reviewerEmail.trim()
    if (email && !EMAIL_REGEX.test(email)) {
      setFormError('That email address doesn\'t look right.')
      return
    }

    submit.mutate({
      reviewer_name: name,
      reviewer_email: email || undefined,
      reviewer_relationship: relationship,
      rating,
      body: trimmedBody,
      headline: headline.trim() || undefined,
    })
  }

  // Loading state
  if (isLoading || !token) {
    return (
      <SafeAreaView style={screenBg} edges={['top', 'bottom', 'left', 'right']}>
        <Stack flex={1} align="center" justify="center" gap={spacing[12]}>
          <Spinner size="lg" />
          <Text style={{ color: colors.text[themeKey].secondary }}>Loading review form…</Text>
        </Stack>
      </SafeAreaView>
    )
  }

  // Invalid / expired / revoked link
  if (isError || !data) {
    return (
      <SafeAreaView style={screenBg} edges={['top', 'bottom', 'left', 'right']}>
        <Stack flex={1} align="center" justify="center" padding={spacing[20]} gap={spacing[16]}>
          <H3 style={{ color: colors.text[themeKey].primary, textAlign: 'center' }}>
            This review link isn't available
          </H3>
          <Paragraph
            size="sm"
            style={{ color: colors.text[themeKey].secondary, textAlign: 'center' }}
          >
            {error?.message ??
              'The link may have been revoked, used up, or expired. Please reach out to the person who shared it with you.'}
          </Paragraph>
          <Button variant="outline" onPress={() => router.replace('/')}>
            Back to Scaffald
          </Button>
        </Stack>
      </SafeAreaView>
    )
  }

  const { subject } = data
  const displayName = subject.display_name ?? 'this person'

  // Success state — review submitted
  if (submittedSlug !== null || submit.isSuccess) {
    return (
      <SafeAreaView style={screenBg} edges={['top', 'bottom', 'left', 'right']}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <Stack
            flex={1}
            align="center"
            justify="center"
            padding={spacing[20]}
            gap={spacing[16]}
          >
            <CheckCircle2 size={48} color={colors.success[500]} />
            <H3 style={{ color: colors.text[themeKey].primary, textAlign: 'center' }}>
              Thanks for vouching for {displayName}
            </H3>
            <Paragraph
              size="sm"
              style={{ color: colors.text[themeKey].secondary, textAlign: 'center' }}
            >
              Your review will appear on {displayName}'s profile shortly. Thanks for
              taking a minute to help them build credibility on Scaffald.
            </Paragraph>
            {submittedSlug && (
              <Button
                variant="outline"
                iconStart={ExternalLink}
                onPress={() => router.push(`/users/${submittedSlug}` as never)}
              >
                View {displayName}'s profile
              </Button>
            )}
          </Stack>
        </ScrollView>
      </SafeAreaView>
    )
  }

  // Form
  return (
    <SafeAreaView style={screenBg} edges={['top', 'bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing[40] }}>
        <Stack padding={spacing[20]} gap={spacing[20]} style={{ maxWidth: 560, width: '100%' }}>
          <Stack gap={spacing[6]}>
            <Text size="sm" style={{ color: colors.text[themeKey].tertiary }}>
              You've been invited to leave a review for
            </Text>
            <H3 style={{ color: colors.text[themeKey].primary }}>{displayName}</H3>
            {subject.headline && (
              <Paragraph size="sm" style={{ color: colors.text[themeKey].secondary }}>
                {subject.headline}
              </Paragraph>
            )}
          </Stack>

          <Card padding="lg">
            <Stack gap={spacing[20]}>
              <Stack gap={spacing[6]}>
                <H5 style={{ color: colors.text[themeKey].primary }}>About you</H5>
                <Paragraph size="xs" style={{ color: colors.text[themeKey].tertiary }}>
                  No account needed. We share your name and relationship with
                  {' '}{displayName} on their public profile. Your email (if you
                  provide it) stays private.
                </Paragraph>
              </Stack>

              <Stack gap={spacing[10]}>
                <Text size="sm" style={{ color: colors.text[themeKey].secondary }}>
                  Your name
                </Text>
                <Input
                  value={reviewerName}
                  onChangeText={setReviewerName}
                  placeholder="Jane Smith"
                  autoCapitalize="words"
                  maxLength={120}
                />
              </Stack>

              <Stack gap={spacing[10]}>
                <Text size="sm" style={{ color: colors.text[themeKey].secondary }}>
                  Your email (optional)
                </Text>
                <Input
                  value={reviewerEmail}
                  onChangeText={setReviewerEmail}
                  placeholder="name@company.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  maxLength={200}
                />
              </Stack>

              <Stack gap={spacing[10]}>
                <Text size="sm" style={{ color: colors.text[themeKey].secondary }}>
                  How do you know {displayName}?
                </Text>
                <RelationshipPicker
                  value={relationship}
                  onChange={setRelationship}
                  theme={themeKey}
                />
              </Stack>
            </Stack>
          </Card>

          <Card padding="lg">
            <Stack gap={spacing[20]}>
              <Stack gap={spacing[6]}>
                <H5 style={{ color: colors.text[themeKey].primary }}>Your review</H5>
              </Stack>

              <Stack gap={spacing[10]}>
                <Text size="sm" style={{ color: colors.text[themeKey].secondary }}>
                  Overall rating
                </Text>
                <StarRow value={rating} onChange={setRating} theme={themeKey} />
              </Stack>

              <Stack gap={spacing[10]}>
                <Text size="sm" style={{ color: colors.text[themeKey].secondary }}>
                  Headline (optional)
                </Text>
                <Input
                  value={headline}
                  onChangeText={setHeadline}
                  placeholder="e.g. Reliable foreman, great with crew"
                  maxLength={200}
                />
              </Stack>

              <Stack gap={spacing[10]}>
                <Text size="sm" style={{ color: colors.text[themeKey].secondary }}>
                  Tell us about working with {displayName}
                </Text>
                <TextArea
                  value={body}
                  onChangeText={setBody}
                  placeholder="What stood out about their work, attitude, or skills?"
                  rows={6}
                  maxLength={2000}
                />
                <Text size="xs" style={{ color: colors.text[themeKey].tertiary }}>
                  {body.length} / 2000
                </Text>
              </Stack>
            </Stack>
          </Card>

          {formError && (
            <Paragraph
              size="sm"
              accessibilityRole="alert"
              style={{ color: colors.error[600] }}
            >
              {formError}
            </Paragraph>
          )}

          <Button
            variant="filled"
            color="primary"
            onPress={handleSubmit}
            disabled={submit.isPending}
          >
            {submit.isPending ? 'Submitting…' : 'Submit review'}
          </Button>

          <Paragraph
            size="xs"
            style={{ color: colors.text[themeKey].tertiary, textAlign: 'center' }}
          >
            By submitting, you confirm this review reflects your honest opinion
            and is based on a real working relationship.
          </Paragraph>
        </Stack>
      </ScrollView>
    </SafeAreaView>
  )
}
