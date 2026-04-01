import { ROUTES } from "@scf/core/constants/routes";
import { useCertificationsWidget } from "@scf/core/utils/profile-widgets-sdk-hooks";
import {
  Button,
  DashboardWidget,
  DashboardWidgetHeader,
  EmptyState,
  Separator,
  Skeleton,
  SkeletonGroup,
  SkeletonList,
  Text,
  Row,
  Stack,
  useThemeContext,
} from "@scaffald/ui";
import { Award, CheckCircle } from "lucide-react-native";
import { useRouter } from "expo-router";
import { Linking } from "react-native";
import { colors } from "@scaffald/ui/tokens";
import { workerPalette } from "@scf/core/components/ui/styles";
import { Pill } from "@scf/core/components/ui/CardPrimitives";
import { formatDate } from "../utils/date-formatting";
import type { ProfileWidgetProps } from "./types";
import type { CertificationWidgetEntry } from "@scaffald/sdk";

type UserCertification = CertificationWidgetEntry;

/**
 * CertificationsWidget
 * Displays user's professional certifications
 *
 * @param userId - User ID to display (defaults to current user)
 * @param showEdit - Show edit button for own profile
 * @param variant - Display variant (compact or full)
 */
export function CertificationsWidget({
  userId,
  showEdit = false,
  variant = "full",
}: ProfileWidgetProps) {
  const router = useRouter();
  const { theme } = useThemeContext();
  const t = theme === "dark" ? "dark" : "light" as const;
  const pal = workerPalette[t];
  const { data, isLoading, error, refetch, isFetching } =
    useCertificationsWidget(
      { userId },
      {
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
      }
    );

  if (isLoading) {
    return (
      <DashboardWidget>
        <SkeletonGroup gap={12} animation="wave">
          <Skeleton width={120} height={20} shape="text" />
          <SkeletonList count={3} variant="profile" />
        </SkeletonGroup>
      </DashboardWidget>
    );
  }

  if (error) {
    return (
      <DashboardWidget>
        <Stack gap={16} align="center" paddingVertical={32}>
          <Text style={{ color: colors.fg[theme].error }}>
            Failed to load certifications
          </Text>
          <Text style={{ color: colors.text[theme].secondary }}>{error.message}</Text>
          <Button
            variant="filled"
            color="primary"
            size="sm"
            onPress={() => {
              void refetch();
            }}
            disabled={isFetching}
          >
            Retry
          </Button>
        </Stack>
      </DashboardWidget>
    );
  }

  const certifications = data || [];
  const showCompact = variant === "compact";

  // Helper to check if certification is expired
  const isExpired = (cert: UserCertification): boolean => {
    if (cert.does_not_expire) return false;
    if (!cert.expiration_date) return false;
    return new Date(cert.expiration_date) < new Date();
  };

  // Separate active and expired certifications
  const activeCerts = certifications.filter(
    (cert: UserCertification) => !isExpired(cert)
  );
  const expiredCerts = certifications.filter((cert: UserCertification) =>
    isExpired(cert)
  );

  return (
    <DashboardWidget>
      <Stack gap={12}>
        {/* Header */}
        <DashboardWidgetHeader
          title="Certifications"
          action={
            showEdit ? (
              <Button
                variant="outline"
                size="sm"
                onPress={() =>
                  router.push(ROUTES.PROFILE.CERTIFICATIONS.path)
                }
              >
                Edit
              </Button>
            ) : undefined
          }
        />

        {certifications.length === 0 ? (
          <EmptyState
            icon={Award}
            title="No certifications added yet"
            description="Add your professional certifications and licenses"
            action={
              showEdit
                ? {
                    label: "Add Certification",
                    onPress: () =>
                      router.push(ROUTES.PROFILE.CERTIFICATIONS.path),
                  }
                : undefined
            }
          />
        ) : (
          <Stack gap={16}>
            {/* Active Certifications */}
            {activeCerts.length > 0 && (
              <Stack gap={12}>
                {activeCerts
                  .slice(0, showCompact ? 3 : undefined)
                  .map((cert: UserCertification, index: number) => (
                    <Stack key={cert.id} gap={8}>
                      {/* Certification Name & Organization */}
                      <Stack gap={4}>
                        <Row gap={8} align="center">
                          <Text>{cert.name}</Text>
                          <Row gap={4} align="center">
                            <CheckCircle size={14} color={pal.accent} />
                            <Pill label="Active" bgColor={pal.pillBg} textColor={pal.pillText} />
                          </Row>
                        </Row>
                        {cert.issuing_organization && (
                          <Text style={{ color: colors.text[theme].secondary }}>
                            {cert.issuing_organization}
                          </Text>
                        )}
                      </Stack>

                      {/* Dates */}
                      <Row gap={16} wrap>
                        {cert.issue_date && (
                          <Stack gap={4}>
                            <Text style={{ color: colors.text[theme].secondary }}>Issued</Text>
                            <Text>{formatDate(cert.issue_date)}</Text>
                          </Stack>
                        )}
                        {!cert.does_not_expire && cert.expiration_date && (
                          <Stack gap={4}>
                            <Text style={{ color: colors.text[theme].secondary }}>Expires</Text>
                            <Text>{formatDate(cert.expiration_date)}</Text>
                          </Stack>
                        )}
                        {cert.does_not_expire && (
                          <Stack gap={4}>
                            <Text style={{ color: colors.text[theme].secondary }}>Validity</Text>
                            <Text>No Expiration</Text>
                          </Stack>
                        )}
                      </Row>

                      {/* Credential Details */}
                      {!showCompact &&
                        (cert.credential_id || cert.credential_url) && (
                          <Row gap={16} wrap>
                            {cert.credential_id && (
                              <Stack gap={4}>
                                <Text style={{ color: colors.text[theme].secondary }}>
                                  Credential ID
                                </Text>
                                <Text>{cert.credential_id}</Text>
                              </Stack>
                            )}
                            {cert.credential_url && (
                              <Stack gap={4}>
                                <Text style={{ color: colors.text[theme].secondary }}>
                                  Verification
                                </Text>
                                <Text
                                  style={{
                                    color: pal.accent,
                                    textDecorationLine: "underline",
                                  }}
                                  onPress={() =>
                                    Linking.openURL(cert.credential_url || "")
                                  }
                                >
                                  View Certificate →
                                </Text>
                              </Stack>
                            )}
                          </Row>
                        )}

                      {/* Separator */}
                      {index < activeCerts.length - 1 && (
                        <Separator style={{ marginVertical: 8 }} />
                      )}
                    </Stack>
                  ))}
              </Stack>
            )}

            {/* Expired Certifications (collapsed by default, only in full variant) */}
            {!showCompact && expiredCerts.length > 0 && (
              <Stack gap={12}>
                <Text style={{ color: colors.text[theme].secondary }}>
                  Expired ({expiredCerts.length})
                </Text>
                {expiredCerts.slice(0, 2).map((cert: UserCertification) => (
                  <Stack key={cert.id} gap={4} style={{ opacity: 0.6 }}>
                    <Row gap={8} align="center">
                      <Text>{cert.name}</Text>
                      <Row
                        paddingHorizontal={8}
                        paddingVertical={2}
                        borderRadius={8}
                        style={{ borderWidth: 1, borderColor: colors.border[theme].subtle }}
                      >
                        <Text style={{ color: colors.text[theme].secondary }}>Expired</Text>
                      </Row>
                    </Row>
                    {cert.issuing_organization && (
                      <Text style={{ color: colors.text[theme].secondary }}>
                        {cert.issuing_organization}
                      </Text>
                    )}
                  </Stack>
                ))}
              </Stack>
            )}

            {/* Show More link for compact view */}
            {showCompact && certifications.length > 3 && (
              <Text
                style={{ color: pal.accent }}
                onPress={() =>
                  router.push(ROUTES.PROFILE.CERTIFICATIONS.path)
                }
              >
                View all {certifications.length} certifications →
              </Text>
            )}
          </Stack>
        )}
      </Stack>
    </DashboardWidget>
  );
}
