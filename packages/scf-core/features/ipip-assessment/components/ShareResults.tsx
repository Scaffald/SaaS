import {
  useGenerateShareTokenMutation,
  useRevokeShareTokenMutation,
} from '@scf/core/utils/personality-assessment-sdk-hooks'
import { useQueryClient } from '@tanstack/react-query'
import { copyToClipboard } from '@scf/core/utils/clipboard'
import { Calendar, Copy, Lock, Share2, X } from 'lucide-react-native'
import { useToast } from '@scaffald/ui'
import { useMemo, useState } from 'react'
import { Button, Separator, Switch, Text, Row, Stack } from '@scaffald/ui'

export interface ShareResultsProps {
  isComplete: boolean
  nextAvailableAt?: string | null
}

/**
 * ShareResults - Component for sharing IPIP assessment results with privacy controls
 */
export function ShareResults({ isComplete, nextAvailableAt }: ShareResultsProps) {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [shareLink, setShareLink] = useState<string | null>(null)
  const [expiresInDays, setExpiresInDays] = useState<number>(30)
  const [includeArchetype, setIncludeArchetype] = useState(true)
  const [includeScores, setIncludeScores] = useState(true)

  const generateShareToken = useGenerateShareTokenMutation({
    onSuccess: (data: { token: string }) => {
      // Build share URL
      const baseUrl = typeof window !== 'undefined' && window.location ? window.location.origin : ''
      const shareUrl = `${baseUrl}/dashboard/assessments/ipip/shared/${data.token}`
      setShareLink(shareUrl)
      toast.show({
        title: 'Share link created!',
        message: 'Your results are now shareable. Copy the link to share.',
      })
      queryClient.invalidateQueries({ queryKey: ['personality-assessment', 'status'] })
    },
    onError: (error: { message?: string }) => {
      toast.show({
        title: 'Error creating share link',
        message: error.message || 'Please try again.',
        variant: 'error',
      })
    },
  })

  const revokeShareToken = useRevokeShareTokenMutation({
    onSuccess: () => {
      setShareLink(null)
      toast.show({
        title: 'Share link revoked',
        message: 'Your share link has been deactivated.',
      })
      queryClient.invalidateQueries({ queryKey: ['personality-assessment', 'status'] })
    },
    onError: (error: { message?: string }) => {
      toast.show({
        title: 'Error revoking share link',
        message: error.message || 'Please try again.',
        variant: 'error',
      })
    },
  })

  const handleGenerateShareLink = () => {
    if (!isComplete) {
      toast.show({
        title: 'Complete assessment first',
        message: 'You must complete the assessment before sharing results.',
        variant: 'error',
      })
      return
    }

    generateShareToken.mutate({
      expiresInDays: expiresInDays > 0 ? expiresInDays : undefined,
    })
  }

  const handleCopyLink = async () => {
    if (!shareLink) return

    const success = await copyToClipboard(shareLink)
    if (success) {
      toast.show({
        title: 'Copied!',
        message: 'Share link copied to clipboard',
      })
    } else {
      toast.show({
        title: 'Error',
        message: 'Failed to copy link to clipboard',
        variant: 'error',
      })
    }
  }

  const handleRevokeLink = () => {
    if (!shareLink) return

    // Extract token from URL
    const tokenMatch = shareLink.match(/\/shared\/([a-f0-9-]+)$/i)
    if (tokenMatch?.[1]) {
      revokeShareToken.mutate({ token: tokenMatch[1] })
    }
  }

  // Calculate cooldown info
  const cooldownInfo = useMemo(() => {
    if (!nextAvailableAt) return null

    const now = new Date()
    const availableDate = new Date(nextAvailableAt)
    const isOnCooldown = availableDate > now

    if (!isOnCooldown) return null

    const daysRemaining = Math.ceil(
      (availableDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    )
    const hoursRemaining = Math.ceil((availableDate.getTime() - now.getTime()) / (1000 * 60 * 60))

    return {
      isOnCooldown: true,
      availableDate,
      daysRemaining,
      hoursRemaining,
    }
  }, [nextAvailableAt])

  if (!isComplete) {
    return (
      <Stack
        gap={12}
        padding="md"
        backgroundColor="$color2"
        borderRadius={16}
        borderWidth={1}
        borderColor="$borderColor"
        aria-live="polite"
      >
        <Row align="center" gap={8}>
          <Lock size="sm" color="$gray11" />
          <Text color="$gray11">Complete Assessment to Share</Text>
        </Row>
        <Text color="$gray11">
          Finish all 120 questions to generate a shareable link to your personality results.
        </Text>
      </Stack>
    )
  }

  return (
    <Stack
      gap={16}
      padding="md"
      backgroundColor="$color2"
      borderRadius={16}
      borderWidth={1}
      borderColor="$borderColor"
    >
      <Stack gap={8}>
        <Row align="center" gap={8}>
          <Share2 size="sm" color="$gray11" />
          <Text color="$gray11">Share Your Results</Text>
        </Row>
        <Text color="$gray11">
          Create a shareable link to your personality assessment results. You control what's visible
          and can revoke access at any time.
        </Text>
      </Stack>

      {/* Privacy Controls */}
      <Stack gap={12}>
        <Text color="$gray11">Privacy Settings</Text>

        <Row
          justify="space-between"
          align="center"
          padding="sm"
          backgroundColor="$color1"
          borderRadius={12}
        >
          <Stack flex={1} gap={4}>
            <Text color="$gray11">Include Archetype</Text>
            <Text color="$gray11">Show your personality archetype classification</Text>
          </Stack>
          <Switch
            checked={includeArchetype}
            onChange={setIncludeArchetype}
            size="sm"
            aria-label="Toggle archetype visibility in shared results"
          />
        </Row>

        <Row
          justify="space-between"
          align="center"
          padding="sm"
          backgroundColor="$color1"
          borderRadius={12}
        >
          <Stack flex={1} gap={4}>
            <Text color="$gray11">Include Domain Scores</Text>
            <Text color="$gray11">Show Big Five domain scores and percentages</Text>
          </Stack>
          <Switch
            checked={includeScores}
            onChange={setIncludeScores}
            size="sm"
            aria-label="Toggle domain scores visibility in shared results"
          />
        </Row>
      </Stack>

      <Separator />

      {/* Share Link Generation */}
      {!shareLink ? (
        <Stack gap={12}>
          <Stack gap={8}>
            <Text color="$gray11">Expiration (Optional)</Text>
            <Text color="$gray11">
              Set how many days until the link expires (1-365 days). Leave empty for no expiration.
            </Text>
            <Row gap={8} align="center">
              <Button
                size="sm"
                variant="outline"
                color={expiresInDays === 7 ? 'primary' : undefined}
                onPress={() => setExpiresInDays(7)}
              >
                7 days
              </Button>
              <Button
                size="sm"
                variant="outline"
                color={expiresInDays === 30 ? 'primary' : undefined}
                onPress={() => setExpiresInDays(30)}
              >
                30 days
              </Button>
              <Button
                size="sm"
                variant="outline"
                color={expiresInDays === 90 ? 'primary' : undefined}
                onPress={() => setExpiresInDays(90)}
              >
                90 days
              </Button>
              <Button
                size="sm"
                variant="outline"
                color={expiresInDays === 0 ? 'primary' : undefined}
                onPress={() => setExpiresInDays(0)}
              >
                Never
              </Button>
            </Row>
          </Stack>

          <Button
            size="md"
            color="primary"
            iconStart={Share2}
            onPress={handleGenerateShareLink}
            disabled={generateShareToken.isPending}
          >
            {generateShareToken.isPending ? 'Creating...' : 'Generate Share Link'}
          </Button>
        </Stack>
      ) : (
        <Stack gap={12} aria-live="polite">
          <Text color="$gray11">Your Share Link</Text>
          <Row
            gap={8}
            align="center"
            padding="sm"
            backgroundColor="$color1"
            borderRadius={12}
            borderWidth={1}
            borderColor="$borderColor"
          >
            <Text
              style={{ flex: 1, fontFamily: 'monospace' }}
              color="$gray11"
              data-testid="share-link-url"
            >
              {shareLink}
            </Text>
            <Button size="sm" iconStart={Copy} onPress={handleCopyLink} variant="outline">
              Copy
            </Button>
            <Button
              size="sm"
              iconStart={X}
              onPress={handleRevokeLink}
              variant="outline"
              color="error"
              disabled={revokeShareToken.isPending}
            >
              Revoke
            </Button>
          </Row>
          <Text color="$gray11">
            Anyone with this link can view your results. You can revoke it at any time.
          </Text>
        </Stack>
      )}

      {/* Cooldown UI */}
      {cooldownInfo && (
        <>
          <Separator />
          <Stack
            gap={8}
            padding="sm"
            backgroundColor="$yellow2"
            borderRadius={12}
            borderWidth={1}
            borderColor="$yellow7"
            aria-live="polite"
          >
            <Row align="center" gap={8}>
              <Calendar size="sm" color="$yellow11" />
              <Text color="$yellow11">Retake Available Soon</Text>
            </Row>
            <Text color="$yellow10">
              You can retake the IPIP assessment in{' '}
              {cooldownInfo.daysRemaining > 0
                ? `${cooldownInfo.daysRemaining} day${cooldownInfo.daysRemaining !== 1 ? 's' : ''}`
                : `${cooldownInfo.hoursRemaining} hour${cooldownInfo.hoursRemaining !== 1 ? 's' : ''}`}
              . This cooldown period ensures accurate results.
            </Text>
            <Text color="$yellow9">
              Available: {cooldownInfo.availableDate.toLocaleDateString()}{' '}
              {cooldownInfo.availableDate.toLocaleTimeString()}
            </Text>
          </Stack>
        </>
      )}
    </Stack>
  )
}
