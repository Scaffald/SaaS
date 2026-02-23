import { ROUTES } from "@scf/core/constants/routes";
import { useCertificationsWidget } from "@scf/core/utils/profile-widgets-sdk-hooks";
import {
  Button,
  DashboardWidget,
  EmptyState,
  H4,
  LoadingState,
} from "@scaffald/ui";
import { Award, CheckCircle } from "lucide-react-native";
import { useRouter } from "expo-router";
import { Linking } from "react-native";
import { Separator, Text, Row, Stack } from "@scaffald/ui";
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
        <LoadingState message="Loading certifications..." />
      </DashboardWidget>
    );
  }

  if (error) {
    return (
      <DashboardWidget>
        <Stack gap={16} align="center" paddingVertical={32}>
          <Text style={{ color: "#ef4444" }}>
            Failed to load certifications
          </Text>
          <Text style={{ color: "#414e62" }}>{error.message}</Text>
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
        <Row justify="space-between" align="center">
          <H4>Certifications</H4>
          {showEdit && (
            <Button
              variant="outline"
              size="sm"
              onPress={() =>
                router.push(ROUTES.DASHBOARD.PROFILE.CERTIFICATIONS.path)
              }
            >
              Edit
            </Button>
          )}
        </Row>

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
                      router.push(ROUTES.DASHBOARD.PROFILE.CERTIFICATIONS.path),
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
                          <Row
                            paddingHorizontal={8}
                            paddingVertical={2}
                            borderRadius={8}
                            style={{
                              backgroundColor: "#eff6ff",
                              borderWidth: 1,
                              borderColor: "#3b82f6",
                            }}
                          >
                            <CheckCircle size={14} color="#1d4ed8" />
                            <Text style={{ color: "#1d4ed8", marginLeft: 4 }}>
                              Active
                            </Text>
                          </Row>
                        </Row>
                        {cert.issuing_organization && (
                          <Text style={{ color: "#414e62" }}>
                            {cert.issuing_organization}
                          </Text>
                        )}
                      </Stack>

                      {/* Dates */}
                      <Row gap={16} wrap>
                        {cert.issue_date && (
                          <Stack gap={4}>
                            <Text style={{ color: "#414e62" }}>Issued</Text>
                            <Text>{formatDate(cert.issue_date)}</Text>
                          </Stack>
                        )}
                        {!cert.does_not_expire && cert.expiration_date && (
                          <Stack gap={4}>
                            <Text style={{ color: "#414e62" }}>Expires</Text>
                            <Text>{formatDate(cert.expiration_date)}</Text>
                          </Stack>
                        )}
                        {cert.does_not_expire && (
                          <Stack gap={4}>
                            <Text style={{ color: "#414e62" }}>Validity</Text>
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
                                <Text style={{ color: "#414e62" }}>
                                  Credential ID
                                </Text>
                                <Text>{cert.credential_id}</Text>
                              </Stack>
                            )}
                            {cert.credential_url && (
                              <Stack gap={4}>
                                <Text style={{ color: "#414e62" }}>
                                  Verification
                                </Text>
                                <Text
                                  style={{
                                    color: "#3b82f6",
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
                <Text style={{ color: "#414e62" }}>
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
                        style={{ borderWidth: 1, borderColor: "#e2e8f0" }}
                      >
                        <Text style={{ color: "#414e62" }}>Expired</Text>
                      </Row>
                    </Row>
                    {cert.issuing_organization && (
                      <Text style={{ color: "#414e62" }}>
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
                style={{ color: "#3b82f6" }}
                onPress={() =>
                  router.push(ROUTES.DASHBOARD.PROFILE.CERTIFICATIONS.path)
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
