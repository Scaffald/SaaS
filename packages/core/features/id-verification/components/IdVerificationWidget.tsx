import { useMemo, type ReactNode } from "react";
import { useRouter } from "expo-router";
import { ShieldCheck, ShieldQuestion } from "@tamagui/lucide-icons";
import { Text, XStack, YStack, type GetThemeValueForKey } from "tamagui";

import { DashboardWidget, UIButton as Button } from "@app/ui";
import { RouteBuilder } from "@app/core/constants/routes";
import { api } from "@app/core/utils/api";

const formatDate = (value?: string | null) => {
  if (!value) return null;
  return new Date(value).toLocaleDateString();
};

export function IdVerificationWidget() {
  const router = useRouter();
  const badgeQuery = api.idVerification.getCurrentVerification.useQuery(undefined, {
    staleTime: 60 * 1000,
  });

  const status = useMemo(() => deriveStatus(badgeQuery), [badgeQuery]);

  return (
    <DashboardWidget>
      <YStack gap="$3">
        <XStack gap="$2" items="center">
          {status.icon}
          <YStack gap="$1">
            <Text fontSize="$4" fontWeight="600" color="$color12">
              Identity verification
            </Text>
            <Text fontSize="$2" color={status.color}>
              {status.label}
            </Text>
          </YStack>
        </XStack>

        {status.caption && (
          <Text fontSize="$2" color="$color11">
            {status.caption}
          </Text>
        )}

        <Button
          size="$3"
          theme="blue"
          onPress={() => router.push(RouteBuilder.dashboardProfileIdVerification())}
        >
          Manage verification
        </Button>
      </YStack>
    </DashboardWidget>
  );
}

type StatusDescriptor = {
  icon: ReactNode;
  label: string;
  caption?: string | null;
  color: GetThemeValueForKey<"color">;
};

function deriveStatus(
  badgeQuery: ReturnType<typeof api.idVerification.getCurrentVerification.useQuery>,
): StatusDescriptor {
  if (badgeQuery.isLoading) {
    return {
      icon: <ShieldQuestion size={20} color="$yellow10" />,
      label: "Loading badge…",
      caption: "Fetching your latest verification status.",
      color: "$color11",
    };
  }

  if (badgeQuery.isError || !badgeQuery.data) {
    return {
      icon: <ShieldQuestion size={20} color="$orange10" />,
      label: "Not verified",
      caption: "Add a verified badge to boost trust with organizations.",
      color: "$orange11",
    };
  }

  const badge = badgeQuery.data;
  const isExpired = badge.badgeStatus === "expired";
  const isRevoked = badge.badgeStatus === "revoked";
  const expiresOn = formatDate(badge.badgeExpiresAt);

  if (isRevoked) {
    return {
      icon: <ShieldQuestion size={20} color="$red10" />,
      label: "Verification revoked",
      caption: "Contact support to resolve badge issues.",
      color: "$red11",
    };
  }

  if (isExpired) {
    return {
      icon: <ShieldQuestion size={20} color="$orange10" />,
      label: "Verification expired",
      caption: expiresOn ? `Expired on ${expiresOn}` : undefined,
      color: "$orange11",
    };
  }

  return {
    icon: <ShieldCheck size={20} color="$green10" />,
    label: "Badge active",
    caption: expiresOn ? `Valid until ${expiresOn}` : undefined,
    color: "$green11",
  };
}


