import { ControlledAddressForm } from "@scf/core/forms";
import {
  useExperience,
  useExperienceSummary,
  useSaveExperienceMutationWithSync,
} from "@scf/core/utils/profile-experience-sdk-hooks";
import {
  Button,
  Checkbox,
  DashboardWidget,
  Modal,
  ModalActions,
  ModalContent,
  ModalHeader,
  ResponsiveSelect,
} from "@scaffald/ui";
import { MonthYearPicker } from "./components/MonthYearPicker";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertTriangle,
  Check,
  CheckCircle,
  Plus,
  X,
} from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { H4, Input, Spinner, Text, TextArea, Row, Stack } from "@scaffald/ui";
import { Pressable } from "react-native";
import { useUnsavedChangesPrompt } from "@scf/core/utils/platform";
import {
  CAREER_LEVEL_OPTIONS,
  createNewExperienceEntry,
  EMPLOYMENT_TYPE_OPTIONS,
  type ExperienceProfileFormData,
  experienceProfileDefaults,
  experienceProfileSchema,
} from "./config";

/**
 * Experience entry from API response
 * Based on experienceEntrySchema from the router
 */
type ExperienceEntry = {
  id?: string;
  user_id?: string;
  organization_id?: string | null;
  job_title: string;
  company_name: string;
  employment_type?: string | null;
  location?: string | object | null;
  is_remote: boolean;
  start_date?: string | null;
  end_date?: string | null;
  is_current: boolean;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
};
import { useExperienceEdit } from "./contexts/experience-edit-context";
import { useAdaptiveProfileSync } from "./utils/profile-sync-store";

type ExperienceEntries = NonNullable<
  ExperienceProfileFormData["experience_entries"]
>;


/**
 * Profile Experience Left Component
 * Form for managing work experience history
 */
export function ProfileExperienceLeft() {
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const originalDataRef = useRef<ExperienceProfileFormData | null>(null);
  const syncStatus = useAdaptiveProfileSync(300);
  const isSyncing = syncStatus === "syncing";
  const { editingEntryId, cancelEditing } = useExperienceEdit();

  // Queries
  const experienceQuery = useExperience();
  const experienceSummaryQuery = useExperienceSummary();

  // Mutations
  const saveExperienceMutation = useSaveExperienceMutationWithSync();
  const [saveState, setSaveState] = useState<"idle" | "saving" | "success">(
    "idle"
  );
  const [saveBanner, setSaveBanner] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const bannerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const buttonTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    trigger,
    formState: { errors, isDirty },
  } = useForm<ExperienceProfileFormData>({
    resolver: zodResolver(experienceProfileSchema),
    defaultValues: experienceProfileDefaults,
    mode: "onChange",
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "experience_entries",
  });

  // Load data when queries succeed
  useEffect(() => {
    if (experienceQuery.data && experienceSummaryQuery.data) {
      const formData = {
        career_level: experienceSummaryQuery.data.career_level || undefined,
        experience_entries: (experienceQuery.data as ExperienceEntry[]).map(
          (exp) => {
            // Handle location: prefer location_structured, fallback to location TEXT
            // If location is string, keep as string for backward compatibility
            // ControlledAddressForm will handle conversion to structured format on edit
            const location =
              (exp as ExperienceEntry & { location_structured?: unknown })
                .location_structured ||
              exp.location ||
              undefined;

            // If location is a string and we need structured format, we'll let ControlledAddressForm handle it
            // For now, keep the raw location value (API already transforms it)
            return {
              id: exp.id,
              organization_id: exp.organization_id || undefined,
              job_title: exp.job_title,
              company_name: exp.company_name,
              employment_type: exp.employment_type || undefined,
              location,
              is_remote: exp.is_remote,
              start_date: exp.start_date || undefined,
              end_date: exp.end_date || undefined,
              is_current: exp.is_current,
              description: exp.description || undefined,
            };
          }
        ),
      };
      reset(formData as ExperienceProfileFormData);
      originalDataRef.current = formData as ExperienceProfileFormData;
    }
  }, [experienceQuery.data, experienceSummaryQuery.data, reset]);

  useUnsavedChangesPrompt(isDirty);

  // Handle edit mode - entries are already loaded in form from API
  // When editingEntryId is set, the entry should already exist in form fields
  // The form will display it automatically since all entries are loaded

  const clearTimers = useCallback(() => {
    if (bannerTimeoutRef.current) {
      clearTimeout(bannerTimeoutRef.current);
      bannerTimeoutRef.current = null;
    }
    if (buttonTimeoutRef.current) {
      clearTimeout(buttonTimeoutRef.current);
      buttonTimeoutRef.current = null;
    }
  }, []);

  const showSuccessFeedback = useCallback(() => {
    setSaveState("success");
    setSaveBanner({ type: "success", message: "Changes saved successfully" });

    if (bannerTimeoutRef.current) {
      clearTimeout(bannerTimeoutRef.current);
    }
    bannerTimeoutRef.current = setTimeout(() => {
      setSaveBanner(null);
      bannerTimeoutRef.current = null;
    }, 3000);

    if (buttonTimeoutRef.current) {
      clearTimeout(buttonTimeoutRef.current);
    }
    buttonTimeoutRef.current = setTimeout(() => {
      setSaveState("idle");
      buttonTimeoutRef.current = null;
    }, 2000);
  }, []);

  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  const onSubmit = async (data: ExperienceProfileFormData) => {
    clearTimers();
    setSaveBanner(null);
    setSaveState("saving");
    try {
      const experienceEntries = (data.experience_entries ??
        []) as ExperienceEntries;

      await saveExperienceMutation.mutateAsync({
        career_level: data.career_level ?? null,
        experience_entries: experienceEntries,
      });
      showSuccessFeedback();
      // Clear edit mode after successful save
      if (editingEntryId) {
        cancelEditing();
      }
    } catch (error) {
      console.error("Error saving experience:", error);
      setSaveState("idle");
      setSaveBanner({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to save changes. Please try again.",
      });
    }
  };

  const addExperienceEntry = () => {
    append(createNewExperienceEntry());
  };

  // Calculate total years of experience
  const totalExperience = useMemo(() => {
    const entries = watch("experience_entries") || [];
    let totalMonths = 0;

    for (const entry of entries) {
      if (!entry.start_date || typeof entry.start_date !== "string") continue;

      const start = new Date(entry.start_date);
      const end =
        entry.is_current ||
        !entry.end_date ||
        typeof entry.end_date !== "string"
          ? new Date()
          : new Date(entry.end_date);

      const months =
        (end.getFullYear() - start.getFullYear()) * 12 +
        (end.getMonth() - start.getMonth());
      totalMonths += Math.max(0, months);
    }

    const years = Math.floor(totalMonths / 12);
    const remainingMonths = totalMonths % 12;

    return { years, months: remainingMonths };
  }, [watch]);

  // Show loading state
  if (experienceQuery.isLoading || experienceSummaryQuery.isLoading) {
    return (
      <DashboardWidget>
        <Stack
          style={{
            alignItems: "center",
            justifyContent: "center",
            padding: 32,
            gap: 16,
          }}
        >
          <Spinner variant="ios" size="lg" />
          <Text style={{ color: "#414e62" }}>Loading experience data...</Text>
        </Stack>
      </DashboardWidget>
    );
  }

  // Show error state
  if (experienceQuery.isError || experienceSummaryQuery.isError) {
    return (
      <DashboardWidget>
        <Stack
          style={{
            alignItems: "center",
            justifyContent: "center",
            padding: 32,
            gap: 16,
          }}
        >
          <Text style={{ color: "#ef4444" }}>
            Failed to load experience data
          </Text>
          <Button onPress={() => experienceQuery.refetch()}>Retry</Button>
        </Stack>
      </DashboardWidget>
    );
  }

  return (
    <DashboardWidget>
      <H4>Work Experience</H4>

      <Stack style={{ gap: 16 }}>
        {/* Experience Summary */}
        <Row gap={12}>
          <Stack style={{ gap: 8, flex: 1 }}>
            <Text>Total Years Experience</Text>
            <Text style={{ color: "#3b82f6" }}>
              {totalExperience.years} years {totalExperience.months} months
            </Text>
          </Stack>

          <Stack style={{ gap: 8, flex: 1 }}>
            <Text>Career Level</Text>
            <Controller
              name="career_level"
              control={control}
              render={({ field }) => (
                <ResponsiveSelect
                  value={field.value || ""}
                  onValueChange={field.onChange}
                  placeholder="Select career level"
                  options={CAREER_LEVEL_OPTIONS.map((level) => ({
                    value: level,
                    label: level,
                  }))}
                />
              )}
            />
          </Stack>
        </Row>

        {/* Experience Entries */}
        <Stack style={{ gap: 12 }}>
          <Row justify="space-between" align="center">
            <Text>Work History</Text>
            <Button size="sm" onPress={addExperienceEntry} iconStart={Plus}>
              Add Experience
            </Button>
          </Row>

          {fields.map((field, index) => (
            <Stack
              key={field.id}
              style={{
                gap: 12,
                padding: 8,
                borderWidth: 1,
                borderColor: "#e2e8f0",
                borderRadius: 16,
              }}
            >
              <Row justify="space-between" align="center">
                <Text>Position {index + 1}</Text>
                <Button
                  size="sm"
                  variant="outline"
                  onPress={() => remove(index)}
                  iconStart={X}
                >
                  Remove
                </Button>
              </Row>

              {/* Job Title and Company */}
              <Row gap={12}>
                <Stack style={{ gap: 8, flex: 1 }}>
                  <Text>Job Title *</Text>
                  <Controller
                    name={`experience_entries.${index}.job_title`}
                    control={control}
                    render={({ field }) => (
                      <Input
                        placeholder="e.g. Electrician"
                        value={field.value}
                        onChangeText={field.onChange}
                        style={{
                          borderColor: errors.experience_entries?.[index]
                            ?.job_title
                            ? "#ef4444"
                            : "#e2e8f0",
                        }}
                      />
                    )}
                  />
                  {errors.experience_entries?.[index]?.job_title && (
                    <Text style={{ color: "#ef4444" }}>
                      {errors.experience_entries[index]?.job_title?.message}
                    </Text>
                  )}
                </Stack>

                <Stack style={{ gap: 8, flex: 1 }}>
                  <Text>Company Name *</Text>
                  <Controller
                    name={`experience_entries.${index}.company_name`}
                    control={control}
                    render={({ field }) => (
                      <Input
                        placeholder="e.g. ABC Construction"
                        value={field.value}
                        onChangeText={field.onChange}
                        style={{
                          borderColor: errors.experience_entries?.[index]
                            ?.company_name
                            ? "#ef4444"
                            : "#e2e8f0",
                        }}
                      />
                    )}
                  />
                  {errors.experience_entries?.[index]?.company_name && (
                    <Text style={{ color: "#ef4444" }}>
                      {errors.experience_entries[index]?.company_name?.message}
                    </Text>
                  )}
                </Stack>
              </Row>

              {/* Employment Type and Location */}
              <Row gap={12}>
                <Stack style={{ gap: 8, flex: 1 }}>
                  <Text>Employment Type</Text>
                  <Controller
                    name={`experience_entries.${index}.employment_type`}
                    control={control}
                    render={({ field }) => (
                      <ResponsiveSelect
                        value={field.value || ""}
                        onValueChange={field.onChange}
                        placeholder="Select type"
                        options={EMPLOYMENT_TYPE_OPTIONS.map((type) => ({
                          value: type,
                          label: type,
                        }))}
                      />
                    )}
                  />
                </Stack>

                <Stack style={{ gap: 8, flex: 1 }}>
                  <ControlledAddressForm
                    control={control}
                    name={`experience_entries.${index}.location`}
                    setValue={setValue}
                    trigger={trigger}
                    label="Location"
                    placeholder="Search for company location..."
                    required={false}
                    fieldMapping="nested"
                    storeCoordinates={false}
                    mode="hybrid"
                    provider="mapbox"
                    zoomLevel="city"
                    error={
                      errors.experience_entries?.[index]?.location?.message
                    }
                  />
                  {watch(`experience_entries.${index}.is_remote`) && (
                    <Text style={{ color: "#414e62" }}>
                      Enter company headquarters location
                    </Text>
                  )}
                  {errors.experience_entries?.[index]?.location && (
                    <Text style={{ color: "#ef4444" }}>
                      {errors.experience_entries[index]?.location?.message}
                    </Text>
                  )}
                </Stack>
              </Row>

              {/* Remote Work Checkbox */}
              <Controller
                name={`experience_entries.${index}.is_remote`}
                control={control}
                render={({ field }) => {
                  const isRemote = Boolean(field.value);
                  return (
                    <Row gap={8} align="center">
                      <Checkbox checked={isRemote} onChange={field.onChange} />
                      <Pressable onPress={() => field.onChange(!isRemote)}>
                        <Text>Remote Work</Text>
                      </Pressable>
                    </Row>
                  );
                }}
              />

              {/* Start and End Dates */}
              <Row gap={12}>
                <Stack style={{ gap: 8, flex: 1 }}>
                  <Controller
                    name={`experience_entries.${index}.start_date`}
                    control={control}
                    render={({ field }) => (
                      <MonthYearPicker
                        value={field.value ? new Date(field.value) : null}
                        onChange={(date) => {
                          // Store as YYYY-MM-DD format (first day of month)
                          const dateStr = date
                            ? date.toISOString().split("T")[0]
                            : null;
                          field.onChange(dateStr || undefined);
                        }}
                        error={
                          errors.experience_entries?.[index]?.start_date
                            ?.message
                        }
                        label="Start Date"
                      />
                    )}
                  />
                </Stack>

                <Stack style={{ gap: 8, flex: 1 }}>
                  <Controller
                    name={`experience_entries.${index}.end_date`}
                    control={control}
                    render={({ field }) => (
                      <MonthYearPicker
                        value={field.value ? new Date(field.value) : null}
                        onChange={(date) => {
                          // Store as YYYY-MM-DD format (first day of month)
                          const dateStr = date
                            ? date.toISOString().split("T")[0]
                            : null;
                          field.onChange(dateStr || undefined);
                        }}
                        disabled={watch(
                          `experience_entries.${index}.is_current`
                        )}
                        error={
                          errors.experience_entries?.[index]?.end_date?.message
                        }
                        label="End Date"
                      />
                    )}
                  />
                </Stack>
              </Row>

              {/* Currently Working Checkbox */}
              <Controller
                name={`experience_entries.${index}.is_current`}
                control={control}
                render={({ field }) => {
                  const isCurrent = Boolean(field.value);
                  return (
                    <Row gap={8} align="center">
                      <Checkbox checked={isCurrent} onChange={field.onChange} />
                      <Pressable onPress={() => field.onChange(!isCurrent)}>
                        <Text>I currently work here</Text>
                      </Pressable>
                    </Row>
                  );
                }}
              />

              {/* Description */}
              <Stack style={{ gap: 8 }}>
                <Text>Job Description</Text>
                <Controller
                  name={`experience_entries.${index}.description`}
                  control={control}
                  render={({ field }) => (
                    <TextArea
                      placeholder="Describe your responsibilities and duties..."
                      value={field.value || ""}
                      onChangeText={field.onChange}
                      style={{ minHeight: 80 }}
                    />
                  )}
                />
              </Stack>
            </Stack>
          ))}

          {fields.length === 0 && (
            <Stack style={{ padding: 16, alignItems: "center", gap: 8 }}>
              <Text style={{ color: "#414e62" }}>
                No work experience added yet
              </Text>
            </Stack>
          )}
        </Stack>

        {/* Save Feedback */}
        {saveBanner && (
          <Stack
            style={{
              marginTop: 16,
              padding: 8,
              gap: 8,
              borderWidth: 1,
              borderColor:
                saveBanner.type === "success" ? "#86efac" : "#fca5a5",
              backgroundColor:
                saveBanner.type === "success" ? "#f0fdf4" : "#fef2f2",
              borderRadius: 16,
            }}
          >
            <Row gap={8} align="center">
              {saveBanner.type === "success" ? (
                <CheckCircle size={18} color="#22c55e" />
              ) : (
                <AlertTriangle size={18} color="#ef4444" />
              )}
              <Text
                style={{
                  color: saveBanner.type === "success" ? "#16a34a" : "#ef4444",
                }}
              >
                {saveBanner.message}
              </Text>
            </Row>
          </Stack>
        )}

        {/* Action Buttons */}
        <Row justify="flex-end" gap={12} style={{ paddingTop: 16 }}>
          {(editingEntryId || isDirty) && (
            <Button
              variant="outline"
              disabled={!isDirty && !editingEntryId}
              onPress={() => {
                if (editingEntryId) {
                  cancelEditing();
                  if (originalDataRef.current) {
                    reset(originalDataRef.current);
                  }
                } else {
                  setShowCancelDialog(true);
                }
              }}
              style={{ opacity: !isDirty && !editingEntryId ? 0.5 : 1 }}
            >
              Cancel
            </Button>
          )}
          <Button
            variant="filled"
            color="primary"
            onPress={handleSubmit(onSubmit)}
            disabled={!isDirty || saveState === "saving"}
            style={{ opacity: !isDirty || saveState === "saving" ? 0.5 : 1 }}
          >
            {saveState === "success" ? (
              <Row gap={8} align="center">
                <Check size={18} color="#22c55e" />
                <Text style={{ color: "#22c55e" }}>Saved!</Text>
              </Row>
            ) : isSyncing ? (
              <Row gap={8} align="center">
                <Spinner variant="ios" size="sm" />
                <Text>Saving...</Text>
              </Row>
            ) : editingEntryId ? (
              "Update Experience"
            ) : (
              "Save Changes"
            )}
          </Button>
        </Row>

        {/* Cancel Confirmation Dialog */}
        <Modal
          visible={showCancelDialog}
          onClose={() => setShowCancelDialog(false)}
        >
          <ModalHeader
            title="Discard Changes?"
            onClose={() => setShowCancelDialog(false)}
          />
          <ModalContent>
            <Text>
              You have unsaved changes. Are you sure you want to discard them?
            </Text>
          </ModalContent>
          <ModalActions
            primaryAction={{
              label: "Discard Changes",
              onPress: () => {
                if (originalDataRef.current) {
                  reset(originalDataRef.current);
                  setShowCancelDialog(false);
                  if (editingEntryId) {
                    cancelEditing();
                  }
                }
              },
            }}
            secondaryAction={{
              label: "Keep Editing",
              onPress: () => setShowCancelDialog(false),
            }}
          />
        </Modal>
      </Stack>
    </DashboardWidget>
  );
}
