import {
  useUserCertificationTree,
  useUpdateCertificationProofMutation,
  useToggleSpecificCertificationMutation,
} from "@scf/core/utils/profile-certifications-sdk-hooks";
import { useQueryClient } from "@tanstack/react-query";
import { getStorageUrl } from "@scf/core/utils/supabase/storage";
import { ProfileSectionIntro } from "@scf/core/features/profile/components";
import { Button, DashboardWidget, useThemeContext } from "@scaffald/ui";
import { colors } from "@scaffald/ui/tokens";
import { workerPalette } from "@scf/core/components/ui/styles";
import {
  Award,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Trash2,
  Upload,
} from "lucide-react-native";
import { useState } from "react";
import { Pressable } from "react-native";
import { openExternalLink, pickFile } from "@scf/core/utils/platform";
import { Card, H4, Input, ScrollView, Text, Row, Stack, useToast } from "@scaffald/ui";
import { useProfileCertificationsHighlight } from "./profile-certifications-highlight-context";

interface UserCertification {
  id: string;
  certification_id: string;
  credential_url: string | null;
  certificate_file_path: string | null;
  // Populated when flattening depth1ByParent / depth2ByParent — the API tree's
  // map key is the catalog parent_id, which the toggle-specific / remove-top-level
  // endpoints need to identify the parent in the user's certification chain.
  parent_id?: string | null;
  catalog: {
    title: string;
    description: string | null;
    depth: number;
  };
}

interface CertificationTree {
  depth0: UserCertification[];
  depth1ByParent: Record<string, UserCertification[]>;
  depth2ByParent: Record<string, UserCertification[]>;
}

/**
 * Profile Certifications Right Component
 * Displays all certifications at all depth levels with proof management
 */
export function ProfileCertificationsRight() {
  const { theme } = useThemeContext();
  const t = theme === "dark" ? "dark" : "light" as const;
  const pal = workerPalette[t];
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [selectedFiles, setSelectedFiles] = useState<
    Record<string, File | null>
  >({});
  const [urlInputs, setUrlInputs] = useState<Record<string, string>>({});
  const { highlights: recentlyChangedCerts } =
    useProfileCertificationsHighlight();
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data: certTree } = useUserCertificationTree();

  const updateProof = useUpdateCertificationProofMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["profiles", "certifications", "tree"],
      });
    },
  });

  const removeCert = useToggleSpecificCertificationMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["profiles", "certifications", "tree"],
      });
    },
  });

  // Get all certifications at all depth levels
  const getAllCertifications = (): {
    depth0: UserCertification[];
    depth1: UserCertification[];
    depth2: UserCertification[];
  } => {
    const typedTree = certTree as unknown as CertificationTree | undefined;
    if (!typedTree) {
      return { depth0: [], depth1: [], depth2: [] };
    }

    const depth0 = typedTree.depth0 || [];
    const depth1: UserCertification[] = [];
    const depth2: UserCertification[] = [];

    // Preserve parent_id from the map key — depth1's parent is a depth-0 cert,
    // depth2's parent is a depth-1 cert. Without this, handleRemove can't tell
    // toggle-specific which parent the cert sits under (SC-115).
    for (const [parentId, items] of Object.entries(typedTree.depth1ByParent || {})) {
      if (Array.isArray(items)) {
        depth1.push(...items.map((item) => ({ ...item, parent_id: parentId })));
      }
    }

    for (const [parentId, items] of Object.entries(typedTree.depth2ByParent || {})) {
      if (Array.isArray(items)) {
        depth2.push(...items.map((item) => ({ ...item, parent_id: parentId })));
      }
    }

    return { depth0, depth1, depth2 };
  };

  const { depth0, depth1, depth2 } = getAllCertifications();
  const allCerts = [...depth0, ...depth1, ...depth2];

  const toggleExpand = (certId: string) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(certId)) {
        next.delete(certId);
      } else {
        next.add(certId);
      }
      return next;
    });
  };

  const handleFileSelect = (userCertId: string, file: File | null) => {
    setSelectedFiles((prev) => ({ ...prev, [userCertId]: file }));
  };

  const handleSaveFile = async (userCertId: string) => {
    const file = selectedFiles[userCertId];
    if (!file) return;

    try {
      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      await updateProof.mutateAsync({
        user_certification_id: userCertId,
        proof_type: "file",
        certificate_file: base64,
        file_name: file.name,
        content_type: file.type,
      });
      setSelectedFiles((prev) => ({ ...prev, [userCertId]: null }));
      toast.show({
        title: "Certificate uploaded",
        message: `${file.name} attached to your certification.`,
      });
    } catch (error) {
      console.error("Error saving file:", error);
      toast.show({
        title: "Upload failed",
        message:
          error instanceof Error
            ? error.message
            : "Couldn't attach that file. Try again.",
        variant: "error",
      });
    }
  };

  const handleSaveUrl = async (userCertId: string) => {
    const url = urlInputs[userCertId];
    if (!url) return;

    try {
      await updateProof.mutateAsync({
        user_certification_id: userCertId,
        proof_type: "url",
        credential_url: url,
      });
      setUrlInputs((prev) => ({ ...prev, [userCertId]: "" }));
      toast.show({
        title: "Credential URL saved",
        message: "Link attached to your certification.",
      });
    } catch (error) {
      console.error("Error saving URL:", error);
      toast.show({
        title: "Couldn't save URL",
        message:
          error instanceof Error
            ? error.message
            : "Check the link and try again.",
        variant: "error",
      });
    }
  };

  const handleRemove = async (userCert: UserCertification) => {
    const confirmed = confirm(`Remove ${userCert.catalog.title}?`);
    if (!confirmed) return;

    // SC-115: parent_id is the catalog-id of the depth-1 category that owns
    // this depth-2 cert. The flatten step above attaches it; if it's missing
    // the row was unexpectedly orphaned — bail rather than send a wrong id.
    if (!userCert.parent_id) {
      toast.show({
        title: "Can't remove this certification",
        message:
          "It's missing a parent category. Refresh and try again, or report this if it persists.",
        variant: "error",
      });
      return;
    }

    try {
      await removeCert.mutateAsync({
        certification_id: userCert.certification_id,
        parent_id: userCert.parent_id,
        checked: false,
      });
    } catch (error) {
      console.error("Error removing certification:", error);
      toast.show({
        title: "Couldn't remove",
        message:
          error instanceof Error
            ? error.message
            : "Try again in a moment.",
        variant: "error",
      });
    }
  };

  if (allCerts.length === 0) {
    return (
      <Stack gap={16}>
        <ProfileSectionIntro
          title="Certifications"
          description="Search for a certification to add it. You can attach proof (file or URL) and manage them here."
        />
        <DashboardWidget>
        <Stack gap={16} align="center" paddingTop={32}>
          <Award size={48} color={colors.text[theme].secondary} />
          <Stack gap={8} align="center">
            <H4>Your Certifications</H4>
            <Text style={{ color: colors.text[theme].secondary }}>
              Search for a certification to add it
            </Text>
          </Stack>
        </Stack>
      </DashboardWidget>
      </Stack>
    );
  }

  return (
    <Stack gap={16}>
      <ProfileSectionIntro
        title="Certifications"
        description="Search for a certification to add it. You can attach proof (file or URL) and manage them here."
      />
      <DashboardWidget>
      <Stack gap={16}>
        <H4>Your Certifications</H4>

        <ScrollView style={{ height: 700 }}>
          <Stack gap={16}>
            {/* Depth 0 - Top Level Categories */}
            {depth0.length > 0 && (
              <Stack gap={8}>
                <Text
                  style={{
                    color: pal.pillText,
                  }}
                >
                  Top-Level Categories
                </Text>
                {depth0.map((cert) => {
                  const changeStatus =
                    recentlyChangedCerts[cert.certification_id];
                  return (
                    <Card
                      key={cert.id}
                      padding="sm"
                      style={{
                        backgroundColor:
                          changeStatus === "added"
                            ? theme === "light"
                              ? colors.green[50]
                              : colors.green[900]
                            : changeStatus === "removed"
                            ? theme === "light"
                              ? colors.error[50]
                              : colors.error[900]
                            : colors.bg[theme].default,
                        borderWidth: 1,
                        borderColor:
                          changeStatus === "added"
                            ? theme === "light"
                              ? colors.green[300]
                              : colors.green[700]
                            : changeStatus === "removed"
                            ? theme === "light"
                              ? colors.error[300]
                              : colors.error[700]
                            : colors.border[theme].default,
                      }}
                    >
                      <Row justify="space-between" align="center">
                        <Stack style={{ flex: 1 }} gap={4}>
                          <Row gap={8} align="center">
                            <Text>{cert.catalog.title}</Text>
                            <Text
                              style={{
                                color: pal.pillText,
                                backgroundColor: pal.pillBg,
                                paddingHorizontal: 8,
                                paddingVertical: 2,
                                borderRadius: 8,
                              }}
                            >
                              Top Level
                            </Text>
                          </Row>
                          {cert.catalog.description && (
                            <Text
                              style={{ color: colors.text[theme].secondary }}
                            >
                              {cert.catalog.description}
                            </Text>
                          )}
                        </Stack>
                      </Row>
                      {changeStatus === "added" && (
                        <Text
                          style={{
                            marginTop: 8,
                            color:
                              theme === "light"
                                ? colors.green[700]
                                : colors.green[300],
                          }}
                        >
                          ✓ Added to profile
                        </Text>
                      )}
                    </Card>
                  );
                })}
              </Stack>
            )}

            {/* Depth 1 - Categories */}
            {depth1.length > 0 && (
              <Stack gap={8}>
                <Text
                  style={{
                    color:
                      theme === "light"
                        ? colors.success[700]
                        : colors.success[300],
                  }}
                >
                  Sub-Categories
                </Text>
                {depth1.map((cert) => {
                  const changeStatus =
                    recentlyChangedCerts[cert.certification_id];
                  return (
                    <Card
                      key={cert.id}
                      padding="sm"
                      style={{
                        backgroundColor:
                          changeStatus === "added"
                            ? theme === "light"
                              ? colors.green[50]
                              : colors.green[900]
                            : changeStatus === "removed"
                            ? theme === "light"
                              ? colors.error[50]
                              : colors.error[900]
                            : colors.bg[theme].default,
                        borderWidth: 1,
                        borderColor:
                          changeStatus === "added"
                            ? theme === "light"
                              ? colors.green[300]
                              : colors.green[700]
                            : changeStatus === "removed"
                            ? theme === "light"
                              ? colors.error[300]
                              : colors.error[700]
                            : colors.border[theme].default,
                      }}
                    >
                      <Row justify="space-between" align="center">
                        <Stack style={{ flex: 1 }} gap={4}>
                          <Row gap={8} align="center">
                            <Text>{cert.catalog.title}</Text>
                            <Text
                              style={{
                                color:
                                  theme === "light"
                                    ? colors.success[700]
                                    : colors.success[300],
                                backgroundColor:
                                  theme === "light"
                                    ? colors.success[50]
                                    : colors.success[900],
                                paddingHorizontal: 8,
                                paddingVertical: 2,
                                borderRadius: 8,
                              }}
                            >
                              Category
                            </Text>
                          </Row>
                          {cert.catalog.description && (
                            <Text
                              style={{ color: colors.text[theme].secondary }}
                            >
                              {cert.catalog.description}
                            </Text>
                          )}
                        </Stack>
                      </Row>
                      {changeStatus === "added" && (
                        <Text
                          style={{
                            marginTop: 8,
                            color:
                              theme === "light"
                                ? colors.success[700]
                                : colors.success[300],
                          }}
                        >
                          ✓ Added to profile
                        </Text>
                      )}
                    </Card>
                  );
                })}
              </Stack>
            )}

            {/* Depth 2 - Specific Certifications */}
            {depth2.length > 0 && (
              <Stack gap={8}>
                <Text
                  style={{
                    color:
                      theme === "light"
                        ? colors.purple[700]
                        : colors.purple[300],
                  }}
                >
                  Specific Certifications
                </Text>
                {depth2.map((cert) => {
                  const isExpanded = expandedCards.has(cert.id);
                  const hasProof = !!(
                    cert.credential_url || cert.certificate_file_path
                  );
                  const changeStatus =
                    recentlyChangedCerts[cert.certification_id];

                  return (
                    <Card
                      key={cert.id}
                      padding="none"
                      style={{
                        backgroundColor:
                          changeStatus === "added"
                            ? theme === "light"
                              ? colors.green[50]
                              : colors.green[900]
                            : changeStatus === "removed"
                            ? theme === "light"
                              ? colors.error[50]
                              : colors.error[900]
                            : colors.bg[theme].default,
                        borderWidth: 1,
                        borderColor:
                          changeStatus === "added"
                            ? theme === "light"
                              ? colors.green[300]
                              : colors.green[700]
                            : changeStatus === "removed"
                            ? theme === "light"
                              ? colors.error[300]
                              : colors.error[700]
                            : colors.border[theme].default,
                      }}
                    >
                      {/* Header - Always Visible */}
                      <Pressable onPress={() => toggleExpand(cert.id)}>
                        <Row style={{ padding: 12 }} gap={12} align="center">
                          {isExpanded ? (
                            <ChevronDown
                              size={20}
                              color={colors.text[theme].secondary}
                            />
                          ) : (
                            <ChevronRight
                              size={20}
                              color={colors.text[theme].secondary}
                            />
                          )}

                          <Stack style={{ flex: 1 }} gap={4}>
                            <Row gap={8} align="center" wrap>
                              <Text>{cert.catalog.title}</Text>
                              <Text
                                style={{
                                  color:
                                    theme === "light"
                                      ? colors.purple[700]
                                      : colors.purple[300],
                                  backgroundColor:
                                    theme === "light"
                                      ? colors.purple[50]
                                      : colors.purple[900],
                                  paddingHorizontal: 8,
                                  paddingVertical: 2,
                                  borderRadius: 8,
                                }}
                              >
                                Certification
                              </Text>
                            </Row>
                            {hasProof && (
                              <Text
                                style={{
                                  color:
                                    theme === "light"
                                      ? colors.success[600]
                                      : colors.success[400],
                                }}
                              >
                                ✓ Proof added
                              </Text>
                            )}
                            {changeStatus === "added" && (
                              <Text
                                style={{
                                  color:
                                    theme === "light"
                                      ? colors.success[700]
                                      : colors.success[300],
                                }}
                              >
                                ✓ Added to profile
                              </Text>
                            )}
                            {changeStatus === "removed" && (
                              <Text
                                style={{
                                  color:
                                    theme === "light"
                                      ? colors.error[700]
                                      : colors.error[300],
                                }}
                              >
                                Removed from profile
                              </Text>
                            )}
                          </Stack>

                          <Row gap={8}>
                            {hasProof && (
                              <Button
                                size="sm"
                                variant="text"
                                iconStart={ExternalLink}
                                onPress={() => {
                                  const url =
                                    cert.credential_url ||
                                    getStorageUrl(
                                      "certifications",
                                      cert.certificate_file_path
                                    );
                                  if (url) openExternalLink(url);
                                }}
                              >
                                View
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="text"
                              color="error"
                              iconStart={Trash2}
                              onPress={() => {
                                handleRemove(cert);
                              }}
                            >
                              Remove
                            </Button>
                          </Row>
                        </Row>
                      </Pressable>

                      {/* Expanded Content - File Upload & URL */}
                      {isExpanded && (
                        <Stack
                          style={{
                            padding: 12,
                            paddingTop: 0,
                            borderTopWidth: 1,
                            borderColor: colors.border[theme].default,
                          }}
                          gap={16}
                        >
                          {/* File Upload */}
                          <Stack gap={8}>
                            <Text>Upload Certificate</Text>
                            <Row gap={8} style={{ alignItems: "center" }}>
                              <Button
                                style={{ flex: 1 }}
                                iconStart={Upload}
                                onPress={async () => {
                                  const [picked] = await pickFile({
                                    accept: ".pdf,.jpg,.jpeg,.png",
                                  });
                                  handleFileSelect(cert.id, picked?.file ?? null);
                                }}
                                variant={
                                  selectedFiles[cert.id] ? "filled" : "outline"
                                }
                                color={
                                  selectedFiles[cert.id] ? "primary" : "gray"
                                }
                              >
                                {selectedFiles[cert.id]
                                  ? selectedFiles[cert.id]?.name
                                  : "Choose File"}
                              </Button>
                              {selectedFiles[cert.id] && (
                                <Button
                                  iconStart={Upload}
                                  onPress={() => handleSaveFile(cert.id)}
                                  disabled={updateProof.isPending}
                                >
                                  Upload
                                </Button>
                              )}
                            </Row>
                            {cert.certificate_file_path && (
                              <Text
                                style={{ color: colors.text[theme].secondary }}
                              >
                                Current:{" "}
                                {cert.certificate_file_path.split("/").pop()}
                              </Text>
                            )}
                          </Stack>

                          {/* URL Input */}
                          <Stack gap={8}>
                            <Text>Or Add URL</Text>
                            <Row gap={8}>
                              <Input
                                style={{ flex: 1 }}
                                placeholder="https://..."
                                value={urlInputs[cert.id] || ""}
                                onChangeText={(text) =>
                                  setUrlInputs((prev) => ({
                                    ...prev,
                                    [cert.id]: text,
                                  }))
                                }
                              />
                              <Button
                                variant="filled"
                                color="primary"
                                iconStart={ExternalLink}
                                onPress={() => handleSaveUrl(cert.id)}
                                disabled={
                                  !urlInputs[cert.id] || updateProof.isPending
                                }
                              >
                                Save
                              </Button>
                            </Row>
                            {cert.credential_url && (
                              <Text
                                style={{ color: colors.text[theme].secondary }}
                              >
                                Current: {cert.credential_url}
                              </Text>
                            )}
                          </Stack>
                        </Stack>
                      )}
                    </Card>
                  );
                })}
              </Stack>
            )}
          </Stack>
        </ScrollView>
      </Stack>
    </DashboardWidget>
    </Stack>
  );
}
