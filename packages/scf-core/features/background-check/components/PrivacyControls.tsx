import { useAdminUpdatePrivacyMutation } from "@scf/core/utils/background-checks-sdk-hooks";
import { Share2 } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Alert } from "react-native";
import { Button, Separator, Switch, Text, Row, Stack } from "@scaffald/ui";

import type { BackgroundCheckDetail } from "./status.utils";

type PrivacySettings = {
  share_publicly: boolean;
  shared_with_organization_ids: string[];
};

interface PrivacyControlsProps {
  checkId: string;
  metadata?: BackgroundCheckDetail["metadata"];
}

function parsePrivacy(
  metadata?: BackgroundCheckDetail["metadata"]
): PrivacySettings {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return {
      share_publicly: false,
      shared_with_organization_ids: [],
    };
  }

  const record = metadata as Record<string, unknown>;
  if (!("privacy" in record)) {
    return {
      share_publicly: false,
      shared_with_organization_ids: [],
    };
  }

  const privacyRecord = record.privacy;
  if (
    !privacyRecord ||
    typeof privacyRecord !== "object" ||
    Array.isArray(privacyRecord)
  ) {
    return {
      share_publicly: false,
      shared_with_organization_ids: [],
    };
  }

  const privacy = privacyRecord as Record<string, unknown>;
  return {
    share_publicly: Boolean(privacy.share_publicly),
    shared_with_organization_ids: Array.isArray(
      privacy.shared_with_organization_ids
    )
      ? (privacy.shared_with_organization_ids as string[])
      : [],
  };
}

export function PrivacyControls({ checkId, metadata }: PrivacyControlsProps) {
  const initialSettings = useMemo(() => parsePrivacy(metadata), [metadata]);
  const [sharePublicly, setSharePublicly] = useState(
    initialSettings.share_publicly
  );
  const [organizationIds, setOrganizationIds] = useState(
    initialSettings.shared_with_organization_ids
  );

  const updatePrivacyMutation = useAdminUpdatePrivacyMutation();

  const applyUpdate = (
    nextSharePublicly: boolean,
    nextOrganizationIds: string[]
  ) => {
    const previousShare = sharePublicly;
    const previousOrganizations = organizationIds;
    setSharePublicly(nextSharePublicly);
    setOrganizationIds(nextOrganizationIds);

    updatePrivacyMutation.mutate(
      {
        checkId,
        share_publicly: nextSharePublicly,
        shared_with_organization_ids: nextOrganizationIds,
      },
      {
        onError: (error: unknown) => {
          setSharePublicly(previousShare);
          setOrganizationIds(previousOrganizations);
          const message =
            error instanceof Error
              ? error.message
              : "Could not update privacy settings. Please try again.";
          Alert.alert("Could not update privacy settings", message);
        },
      }
    );
  };

  const handleToggleSharePublicly = (value: boolean) => {
    applyUpdate(value, organizationIds);
  };

  const handleRevokeAccess = (organizationId: string) => {
    applyUpdate(
      sharePublicly,
      organizationIds.filter((id) => id !== organizationId)
    );
  };

  const isSaving = updatePrivacyMutation.isPending;

  return (
    <Stack gap={16}>
      <Stack gap={8}>
        <Text color="$gray11">Privacy controls</Text>
        <Text color="$gray11">
          Manage who can see your background check results. These settings apply
          across the platform.
        </Text>
      </Stack>

      <Stack
        gap={12}
        padding="sm"
        backgroundColor="$color2"
        borderRadius={16}
        borderWidth={1}
        borderColor="$borderColor"
      >
        <Row justify="space-between" align="center">
          <Stack flex={1} gap={4} paddingRight={12}>
            <Text color="$gray11">Show verified badge</Text>
            <Text color="$gray11">
              Allow organizations to see a verified badge that your background
              check is current.
            </Text>
          </Stack>
          <Switch
            size="sm"
            checked={sharePublicly}
            onChange={handleToggleSharePublicly}
            disabled={isSaving}
          />
        </Row>
      </Stack>

      <Stack gap={12}>
        <Row justify="space-between" align="center">
          <Text color="$gray11">Shared with organizations</Text>
          <Button
            size="sm"
            variant="outline"
            iconStart={Share2}
            disabled
            onPress={() =>
              Alert.alert(
                "Coming soon",
                "Sharing with specific organizations will be available once invitations are enabled."
              )
            }
          >
            Share
          </Button>
        </Row>

        <Stack gap={8}>
          {organizationIds.length === 0 && (
            <Stack
              gap={4}
              padding="sm"
              backgroundColor="$color2"
              borderRadius={12}
              borderWidth={1}
              borderColor="$borderColor"
            >
              <Text color="$gray11">
                No organizations currently have access to view your results.
              </Text>
            </Stack>
          )}

          {organizationIds.map((organizationId) => (
            <Row
              key={organizationId}
              justify="space-between"
              align="center"
              padding="sm"
              backgroundColor="$color2"
              borderRadius={12}
              borderWidth={1}
              borderColor="$borderColor"
            >
              <Text color="$gray11">{organizationId}</Text>
              <Button
                size="sm"
                variant="outline"
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

      <Text color="$gray11">
        Tip: Only share your results with trusted organizations. You can revoke
        access at any time.
      </Text>
    </Stack>
  );
}
