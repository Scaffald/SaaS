/**
 * Share Public Profile Modal (SC-40).
 *
 * Surfaces the worker's public vanity URL in a way that's easy to share
 * at trade events / conferences (MAVA):
 *  - QR code that resolves to the public profile route at /users/{slug}
 *  - Copy URL button (uses the existing cross-platform clipboard helper)
 *  - Share button (native Share sheet on iOS/Android; Web Share API on
 *    web with a clipboard fallback)
 *  - "Open public profile" link that navigates to the public route in-app
 *    so workers can hit Cmd+P / browser print → save as PDF resume
 *    (SC-40 Phase B keeps the PDF as a browser-print artifact for v1.3.0)
 *
 * If the user has no slug yet, the modal renders a CTA pointing to
 * /dashboard/settings where VanityUrlSection lives.
 */

import { ROUTES } from '@scf/core/constants/routes'
import { copyToClipboard } from '@scf/core/utils/clipboard'
import {
  getPublicProfileDisplayUrl,
  getPublicProfileShareUrl,
} from '@scf/core/utils/publicProfileUrl'
import { useTranslation } from '@scf/core/utils/useTranslation'
import {
  Button,
  Modal,
  ModalActions,
  ModalContent,
  ModalHeader,
  Paragraph,
  Row,
  Stack,
  Text,
  useThemeContext,
  useToast,
} from '@scaffald/ui'
import { colors, spacing } from '@scaffald/ui/tokens'
import { useRouter } from 'expo-router'
import { Copy, ExternalLink, Share2 } from 'lucide-react-native'
import { useCallback, useMemo } from 'react'
import { Platform, Share, View } from 'react-native'
import QRCode from 'react-native-qrcode-svg'

type SharePublicProfileModalProps = {
  visible: boolean
  onClose: () => void
  /** Worker's slug. When undefined, modal renders a CTA to claim one. */
  slug?: string | null
  /** Optional display name for share-sheet copy. */
  displayName?: string | null
}

export function SharePublicProfileModal({
  visible,
  onClose,
  slug,
  displayName,
}: SharePublicProfileModalProps) {
  const toast = useToast()
  const router = useRouter()
  const { theme } = useThemeContext()
  const { t: _t } = useTranslation()

  const vanityUrl = useMemo(() => (slug ? getPublicProfileShareUrl(slug) : null), [slug])
  const displayUrl = useMemo(() => (slug ? getPublicProfileDisplayUrl(slug) : null), [slug])

  const handleCopy = useCallback(async () => {
    if (!vanityUrl) return
    const ok = await copyToClipboard(vanityUrl)
    toast.show({
      title: ok ? 'Copied!' : 'Error',
      message: ok ? 'Profile URL copied to clipboard' : 'Failed to copy URL',
      variant: ok ? undefined : 'error',
    })
  }, [vanityUrl, toast])

  const handleShare = useCallback(async () => {
    if (!vanityUrl) return
    const message = displayName
      ? `Check out my Scaffald profile, ${displayName} — ${vanityUrl}`
      : `Check out my Scaffald profile — ${vanityUrl}`

    if (Platform.OS === 'web') {
      const nav = typeof navigator !== 'undefined' ? navigator : undefined
      if (nav?.share) {
        try {
          await nav.share({ url: vanityUrl, title: 'My Scaffald profile', text: message })
          return
        } catch {
          // User dismissed share sheet — fall through to clipboard.
        }
      }
      const ok = await copyToClipboard(vanityUrl)
      toast.show({
        title: ok ? 'Copied' : 'Share unavailable',
        message: ok
          ? 'This browser doesn\'t support the share sheet, so we copied the URL instead.'
          : 'Couldn\'t share the URL. Please copy it manually.',
        variant: ok ? undefined : 'error',
      })
      return
    }

    try {
      await Share.share({ url: vanityUrl, message, title: 'My Scaffald profile' })
    } catch (err) {
      console.error('SharePublicProfileModal: native share failed', err)
      toast.show({
        title: 'Share failed',
        message: 'Couldn\'t open the share sheet. Try copying the URL instead.',
        variant: 'error',
      })
    }
  }, [vanityUrl, displayName, toast])

  const handleOpenProfile = useCallback(() => {
    if (!slug) return
    onClose()
    router.push(`/users/${slug}` as never)
  }, [slug, onClose, router])

  const handleClaimSlug = useCallback(() => {
    onClose()
    router.push(ROUTES.DASHBOARD.SETTINGS.path as never)
  }, [onClose, router])

  return (
    <Modal visible={visible} onClose={onClose} testID="share-public-profile-modal">
      <ModalContent>
        <ModalHeader title="Share your profile" onClose={onClose} />

        {!slug || !vanityUrl ? (
          <Stack gap={spacing[16]}>
            <Paragraph size="sm" style={{ color: colors.text[theme].secondary }}>
              You don't have a public profile URL yet. Claim a unique name in
              Settings → Public profile, and then share it via QR code or link.
            </Paragraph>
            <ModalActions
              primaryAction={{
                label: 'Claim my URL',
                onPress: handleClaimSlug,
              }}
              secondaryAction={{
                label: 'Not now',
                onPress: onClose,
                variant: 'outline',
              }}
            />
          </Stack>
        ) : (
          <Stack gap={spacing[20]}>
            <Paragraph size="sm" style={{ color: colors.text[theme].secondary }}>
              Show the QR code at trade events to let others scan your profile —
              or copy the link and send it anywhere.
            </Paragraph>

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
                value={vanityUrl}
                size={196}
                color={colors.text.light.primary}
                backgroundColor="#FFFFFF"
              />
            </View>

            <Stack gap={spacing[6]}>
              <Text size="sm" style={{ color: colors.text[theme].secondary }}>
                Your profile URL
              </Text>
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
                <Text size="sm" style={{ flex: 1, color: colors.text[theme].primary }}>
                  {displayUrl}
                </Text>
                <Button
                  size="sm"
                  variant="outline"
                  iconStart={Copy}
                  onPress={handleCopy}
                  accessibilityLabel="Copy profile URL"
                >
                  Copy
                </Button>
              </Row>
            </Stack>

            <Row gap={spacing[8]} wrap>
              <Button
                variant="filled"
                color="primary"
                iconStart={Share2}
                onPress={handleShare}
                style={{ flex: 1, minWidth: 140 }}
                accessibilityLabel="Share profile URL"
              >
                Share
              </Button>
              <Button
                variant="outline"
                iconStart={ExternalLink}
                onPress={handleOpenProfile}
                style={{ flex: 1, minWidth: 140 }}
                accessibilityLabel="Open public profile page"
              >
                Open profile
              </Button>
            </Row>
          </Stack>
        )}
      </ModalContent>
    </Modal>
  )
}
