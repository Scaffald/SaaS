import { api } from '@scf/core/utils/api'
import { copyToClipboard } from '@scf/core/utils/clipboard'
import { Calendar, Copy, Lock, Share2, X } from '@tamagui/lucide-icons'
import { useToast } from '@unicornlove/beyond-ui'
import { useMemo, useState } from 'react'
import { Button, Separator, Switch, Text, Row, Stack } from '@unicornlove/beyond-ui'

export interface ShareResultsProps {
  isComplete: boolean
  nextAvailableAt?: string | null
}

/**
 * ShareResults - Component for sharing IPIP assessment results with privacy controls
 */
export function ShareResults({ isComplete, nextAvailableAt }: ShareResultsProps) {
  const toast = useToast()
  const utils = api.useUtils()
  const [shareLink, setShareLink] = useState<string | null>(null)
  const [expiresInDays, setExpiresInDays] = useState<number>(30)
  const [includeArchetype, setIncludeArchetype] = useState(true)
  const [includeScores, setIncludeScores] = useState(true)

  const generateShareToken = api.personalityAssessment.generateShareToken.useMutation({
    onSuccess: (data: { token: string }) => {
      // Build share URL
      const baseUrl = typeof window !== 'undefined' && window.location ? window.location.origin : ''
      const shareUrl = `${baseUrl}/dashboard/assessments/ipip/shared/${data.token}`
      setShareLink(shareUrl)
      toast.show({
          title: 'Share link created!',
          message: 'Your results are now shareable. Copy the link to share.',
        })
      utils.personalityAssessment.getAssessmentStatus.invalidate()
    },
    onError: (error: { message?: string }) => {
      toast.show({
          title: 'Error creating share link',
          message: error.message || 'Please try again.',
          variant: 'error',
        })
    },
  })

  const revokeShareToken = api.personalityAssessment.revokeShareToken.useMutation({
    onSuccess: () => {
      setShareLink(null)
      toast.show({
          title: 'Share link revoked',
          message: 'Your share link has been deactivated.',
        })
      utils.personalityAssessment.getAssessmentStatus.invalidate()
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
        gap="$3"
        padding="$4"
        backgroundColor="$color2"
        borderRadius="$4"
        borderWidth={1}
        borderColor="$borderColor"
        aria-live="polite"
      >
        <Row alignItems="center" gap="$2">
          <Lock size="$1" color="$color10" />
          <Text fontSize="$4" fontWeight="600" color="$color11">
            Complete Assessment to Share
          </Text>
        </Row>
        <Text fontSize="$3" color="$color10">
          Finish all 120 questions to generate a shareable link to your personality results.
        </Text>
      </Stack>
    )
  }

  return (
    <Stack
      gap="$4"
      padding="$4"
      backgroundColor="$color2"
      borderRadius="$4"
      borderWidth={1}
      borderColor="$borderColor"
    >
      <Stack gap="$2">
        <Row alignItems="center" gap="$2">
          <Share2 size="$1" color="$color11" />
          <Text fontSize="$5" fontWeight="bold" color="$color12">
            Share Your Results
          </Text>
        </Row>
        <Text fontSize="$3" color="$color11">
          Create a shareable link to your personality assessment results. You control what's visible
          and can revoke access at any time.
        </Text>
      </Stack>

      {/* Privacy Controls */}
      <Stack gap="$3">
        <Text fontSize="$4" fontWeight="600" color="$color12">
          Privacy Settings
        </Text>

        <Row
          justifyContent="space-between"
          alignItems="center"
          padding="$3"
          backgroundColor="$color1"
          borderRadius="$3"
        >
          <Stack flex={1} gap="$1">
            <Text fontSize="$4" fontWeight="500" color="$color12">
              Include Archetype
            </Text>
            <Text fontSize="$2" color="$color10">
              Show your personality archetype classification
            </Text>
          </Stack>
          <Switch
            checked={includeArchetype}
            onCheckedChange={setIncludeArchetype}
            size="$3"
            aria-label="Toggle archetype visibility in shared results"
          />
        </Row>

        <Row
          justifyContent="space-between"
          alignItems="center"
          padding="$3"
          backgroundColor="$color1"
          borderRadius="$3"
        >
          <Stack flex={1} gap="$1">
            <Text fontSize="$4" fontWeight="500" color="$color12">
              Include Domain Scores
            </Text>
            <Text fontSize="$2" color="$color10">
              Show Big Five domain scores and percentages
            </Text>
          </Stack>
          <Switch
            checked={includeScores}
            onCheckedChange={setIncludeScores}
            size="$3"
            aria-label="Toggle domain scores visibility in shared results"
          />
        </Row>
      </Stack>

      <Separator />

      {/* Share Link Generation */}
      {!shareLink ? (
        <Stack gap="$3">
          <Stack gap="$2">
            <Text fontSize="$4" fontWeight="600" color="$color12">
              Expiration (Optional)
            </Text>
            <Text fontSize="$3" color="$color11">
              Set how many days until the link expires (1-365 days). Leave empty for no expiration.
            </Text>
            <Row gap="$2" alignItems="center">
              <Button
                size="$3"
                variant={expiresInDays === 7 ? 'outlined' : 'outlined'}
                onPress={() => setExpiresInDays(7)}
                backgroundColor={expiresInDays === 7 ? '$blue3' : undefined}
              >
                7 days
              </Button>
              <Button
                size="$3"
                variant="outlined"
                onPress={() => setExpiresInDays(30)}
                backgroundColor={expiresInDays === 30 ? '$blue3' : undefined}
              >
                30 days
              </Button>
              <Button
                size="$3"
                variant="outlined"
                onPress={() => setExpiresInDays(90)}
                backgroundColor={expiresInDays === 90 ? '$blue3' : undefined}
              >
                90 days
              </Button>
              <Button
                size="$3"
                variant="outlined"
                onPress={() => setExpiresInDays(0)}
                backgroundColor={expiresInDays === 0 ? '$blue3' : undefined}
              >
                Never
              </Button>
            </Row>
          </Stack>

          <Button
            size="$4"
            theme="info"
            icon={Share2}
            onPress={handleGenerateShareLink}
            disabled={generateShareToken.isPending}
          >
            {generateShareToken.isPending ? 'Creating...' : 'Generate Share Link'}
          </Button>
        </Stack>
      ) : (
        <Stack gap="$3" aria-live="polite">
          <Text fontSize="$4" fontWeight="600" color="$color12">
            Your Share Link
          </Text>
          <Row
            gap="$2"
            alignItems="center"
            padding="$3"
            backgroundColor="$color1"
            borderRadius="$3"
            borderWidth={1}
            borderColor="$borderColor"
          >
            <Text
              flex={1}
              style={{ fontFamily: 'monospace' }}
              fontSize="$3"
              color="$color11"
              numberOfLines={1}
              data-testid="share-link-url"
            >
              {shareLink}
            </Text>
            <Button size="$3" icon={Copy} onPress={handleCopyLink} variant="outlined">
              Copy
            </Button>
            <Button
              size="$3"
              icon={X}
              onPress={handleRevokeLink}
              variant="outlined"
              theme="error"
              disabled={revokeShareToken.isPending}
            >
              Revoke
            </Button>
          </Row>
          <Text fontSize="$2" color="$color10">
            Anyone with this link can view your results. You can revoke it at any time.
          </Text>
        </Stack>
      )}

      {/* Cooldown UI */}
      {cooldownInfo && (
        <>
          <Separator />
          <Stack
            gap="$2"
            padding="$3"
            backgroundColor="$yellow2"
            borderRadius="$3"
            borderWidth={1}
            borderColor="$yellow7"
            aria-live="polite"
          >
            <Row alignItems="center" gap="$2">
              <Calendar size="$1" color="$yellow11" />
              <Text fontSize="$4" fontWeight="600" color="$yellow11">
                Retake Available Soon
              </Text>
            </Row>
            <Text fontSize="$3" color="$yellow10">
              You can retake the IPIP assessment in{' '}
              {cooldownInfo.daysRemaining > 0
                ? `${cooldownInfo.daysRemaining} day${cooldownInfo.daysRemaining !== 1 ? 's' : ''}`
                : `${cooldownInfo.hoursRemaining} hour${cooldownInfo.hoursRemaining !== 1 ? 's' : ''}`}
              . This cooldown period ensures accurate results.
            </Text>
            <Text fontSize="$2" color="$yellow9">
              Available: {cooldownInfo.availableDate.toLocaleDateString()}{' '}
              {cooldownInfo.availableDate.toLocaleTimeString()}
            </Text>
          </Stack>
        </>
      )}
    </Stack>
  )
}
