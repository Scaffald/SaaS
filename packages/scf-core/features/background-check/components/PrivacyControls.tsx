import { api } from '@scf/core/utils/api'
import { Share2 } from '@tamagui/lucide-icons'
import { useMemo, useState } from 'react'
import { Alert } from 'react-native'
import { Button, Separator, Switch, Text, Row, Stack } from '@unicornlove/beyond-ui'

import type { BackgroundCheckDetail } from './status.utils'

type PrivacySettings = {
  share_publicly: boolean
  shared_with_organization_ids: string[]
}

interface PrivacyControlsProps {
  checkId: string
  metadata?: BackgroundCheckDetail['metadata']
}

function parsePrivacy(metadata?: BackgroundCheckDetail['metadata']): PrivacySettings {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return {
      share_publicly: false,
      shared_with_organization_ids: [],
    }
  }

  const record = metadata as Record<string, unknown>
  if (!('privacy' in record)) {
    return {
      share_publicly: false,
      shared_with_organization_ids: [],
    }
  }

  const privacyRecord = record.privacy
  if (!privacyRecord || typeof privacyRecord !== 'object' || Array.isArray(privacyRecord)) {
    return {
      share_publicly: false,
      shared_with_organization_ids: [],
    }
  }

  const privacy = privacyRecord as Record<string, unknown>
  return {
    share_publicly: Boolean(privacy.share_publicly),
    shared_with_organization_ids: Array.isArray(privacy.shared_with_organization_ids)
      ? (privacy.shared_with_organization_ids as string[])
      : [],
  }
}

export function PrivacyControls({ checkId, metadata }: PrivacyControlsProps) {
  const initialSettings = useMemo(() => parsePrivacy(metadata), [metadata])
  const [sharePublicly, setSharePublicly] = useState(initialSettings.share_publicly)
  const [organizationIds, setOrganizationIds] = useState(
    initialSettings.shared_with_organization_ids
  )

  const updatePrivacyMutation = api.backgroundChecks.updatePrivacy.useMutation()

  const applyUpdate = (nextSharePublicly: boolean, nextOrganizationIds: string[]) => {
    const previousShare = sharePublicly
    const previousOrganizations = organizationIds
    setSharePublicly(nextSharePublicly)
    setOrganizationIds(nextOrganizationIds)

    updatePrivacyMutation.mutate(
      {
        background_check_id: checkId,
        share_publicly: nextSharePublicly,
        shared_with_organization_ids: nextOrganizationIds,
      },
      {
        onError: (error: unknown) => {
          setSharePublicly(previousShare)
          setOrganizationIds(previousOrganizations)
          const message =
            error instanceof Error
              ? error.message
              : 'Could not update privacy settings. Please try again.'
          Alert.alert('Could not update privacy settings', message)
        },
      }
    )
  }

  const handleToggleSharePublicly = (value: boolean) => {
    applyUpdate(value, organizationIds)
  }

  const handleRevokeAccess = (organizationId: string) => {
    applyUpdate(
      sharePublicly,
      organizationIds.filter((id) => id !== organizationId)
    )
  }

  const isSaving = updatePrivacyMutation.isPending

  return (
    <Stack gap="$4">
      <Stack gap="$2">
        <Text fontSize="$4" fontWeight="600" color="$color12">
          Privacy controls
        </Text>
        <Text fontSize="$2" color="$color10">
          Manage who can see your background check results. These settings apply across the
          platform.
        </Text>
      </Stack>

      <Stack
        gap="$3"
        padding="$3"
        backgroundColor="$color2"
        borderRadius="$4"
        borderWidth={1}
        borderColor="$borderColor"
      >
        <Row justifyContent="space-between" alignItems="center">
          <Stack flex={1} gap="$1" paddingRight="$3">
            <Text fontSize="$3" fontWeight="500" color="$color12">
              Show verified badge
            </Text>
            <Text fontSize="$2" color="$color10">
              Allow organizations to see a verified badge that your background check is current.
            </Text>
          </Stack>
          <Switch
            size="$3"
            checked={sharePublicly}
            onCheckedChange={handleToggleSharePublicly}
            disabled={isSaving}
          >
            <Switch.Thumb />
          </Switch>
        </Row>
      </Stack>

      <Stack gap="$3">
        <Row justifyContent="space-between" alignItems="center">
          <Text fontSize="$3" fontWeight="500" color="$color12">
            Shared with organizations
          </Text>
          <Button
            size="$3"
            variant="outlined"
            icon={Share2}
            disabled
            onPress={() =>
              Alert.alert(
                'Coming soon',
                'Sharing with specific organizations will be available once invitations are enabled.'
              )
            }
          >
            Share
          </Button>
        </Row>

        <Stack gap="$2">
          {organizationIds.length === 0 && (
            <Stack
              gap="$1"
              padding="$3"
              backgroundColor="$color2"
              borderRadius="$3"
              borderWidth={1}
              borderColor="$borderColor"
            >
              <Text fontSize="$2" color="$color10">
                No organizations currently have access to view your results.
              </Text>
            </Stack>
          )}

          {organizationIds.map((organizationId) => (
            <Row
              key={organizationId}
              justifyContent="space-between"
              alignItems="center"
              padding="$3"
              backgroundColor="$color2"
              borderRadius="$3"
              borderWidth={1}
              borderColor="$borderColor"
            >
              <Text fontSize="$2" color="$color12">
                {organizationId}
              </Text>
              <Button
                size="$2"
                variant="outlined"
                theme="error"
                onPress={() => handleRevokeAccess(organizationId)}
                disabled={isSaving}
              >
                Revoke
              </Button>
            </Row>
          ))}
        </Stack>
      </Stack>

      <Separator />

      <Text fontSize="$2" color="$color9">
        Tip: Only share your results with trusted organizations. You can revoke access at any time.
      </Text>
    </Stack>
  )
}
