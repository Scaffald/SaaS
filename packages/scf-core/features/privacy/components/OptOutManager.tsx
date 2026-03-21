/**
 * Opt-Out Manager Component
 * CCPA Compliance Implementation
 *
 * Component for managing CCPA opt-out preferences:
 * - Sale of personal information
 * - Sharing of personal information
 * - Targeted advertising
 * - GPC (Global Privacy Control) status display
 */

import { useState, useEffect } from "react";
import { Pressable } from "react-native";
import { Button, Text, Row, Stack, Spinner, useThemeContext } from "@scaffald/ui";
import { colors } from "@scaffald/ui/tokens";
import type { CCPAOptOutStatus } from "@scaffald/sdk";
import {
  useCCPAMyOptOuts,
  useCCPASetOptOutMutation,
} from "@scf/core/utils/ccpa-sdk-hooks";

/**
 * Opt-out category type (matches CCPA SDK)
 */
export type OptOutCategory =
  | "sale"
  | "sharing"
  | "targeted_advertising"
  | "sensitive_data";

/**
 * Props for OptOutManager
 */
interface OptOutManagerProps {
  onClose?: () => void;
}

/**
 * Category metadata
 */
const CATEGORY_INFO: Record<
  OptOutCategory,
  {
    title: string;
    description: string;
    legalBasis: string;
  }
> = {
  sale: {
    title: "Sale of Personal Information",
    description:
      'Opt-out of the sale of your personal information to third parties. Under CCPA, "sale" includes any exchange of personal information for valuable consideration.',
    legalBasis: "Cal. Civ. Code § 1798.120(a)",
  },
  sharing: {
    title: "Sharing for Cross-Context Behavioral Advertising",
    description:
      "Opt-out of sharing your personal information for cross-context behavioral advertising purposes.",
    legalBasis: "Cal. Civ. Code § 1798.120(a)",
  },
  targeted_advertising: {
    title: "Targeted Advertising",
    description:
      "Opt-out of the use of your personal information for targeted advertising based on your activities across different services.",
    legalBasis: "Cal. Civ. Code § 1798.120(a)",
  },
  sensitive_data: {
    title: "Use of Sensitive Personal Information",
    description:
      "Limit the use of your sensitive personal information to only what is necessary for providing the services you requested.",
    legalBasis: "Cal. Civ. Code § 1798.121",
  },
};

/**
 * Format date string
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Toggle switch component
 */
function ToggleSwitch({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={disabled ? undefined : () => onChange(!checked)}
      style={{
        width: 50,
        height: 28,
        borderRadius: 14,
        backgroundColor: checked ? colors.green[500] : colors.gray[300],
        padding: 2,
        opacity: disabled ? 0.5 : 1,
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <Stack
        width={24}
        height={24}
        borderRadius={12}
        backgroundColor={colors.white}
        style={{ marginLeft: checked ? 22 : 0 }}
      />
    </Pressable>
  );
}

/**
 * Opt-out category row component
 */
function OptOutRow({
  category,
  status,
  onToggle,
  isPending,
}: {
  category: OptOutCategory;
  status: CCPAOptOutStatus | undefined;
  onToggle: (category: OptOutCategory, optOut: boolean) => void;
  isPending: boolean;
}) {
  const { theme } = useThemeContext();
  const info = CATEGORY_INFO[category];
  const isOptedOut = status?.opted_out ?? false;
  const isGPCOptOut = status?.source === "gpc";

  return (
    <Stack
      padding="md"
      backgroundColor={colors.bg[theme].subtle}
      borderRadius={12}
      borderWidth={1}
      borderColor={colors.border[theme].default}
      gap={12}
    >
      <Row justify="space-between" align="flex-start">
        <Stack flex={1} gap={4} marginRight={16}>
          <Text>{info.title}</Text>
          <Text style={{ color: colors.text[theme].secondary }}>
            {info.description}
          </Text>
        </Stack>

        <Stack align="center" gap={4}>
          <ToggleSwitch
            checked={isOptedOut}
            onChange={(checked) => onToggle(category, checked)}
            disabled={isPending || isGPCOptOut}
          />
          <Text
            style={{
              color: isOptedOut ? colors.success[600] : colors.text[theme].tertiary,
            }}
          >
            {isOptedOut ? "Opted Out" : "Opted In"}
          </Text>
        </Stack>
      </Row>

      {/* Status info */}
      {status?.opted_out_at != null && (
        <Row gap={8} align="center">
          <Text style={{ color: colors.text[theme].secondary }}>
            {isGPCOptOut ? "Via GPC signal" : "Manual opt-out"} on{" "}
            {formatDate(status.opted_out_at)}
          </Text>
        </Row>
      )}

      {isGPCOptOut && (
        <Row padding="xs" backgroundColor={colors.blue[50]} borderRadius={8}>
          <Text style={{ color: colors.blue[700] }}>
            This opt-out was automatically applied based on your browser&apos;s
            Global Privacy Control (GPC) signal. To change this setting, disable
            GPC in your browser.
          </Text>
        </Row>
      )}

      {/* Legal basis */}
      <Text style={{ color: colors.text[theme].secondary }}>
        Legal basis: {info.legalBasis}
      </Text>
    </Stack>
  );
}

/**
 * Opt-Out Manager Component
 */
export function OptOutManager({ onClose }: OptOutManagerProps) {
  const { theme } = useThemeContext();
  const [hasGPC, setHasGPC] = useState(false);
  const [pendingCategory, setPendingCategory] = useState<OptOutCategory | null>(
    null
  );

  // Detect GPC signal
  useEffect(() => {
    // Check for GPC signal in browser
    const gpcSignal =
      typeof navigator !== "undefined" &&
      // @ts-expect-error - GPC is not yet in TypeScript types
      (navigator.globalPrivacyControl === true || navigator.doNotTrack === "1");

    setHasGPC(gpcSignal);
  }, []);

  // Fetch current opt-out status
  const { data: optOutData, isLoading, error, refetch } = useCCPAMyOptOuts();

  // Set opt-out mutation
  const setOptOut = useCCPASetOptOutMutation({
    onSuccess: () => {
      refetch();
      setPendingCategory(null);
    },
    onError: () => {
      setPendingCategory(null);
    },
  });

  const handleToggle = (category: OptOutCategory, optOut: boolean) => {
    setPendingCategory(category);
    setOptOut.mutate({ category, optOut });
  };

  // Build status map from API response
  const statusMap: Record<OptOutCategory, CCPAOptOutStatus | undefined> = {
    sale: optOutData?.optOuts?.find(
      (o: CCPAOptOutStatus) => o.category === "sale"
    ),
    sharing: optOutData?.optOuts?.find(
      (o: CCPAOptOutStatus) => o.category === "sharing"
    ),
    targeted_advertising: optOutData?.optOuts?.find(
      (o: CCPAOptOutStatus) => o.category === "targeted_advertising"
    ),
    sensitive_data: optOutData?.optOuts?.find(
      (o: CCPAOptOutStatus) => o.category === "sensitive_data"
    ),
  };

  if (error) {
    return (
      <Stack padding="md" gap={16} align="center">
        <Text style={{ color: colors.error[600] }}>
          Error loading opt-out preferences
        </Text>
        <Text style={{ color: colors.text[theme].secondary }}>{error.message}</Text>
        <Button onPress={() => refetch()} variant="outline">
          Retry
        </Button>
      </Stack>
    );
  }

  return (
    <Stack gap={16} padding="md">
      {/* Header */}
      <Stack gap={8}>
        <Text>Manage Opt-Out Preferences</Text>
        <Text style={{ color: colors.text[theme].secondary }}>
          Control how your personal information is used and shared. Your choices
          here are protected under the California Consumer Privacy Act (CCPA).
        </Text>
      </Stack>

      {/* GPC Detection Banner */}
      {hasGPC && (
        <Row
          padding="sm"
          backgroundColor={colors.green[50]}
          borderRadius={12}
          borderWidth={1}
          borderColor={colors.green[200]}
          gap={8}
          align="center"
        >
          <Stack
            width={24}
            height={24}
            borderRadius={12}
            backgroundColor={colors.green[500]}
            align="center"
            justify="center"
          >
            <Text style={{ color: colors.white }}>✓</Text>
          </Stack>
          <Stack flex={1}>
            <Text style={{ color: colors.green[700] }}>
              Global Privacy Control Detected
            </Text>
            <Text style={{ color: colors.green[700] }}>
              Your browser has sent a Global Privacy Control (GPC) signal. We
              honor this signal and have automatically opted you out of data
              sale and sharing.
            </Text>
          </Stack>
        </Row>
      )}

      {/* Loading state */}
      {isLoading ? (
        <Row padding="xl" justify="center">
          <Spinner size="lg" />
        </Row>
      ) : (
        <>
          {/* Opt-out categories */}
          <Stack gap={12}>
            <OptOutRow
              category="sale"
              status={statusMap.sale}
              onToggle={handleToggle}
              isPending={pendingCategory === "sale"}
            />
            <OptOutRow
              category="sharing"
              status={statusMap.sharing}
              onToggle={handleToggle}
              isPending={pendingCategory === "sharing"}
            />
            <OptOutRow
              category="targeted_advertising"
              status={statusMap.targeted_advertising}
              onToggle={handleToggle}
              isPending={pendingCategory === "targeted_advertising"}
            />
            <OptOutRow
              category="sensitive_data"
              status={statusMap.sensitive_data}
              onToggle={handleToggle}
              isPending={pendingCategory === "sensitive_data"}
            />
          </Stack>

          {/* Opt-out all button */}
          <Row gap={12} justify="center" marginTop={8}>
            <Button
              size="md"
              onPress={() => {
                // Opt out of all categories
                const categories: OptOutCategory[] = [
                  "sale",
                  "sharing",
                  "targeted_advertising",
                  "sensitive_data",
                ];
                categories.forEach((cat) => {
                  if (!statusMap[cat]?.opted_out) {
                    setOptOut.mutate({ category: cat, optOut: true });
                  }
                });
              }}
            >
              Opt Out of All
            </Button>
          </Row>
        </>
      )}

      {/* Non-discrimination notice */}
      <Stack
        padding="sm"
        backgroundColor={colors.bg[theme].muted}
        borderRadius={8}
        marginTop={8}
      >
        <Text style={{ color: colors.text[theme].secondary }}>
          <Text>Non-Discrimination Notice:</Text> We will not discriminate
          against you for exercising any of your privacy rights. You will
          receive the same service and pricing regardless of your privacy
          choices.
        </Text>
      </Stack>

      {/* Info about processing */}
      <Stack gap={8} marginTop={8}>
        <Text>How Opt-Outs Work</Text>
        <Text style={{ color: colors.text[theme].secondary }}>
          • Opt-out preferences take effect immediately
        </Text>
        <Text style={{ color: colors.text[theme].secondary }}>
          • We will not sell or share your data with third parties while you are
          opted out
        </Text>
        <Text style={{ color: colors.text[theme].secondary }}>
          • You can change your preferences at any time
        </Text>
        <Text style={{ color: colors.text[theme].secondary }}>
          • If you use GPC, your opt-out will be automatically applied across
          all participating sites
        </Text>
      </Stack>

      {/* Close button */}
      {onClose && (
        <Row justify="flex-end" marginTop={16}>
          <Button variant="outline" onPress={onClose}>
            Close
          </Button>
        </Row>
      )}
    </Stack>
  );
}

export default OptOutManager;
