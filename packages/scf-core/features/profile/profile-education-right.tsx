import {
  useEducation,
  useDeleteEducationMutation,
} from "@scf/core/utils/profile-education-sdk-hooks";
import { useQueryClient } from "@tanstack/react-query";
import {
  DashboardWidget,
  Modal,
  ModalHeader,
  ModalActions,
  useThemeContext,
} from "@scaffald/ui";
import { colors } from "@scaffald/ui/tokens";
import { workerPalette } from "@scf/core/components/ui/styles";
import {
  AlertCircle,
  Calendar,
  GraduationCap,
  MapPin,
  Pencil,
  Trash2,
} from "lucide-react-native";
import { useToast } from "@scaffald/ui";
import { useState } from "react";
import { Button, H4, Spinner, Text, Row, Stack } from "@scaffald/ui";
import { ProfileEmptyState, ProfileSectionIntro } from "./components";
import type { EducationEntry } from "./types/education";
import { formatDateRange } from "./utils/date-formatting";

interface ProfileEducationRightProps {
  onEditEntry?: (entryId: string) => void;
}

/**
 * Profile Education Right Component
 * Displays saved education entries in the right column
 */
export function ProfileEducationRight({
  onEditEntry,
}: ProfileEducationRightProps = {}) {
  const { theme } = useThemeContext();
  const t = theme === "dark" ? "dark" : "light" as const;
  const pal = workerPalette[t];
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<string | null>(null);
  const toast = useToast();
  const queryClient = useQueryClient();

  // Query saved education data
  const educationQuery = useEducation();
  const educationEntries = (educationQuery.data ?? []) as EducationEntry[];

  // Delete mutation
  const deleteEducationMutation = useDeleteEducationMutation({
    onError: (error: unknown) => {
      toast.show({
        title: "Delete Failed",
        message:
          error instanceof Error
            ? error.message
            : "Failed to delete education entry. Please try again.",
        variant: "error",
      });
    },
    onSuccess: () => {
      toast.show({
        title: "Education Deleted",
        message: "The education entry has been removed.",
      });
      queryClient.invalidateQueries({ queryKey: ["profiles", "education"] });
      setDeleteDialogOpen(null);
    },
  });

  const handleDelete = (educationId: string | null | undefined) => {
    if (!educationId) {
      toast.show({
        title: "Delete Failed",
        message: "Missing education identifier. Please try again.",
        variant: "error",
      });
      return;
    }
    deleteEducationMutation.mutate({ educationId });
  };

  // Show loading state
  if (educationQuery.isPending) {
    return (
      <Stack gap={16}>
        <ProfileSectionIntro
          title="Education"
          description="Manage your education history. Add or edit entries in the left panel; they appear here once saved."
        />
        <DashboardWidget>
        <Stack align="center" justify="center" style={{ padding: 32 }} gap={16}>
          <Spinner variant="ios" size="lg" />
          <Text style={{ color: colors.text[theme].secondary }}>
            Loading education data...
          </Text>
        </Stack>
      </DashboardWidget>
      </Stack>
    );
  }

  // Show error state
  if (educationQuery.isError) {
    return (
      <Stack gap={16}>
        <ProfileSectionIntro
          title="Education"
          description="Manage your education history. Add or edit entries in the left panel; they appear here once saved."
        />
        <DashboardWidget>
        <Stack align="center" justify="center" style={{ padding: 32 }} gap={16}>
          <Text style={{ color: colors.error[500] }}>
            Failed to load education data
          </Text>
        </Stack>
      </DashboardWidget>
      </Stack>
    );
  }

  return (
    <Stack gap={16}>
      <ProfileSectionIntro
        title="Education"
        description="Manage your education history. Add or edit entries in the left panel; they appear here once saved."
      />
    <DashboardWidget>
      <H4>Saved Education</H4>

      <Text style={{ color: colors.text[theme].secondary, marginBottom: 16 }}>
        Your education history is displayed here. Edit entries in the left
        panel.
      </Text>

      {educationEntries.length === 0 ? (
        <ProfileEmptyState
          icon={GraduationCap}
          message="No education history saved yet. Add your first education entry in the left panel."
        />
      ) : (
        <Stack gap={12}>
          {educationEntries.map((edu) => {
            const normalizedGpa =
              typeof edu.gpa === "number"
                ? edu.gpa
                : edu.gpa != null
                ? Number(edu.gpa)
                : undefined;
            const hasValidGpa =
              typeof normalizedGpa === "number" && !Number.isNaN(normalizedGpa);

            return (
              <Stack
                key={edu.id}
                style={{
                  padding: 16,
                  gap: 12,
                  backgroundColor: colors.bg[theme].default,
                  borderWidth: 1,
                  borderColor: colors.border[theme].default,
                  borderRadius: 16,
                }}
              >
                {/* Institution Name with Verification Badge */}
                <Stack gap={4}>
                  <Row gap={8} align="center" wrap>
                    <Text style={{ color: colors.text[theme].secondary }}>
                      {edu.institution_name}
                    </Text>
                    {!edu.is_verified && (
                      <Row gap={4} align="center">
                        <AlertCircle size={16} color={colors.warning[500]} />
                        <Text style={{ color: colors.warning[600] }}>
                          Pending verification
                        </Text>
                      </Row>
                    )}
                  </Row>

                  {/* Current Education Badge */}
                  {edu.is_current && (
                    <Row gap={4} align="center">
                      <Text style={{ color: pal.accent }}>Current</Text>
                    </Row>
                  )}

                  {/* Degree Type */}
                  {edu.degree_type && (
                    <Text style={{ color: colors.text[theme].secondary }}>
                      {edu.degree_type}
                    </Text>
                  )}

                  {/* Field of Study */}
                  {edu.field_of_study && (
                    <Text style={{ color: colors.text[theme].secondary }}>
                      {edu.field_of_study}
                    </Text>
                  )}

                  {/* GPA */}
                  {hasValidGpa && (
                    <Text style={{ color: colors.text[theme].secondary }}>
                      GPA: {normalizedGpa.toFixed(1)}/4.0
                    </Text>
                  )}
                </Stack>

                {/* Delete Confirmation Modal */}
                <Modal
                  visible={deleteDialogOpen === edu.id}
                  onClose={() => setDeleteDialogOpen(null)}
                >
                  <ModalHeader
                    title="Delete Education Entry"
                    description="Are you sure you want to delete this education entry? This action cannot be undone."
                    onClose={() => setDeleteDialogOpen(null)}
                  />
                  <ModalActions
                    orientation="right"
                    primaryAction={{
                      label: deleteEducationMutation.isPending
                        ? "Deleting..."
                        : "Delete",
                      color: "error",
                      disabled: deleteEducationMutation.isPending,
                      onPress: () => handleDelete(edu.id),
                    }}
                    secondaryAction={{
                      label: "Cancel",
                      onPress: () => setDeleteDialogOpen(null),
                    }}
                  />
                </Modal>

                {/* Details */}
                <Stack gap={8}>
                  <Row align="center" wrap gap={12}>
                    {(edu.start_date || edu.end_date || edu.is_current) && (
                      <Row gap={8} align="center">
                        <Calendar
                          size={16}
                          color={colors.text[theme].secondary}
                        />
                        <Text style={{ color: colors.text[theme].secondary }}>
                          {formatDateRange(
                            edu.start_date,
                            edu.end_date,
                            Boolean(edu.is_current),
                            edu.expected_graduation_date
                          )}
                        </Text>
                      </Row>
                    )}

                    <Row gap={8} style={{ marginLeft: "auto" }}>
                      <Button
                        size="sm"
                        variant="outline"
                        iconStart={Pencil}
                        aria-label="Edit education entry"
                        accessibilityLabel="Edit education entry"
                        onPress={() => {
                          if (edu.id && onEditEntry) {
                            onEditEntry(edu.id);
                          } else {
                            toast.show({
                              title: "Error",
                              message:
                                "Unable to edit this entry. Please try again.",
                              variant: "error",
                            });
                          }
                        }}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        iconStart={Trash2}
                        aria-label="Delete education entry"
                        accessibilityLabel="Delete education entry"
                        onPress={() => setDeleteDialogOpen(edu.id ?? null)}
                      />
                    </Row>
                  </Row>

                  {/* Location */}
                  {edu.location && (
                    <Row gap={8} align="center">
                      <MapPin size={16} color={colors.text[theme].secondary} />
                      <Text style={{ color: colors.text[theme].secondary }}>
                        {edu.location}
                      </Text>
                    </Row>
                  )}

                  {/* Description */}
                  {edu.description && (
                    <Stack gap={4}>
                      <Text style={{ color: colors.text[theme].secondary }}>
                        Description:
                      </Text>
                      <Text style={{ color: colors.text[theme].secondary }}>
                        {edu.description}
                      </Text>
                    </Stack>
                  )}
                </Stack>
              </Stack>
            );
          })}
        </Stack>
      )}
    </DashboardWidget>
    </Stack>
  );
}
