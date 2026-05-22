/**
 * Request Review Modal (SC-38).
 *
 * Worker-facing UI to generate a shareable, no-account-required review
 * request link. The link's recipient (former employer, instructor,
 * foreman, client) opens it in any browser and submits a review without
 * signing up for Scaffald.
 *
 * Flow:
 *  1. Worker opens the modal from their /profile screen.
 *  2. (Optional) types a label so they can recognize the link later.
 *  3. Taps "Generate link" → calls useCreateReviewLinkMutation.
 *  4. Modal shows the generated URL with QR / Copy / Share affordances.
 *  5. Active links list below shows previous links with a Revoke button.
 */

import { copyToClipboard } from '@scf/core/utils/clipboard'
import {
  useCreateReviewLinkMutation,
  useMyReviewLinks,
  useRevokeReviewLinkMutation,
} from '@scf/core/utils/review-links-sdk-hooks'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from '@scf/core/utils/useTranslation'
import {
  Button,
  Input,
  Modal,
  ModalContent,
  ModalHeader,
  Paragraph,
  Row,
  Spinner,
  Stack,
  Text,
  useThemeContext,
  useToast,
} from '@scaffald/ui'
import { colors, spacing } from '@scaffald/ui/tokens'
import { Copy, MessageSquarePlus, Share2, Trash2 } from 'lucide-react-native'
import { useCallback, useState } from 'react'
import { Platform, Share, View } from 'react-native'
import QRCode from 'react-native-qrcode-svg'

type RequestReviewModalProps = {
  visible: boolean
  onClose: () => void
}

export function RequestReviewModal({ visible, onClose }: RequestReviewModalProps) {
  const toast = useToast()
  const queryClient = useQueryClient()
  const { theme } = useThemeContext()
  const { t: _t } = useTranslation()
  const [label, setLabel] = useState('')

  const { data: links, isLoading: loadingLinks } = useMyReviewLinks({
    enabled: visible,
  })

  const createLink = useCreateReviewLinkMutation({
    onSuccess: () => {
      setLabel('')
      queryClient.invalidateQueries({ queryKey: ['reviewLinks'] })
    },
    onError: (err) => {
      toast.show({
        title: 'Could not create link',
        message: err.message || 'Please try again.',
        variant: 'error',
      })
    },
  })

  const revokeLink = useRevokeReviewLinkMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviewLinks'] })
      toast.show({ title: 'Link revoked', message: 'No one new can submit a review.' })
    },
    onError: (err) => {
      toast.show({
        title: 'Revoke failed',
        message: err.message || 'Please try again.',
        variant: 'error',
      })
    },
  })

  const handleGenerate = useCallback(() => {
    createLink.mutate({ label: label.trim() || undefined })
  }, [createLink, label])

  const handleCopy = useCallback(
    async (url: string) => {
      const ok = await copyToClipboard(url)
      toast.show({
        title: ok ? 'Copied!' : 'Copy failed',
        message: ok ? 'Review link copied to clipboard' : 'Could not copy URL.',
        variant: ok ? undefined : 'error',
      })
    },
    [toast]
  )

  const handleShare = useCallback(
    async (url: string, linkLabel: string | null) => {
      const message = linkLabel
        ? `Could you leave me a review on Scaffald? (${linkLabel}) ${url}`
        : `Could you leave me a review on Scaffald? ${url}`

      if (Platform.OS === 'web') {
        const nav = typeof navigator !== 'undefined' ? navigator : undefined
        if (nav?.share) {
          try {
            await nav.share({ url, title: 'Review request', text: message })
            return
          } catch {
            // Fall through to clipboard copy
          }
        }
        await handleCopy(url)
        return
      }

      try {
        await Share.share({ url, message, title: 'Review request' })
      } catch (err) {
        console.error('RequestReviewModal: native share failed', err)
        toast.show({
          title: 'Share failed',
          message: 'Try copying the link instead.',
          variant: 'error',
        })
      }
    },
    [handleCopy, toast]
  )

  // Active links = non-revoked, not expired, and not maxed-out.
  // The submit API rejects expired/limit-reached tokens, so surfacing
  // them in the QR/Share UI would just produce confusing failures for
  // recipients.
  const now = Date.now()
  const activeLinks = (links ?? []).filter((l) => {
    if (l.is_revoked) return false
    if (l.expires_at && new Date(l.expires_at).getTime() <= now) return false
    if (l.max_uses != null && l.used_count >= l.max_uses) return false
    return true
  })
  const latestLink = activeLinks[0] ?? null

  return (
    <Modal visible={visible} onClose={onClose} testID="request-review-modal">
      <ModalContent>
        <ModalHeader title="Request a review" onClose={onClose} />

        <Stack gap={spacing[20]}>
          <Paragraph size="sm" style={{ color: colors.text[theme].secondary }}>
            Generate a one-link request you can share with a foreman, instructor,
            client, or former employer. Whoever opens it can submit a review
            without creating a Scaffald account.
          </Paragraph>

          {/* Label + Generate */}
          <Stack gap={spacing[8]}>
            <Text size="sm" style={{ color: colors.text[theme].secondary }}>
              Label (optional — helps you tell links apart)
            </Text>
            <Input
              value={label}
              onChangeText={setLabel}
              placeholder="e.g. Foreman at Acme Construction"
              autoCapitalize="words"
              autoCorrect={false}
              maxLength={120}
            />
            <Button
              variant="filled"
              color="primary"
              iconStart={MessageSquarePlus}
              onPress={handleGenerate}
              disabled={createLink.isPending}
            >
              {createLink.isPending ? 'Generating...' : 'Generate review link'}
            </Button>
          </Stack>

          {/* Most recent link — QR + URL + Copy + Share */}
          {latestLink && (
            <Stack gap={spacing[10]}>
              <Text size="sm" style={{ color: colors.text[theme].secondary }}>
                {createLink.isSuccess
                  ? 'New link ready — share it now'
                  : 'Most recent link'}
              </Text>
              <View
                style={{
                  alignSelf: 'center',
                  padding: spacing[12],
                  backgroundColor: '#FFFFFF',
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: colors.border[theme].subtle,
                }}
              >
                <QRCode
                  value={latestLink.share_url}
                  size={156}
                  color={colors.text.light.primary}
                  backgroundColor="#FFFFFF"
                />
              </View>

              <Row
                gap={spacing[8]}
                align="center"
                padding={spacing[10]}
                style={{
                  backgroundColor: colors.bg[theme].subtle,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: colors.border[theme].subtle,
                }}
              >
                <Text
                  size="sm"
                  style={{ flex: 1, color: colors.text[theme].primary }}
                  numberOfLines={1}
                >
                  {latestLink.share_url.replace(/^https?:\/\//, '')}
                </Text>
                <Button
                  size="sm"
                  variant="outline"
                  iconStart={Copy}
                  onPress={() => handleCopy(latestLink.share_url)}
                  accessibilityLabel="Copy review request URL"
                >
                  Copy
                </Button>
              </Row>

              <Button
                variant="filled"
                color="primary"
                iconStart={Share2}
                onPress={() => handleShare(latestLink.share_url, latestLink.label)}
                accessibilityLabel="Share review request"
              >
                Share link
              </Button>
            </Stack>
          )}

          {/* Other active links */}
          {activeLinks.length > 1 && (
            <Stack gap={spacing[8]}>
              <Text size="sm" style={{ color: colors.text[theme].secondary }}>
                Other active links
              </Text>
              {activeLinks.slice(1).map((link) => (
                <Row
                  key={link.id}
                  gap={spacing[8]}
                  align="center"
                  padding={spacing[8]}
                  style={{
                    backgroundColor: colors.bg[theme].subtle,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: colors.border[theme].subtle,
                  }}
                >
                  <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                    <Text
                      size="sm"
                      style={{ color: colors.text[theme].primary }}
                      numberOfLines={1}
                    >
                      {link.label ?? 'Untitled link'}
                    </Text>
                    <Text
                      size="xs"
                      style={{ color: colors.text[theme].tertiary }}
                      numberOfLines={1}
                    >
                      Used {link.used_count} {link.used_count === 1 ? 'time' : 'times'}
                    </Text>
                  </Stack>
                  <Button
                    size="sm"
                    variant="outline"
                    iconStart={Copy}
                    onPress={() => handleCopy(link.share_url)}
                    accessibilityLabel="Copy link URL"
                  >
                    Copy
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    color="error"
                    iconStart={Trash2}
                    onPress={() => revokeLink.mutate(link.id)}
                    disabled={revokeLink.isPending}
                    accessibilityLabel="Revoke link"
                  >
                    Revoke
                  </Button>
                </Row>
              ))}
            </Stack>
          )}

          {loadingLinks && !latestLink && (
            <Row justify="center" padding={spacing[12]}>
              <Spinner size="sm" />
            </Row>
          )}
        </Stack>
      </ModalContent>
    </Modal>
  )
}
