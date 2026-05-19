import {
  useEducation,
  useEducationLevel,
  useSaveEducationMutationWithSync,
} from "@scf/core/utils/profile-education-sdk-hooks";
import { useSearchUniversities } from "@scf/core/utils/office-universities-sdk-hooks";
import {
  Button,
  Checkbox,
  DashboardWidget,
  FieldError,
  Modal,
  ModalActions,
  ModalHeader,
  Popover,
  PopoverContent,
} from "@scaffald/ui";
import { MonthYearPicker } from "./components/MonthYearPicker";
import { colors } from "@scaffald/ui/tokens";
import { workerPalette } from "@scf/core/components/ui/styles";
import { UniversityAutocomplete } from "@scf/core/components/university";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDown, Plus, X } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Platform, View } from "react-native";
import { useUnsavedChangesPrompt } from "@scf/core/utils/platform";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import {
  H4,
  Input,
  Label,
  ScrollView,
  Separator,
  Spinner,
  Text,
  TextArea,
  Row,
  Stack,
} from "@scaffald/ui";
import { useThemeContext } from "@scaffald/ui";
import {
  createNewEducationEntry,
  DEGREE_TYPE_OPTIONS,
  EDUCATION_LEVEL_OPTIONS,
  type EducationProfileFormData,
  educationProfileDefaults,
  educationProfileSchema,
} from "./config";
import type { EducationEntry } from "./types/education";
import { normalizeEducationEntry } from "./utils/education-entry";
import { useAdaptiveProfileSync } from "./utils/profile-sync-store";

// University type definition
interface University {
  id: string;
  name: string;
  country: string;
  alpha_two_code: string;
  slug: string;
}

const ERROR_FIELD_LABELS: Record<string, string> = {
  education_level: "Highest Education Level",
  institution_name: "Institution Name",
  university_id: "Institution Selection",
  is_verified: "Verification Status",
  degree_type: "Degree Type",
  custom_degree_type: "Custom Degree Type",
  field_of_study: "Field of Study",
  start_date: "Start Date",
  end_date: "End Date",
  expected_graduation_date: "Expected Graduation Date",
  is_current: "Current Enrollment Status",
  gpa: "GPA",
  description: "Description",
  location: "Location",
};

interface ProfileEducationLeftProps {
  editingEntryId?: string | null;
  onEditComplete?: () => void;
}

/**
 * Profile Education Left Component
 * Form for managing education background
 */
export function ProfileEducationLeft({
  editingEntryId,
  onEditComplete,
}: ProfileEducationLeftProps = {}) {
  const { theme } = useThemeContext();
  const t = theme === "dark" ? "dark" : "light" as const;
  const pal = workerPalette[t];
  const [isLoading, setIsLoading] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [hiddenEntryIds, setHiddenEntryIds] = useState<Set<string>>(new Set());
  const originalDataRef = useRef<EducationProfileFormData | null>(null);
  const entryRefs = useRef<Record<string, HTMLElement | null>>({});
  const syncStatus = useAdaptiveProfileSync(300);
  const isSyncing = syncStatus === "syncing";

  // Queries
  const educationQuery = useEducation();
  const educationLevelQuery = useEducationLevel();
  const educationEntries = (educationQuery.data ?? []) as EducationEntry[];

  // Mutations
  const saveEducationMutation = useSaveEducationMutationWithSync();

  // University search state
  const [searchQuery, setSearchQuery] = useState("");

  // Track manual entry mode for each education entry (by index)
  const [manualEntryMode, setManualEntryMode] = useState<
    Record<number, boolean>
  >({});

  // University search query (SDK). Only runs when query is valid.
  const searchUniversitiesQuery = useSearchUniversities(
    {
      query: searchQuery,
      country: "United States",
      limit: 5,
    },
    { enabled: searchQuery.length >= 3 }
  );

  // Handle search input changes
  const handleUniversitySearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<EducationProfileFormData>({
    resolver: zodResolver(educationProfileSchema),
    defaultValues: educationProfileDefaults,
    mode: "onChange",
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "education_entries",
  });

  const errorSummary = useMemo(() => {
    const messages: string[] = [];

    const ensurePush = (message: string | undefined) => {
      if (message && !messages.includes(message)) {
        messages.push(message);
      }
    };

    const formatLabel = (key: string) => {
      if (ERROR_FIELD_LABELS[key]) {
        return ERROR_FIELD_LABELS[key];
      }
      return key
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
    };

    const traverse = (errorNode: unknown, prefix?: string) => {
      if (!errorNode) {
        return;
      }

      if (Array.isArray(errorNode)) {
        for (const [idx, item] of errorNode.entries()) {
          const nextPrefix = prefix
            ? `${prefix} • Item ${idx + 1}`
            : `Item ${idx + 1}`;
          traverse(item, nextPrefix);
        }
        return;
      }

      if (typeof errorNode === "object") {
        const maybeMessage = (errorNode as { message?: unknown }).message;
        if (typeof maybeMessage === "string" && maybeMessage.length > 0) {
          ensurePush(prefix ? `${prefix}: ${maybeMessage}` : maybeMessage);
          return;
        }

        for (const [key, value] of Object.entries(
          errorNode as Record<string, unknown>
        )) {
          const label = formatLabel(key);
          const nextPrefix =
            key === "_root" ? prefix : prefix ? `${prefix} • ${label}` : label;
          traverse(value, nextPrefix);
        }
      }
    };

    ensurePush(
      errors.education_level?.message
        ? `Highest Education Level: ${errors.education_level.message}`
        : undefined
    );

    const educationEntryErrors = Array.isArray(errors.education_entries)
      ? errors.education_entries
      : [];
    for (let idx = 0; idx < educationEntryErrors.length; idx += 1) {
      const entryErrors = educationEntryErrors[idx];
      if (!entryErrors) {
        continue;
      }
      const entryPrefix = `Education ${idx + 1}`;
      traverse(entryErrors, entryPrefix);
    }

    return messages.length > 1 ? messages : [];
  }, [errors]);

  const educationEntryFieldErrors = Array.isArray(errors.education_entries)
    ? errors.education_entries
    : [];

  // Load data when queries succeed
  useEffect(() => {
    if (educationQuery.data && educationLevelQuery.data) {
      const entries = educationEntries.map((edu, index) => {
        // Set manual entry mode if no university_id
        if (!edu.university_id) {
          setManualEntryMode((prev) => ({ ...prev, [index]: true }));
        }

        return normalizeEducationEntry(edu);
      });

      const formData = {
        education_level: educationLevelQuery.data.education_level || undefined,
        education_entries: entries,
      };
      // Form data from API is compatible with form schema
      reset(formData as EducationProfileFormData);
      originalDataRef.current = formData as EducationProfileFormData;

      // Clear hidden entries - we'll set them after fields update
      setHiddenEntryIds(new Set());
    }
  }, [educationQuery.data, educationLevelQuery.data, reset, educationEntries]);

  // Hide all existing entries after form data loads
  useEffect(() => {
    if (fields.length > 0 && educationQuery.data) {
      const existingEntryFieldIds: string[] = [];
      fields.forEach((field, index) => {
        const entryData = watch(`education_entries.${index}`);
        // Hide if it has an ID (existing entry) and is not being edited
        if (entryData?.id && entryData.id !== editingEntryId) {
          existingEntryFieldIds.push(field.id);
        }
      });

      if (existingEntryFieldIds.length > 0) {
        setHiddenEntryIds((prev) => {
          const next = new Set(prev);
          for (const id of existingEntryFieldIds) {
            next.add(id);
          }
          return next;
        });
      }
    }
  }, [fields, educationQuery.data, editingEntryId, watch]);

  // Scroll to editing entry when editingEntryId changes
  useEffect(() => {
    if (editingEntryId) {
      // Find the entry in the form fields by matching the ID
      const entryIndex = fields.findIndex((_field, idx) => {
        const entryData = watch(`education_entries.${idx}`);
        return entryData?.id === editingEntryId;
      });

      if (entryIndex !== -1) {
        const entryId = fields[entryIndex].id;
        const entryData = watch(`education_entries.${entryIndex}`);

        // Make sure the entry is visible (remove from hidden set)
        setHiddenEntryIds((prev) => {
          const next = new Set(prev);
          next.delete(entryId);
          return next;
        });

        // Set manual entry mode based on whether it has a university_id
        if (entryData) {
          const shouldUseManualMode = !entryData.university_id;
          setManualEntryMode((prev) => ({
            ...prev,
            [entryIndex]: shouldUseManualMode,
          }));

          // If there's an institution name with a university_id (verified institution),
          // trigger a search to populate results so the value displays in autocomplete
          if (
            entryData.institution_name &&
            entryData.university_id &&
            !shouldUseManualMode
          ) {
            // Trigger search with the institution name to populate results
            // This ensures the UniversityAutocomplete can find and display the value
            setSearchQuery(entryData.institution_name);
            handleUniversitySearch(entryData.institution_name);
          }
        }

        // Scroll to the entry after a short delay to ensure it's rendered
        setTimeout(() => {
          const element = entryRefs.current[entryId];
          if (element && Platform.OS === "web" && typeof window !== "undefined") {
            // Scroll to the entry (web only)
            element.scrollIntoView({ behavior: "smooth", block: "center" });
            // Focus the first input in the entry after another short delay
            setTimeout(() => {
              const firstInput = element.querySelector(
                "input, textarea, button"
              );
              if (firstInput instanceof HTMLElement) {
                firstInput.focus();
              }
            }, 100);
          }
        }, 100);
      }
    }
  }, [editingEntryId, fields, watch, handleUniversitySearch]);

  useUnsavedChangesPrompt(isDirty);

  const onSubmit = async (data: EducationProfileFormData) => {
    setIsLoading(true);

    // Track which entries are new (without IDs) before save
    const newEntryFieldIds: string[] = [];
    data.education_entries?.forEach((entry, index) => {
      if (!entry.id && fields[index]) {
        newEntryFieldIds.push(fields[index].id);
      }
    });

    try {
      await saveEducationMutation.mutateAsync({
        education_level: data.education_level || null,
        education_entries: data.education_entries || [],
      });

      // After successful save, hide ALL entries (both new and edited)
      // They'll be visible in the right column instead
      const allEntryFieldIds = fields.map((field) => field.id);
      if (allEntryFieldIds.length > 0) {
        setHiddenEntryIds((prev) => {
          const next = new Set(prev);
          for (const id of allEntryFieldIds) {
            next.add(id);
          }
          return next;
        });
      }

      // Clear editing state
      if (editingEntryId) {
        onEditComplete?.();
      }
    } catch (error) {
      console.error("Error saving education:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const addEducationEntry = () => {
    append(createNewEducationEntry());
  };

  // Show loading state
  if (educationQuery.isLoading || educationLevelQuery.isLoading) {
    return (
      <DashboardWidget>
        <Stack align="center" justify="center" style={{ padding: 32 }} gap={16}>
          <Spinner variant="ios" size="lg" />
          <Text style={{ color: colors.text[theme].secondary }}>
            Loading education data...
          </Text>
        </Stack>
      </DashboardWidget>
    );
  }

  // Show error state
  if (educationQuery.isError || educationLevelQuery.isError) {
    return (
      <DashboardWidget>
        <Stack align="center" justify="center" style={{ padding: 32 }} gap={16}>
          <Text style={{ color: colors.error[500] }}>
            Failed to load education data
          </Text>
          <Button onPress={() => educationQuery.refetch()}>Retry</Button>
        </Stack>
      </DashboardWidget>
    );
  }

  return (
    <DashboardWidget>
      <H4>Education Background</H4>

      {errorSummary.length > 0 && (
        <Stack
          style={{
            marginTop: 8,
            marginBottom: 8,
            padding: 12,
            gap: 8,
            borderWidth: 1,
            borderColor: colors.error[300],
            backgroundColor: colors.error[50],
            borderRadius: 16,
          }}
        >
          <Text style={{ color: colors.error[700] }}>
            Please resolve the following issues:
          </Text>
          <Stack gap={4}>
            {errorSummary.map((message) => (
              <Text key={message} style={{ color: colors.error[700] }}>
                • {message}
              </Text>
            ))}
          </Stack>
        </Stack>
      )}

      <Stack gap={16}>
        {/* Education Level */}
        <Stack gap={8}>
          <Text>Highest Education Level</Text>
          <Controller
            name="education_level"
            control={control}
            render={({ field }) => (
              <SmartSelect
                value={field.value}
                onValueChange={field.onChange}
                options={EDUCATION_LEVEL_OPTIONS.map((level) => ({
                  label: level,
                  value: level,
                }))}
                placeholder="Select education level"
                error={errors.education_level?.message}
                allowClear
                disabled={isLoading}
              />
            )}
          />
        </Stack>

        {/* Education Entries */}
        <Stack gap={12}>
          <Row justify="space-between" align="center">
            <Text>Education History</Text>
            <Button size="sm" onPress={addEducationEntry} iconStart={Plus}>
              Add Education
            </Button>
          </Row>

          {fields.map((field, index) => {
            const entryErrors = educationEntryFieldErrors[index];
            const hasEntryErrors =
              entryErrors !== undefined && entryErrors !== null;
            const entryId = field.id;
            const entryData = watch(`education_entries.${index}`);
            const isEditing = editingEntryId === entryData?.id;
            const hasId = Boolean(entryData?.id);

            // Hide entry if:
            // 1. It has an ID (existing entry) AND is not being edited
            // 2. OR it's explicitly in the hidden set and not being edited
            const isHidden =
              (hasId && !isEditing) ||
              (hiddenEntryIds.has(entryId) && !isEditing);

            // Only show forms for:
            // - New entries (no ID)
            // - Entries being edited (isEditing is true)
            if (isHidden) {
              return null;
            }

            return (
              <View
                key={field.id}
                ref={(el) => {
                  if (el) {
                    // View ref is compatible with HTMLElement for scroll operations
                    entryRefs.current[entryId] = el as unknown as HTMLElement;
                  }
                }}
              >
                <Stack
                  gap={12}
                  style={{
                    padding: 12,
                    borderWidth: 1,
                    borderColor: isEditing
                      ? pal.selectedBorder
                      : hasEntryErrors
                      ? colors.error[300]
                      : colors.border[theme].default,
                    backgroundColor: isEditing
                      ? pal.pillBg
                      : hasEntryErrors
                      ? theme === "light"
                        ? colors.error[50]
                        : colors.error[900]
                      : colors.bg[theme].default,
                    borderRadius: 16,
                  }}
                >
                  <Row justify="space-between" align="center">
                    <Text>
                      {entryData?.id
                        ? "Edit Education"
                        : `Education ${index + 1}`}
                    </Text>
                    <Button
                      size="sm"
                      variant="outline"
                      onPress={() => remove(index)}
                      iconStart={X}
                    >
                      Remove
                    </Button>
                  </Row>

                  {/* Institution */}
                  <Stack gap={8}>
                    <Text>Institution *</Text>
                    <Controller
                      name={`education_entries.${index}.university_id`}
                      control={control}
                      render={({ field: universityField }) => (
                        <Controller
                          name={`education_entries.${index}.institution_name`}
                          control={control}
                          render={({ field: nameField }) => {
                            const isManualMode =
                              manualEntryMode[index] ?? false;
                            return (
                              <Stack gap={8}>
                                {!isManualMode ? (
                                  <>
                                    <UniversityAutocomplete
                                      value={nameField.value || ""}
                                      // Control input value when editing to display institution name
                                      // This ensures the value shows even if not in search results yet
                                      inputValue={
                                        isEditing && nameField.value
                                          ? nameField.value
                                          : undefined
                                      }
                                      onChange={nameField.onChange}
                                      onUniversitySelect={(
                                        university: University
                                      ) => {
                                        universityField.onChange(university.id);
                                        nameField.onChange(university.name);
                                        setValue(
                                          `education_entries.${index}.is_verified`,
                                          true,
                                          {
                                            shouldValidate: false,
                                          }
                                        );
                                        setManualEntryMode((prev) => ({
                                          ...prev,
                                          [index]: false,
                                        }));
                                      }}
                                      onSearch={handleUniversitySearch}
                                      results={
                                        (searchUniversitiesQuery.data
                                          ?.universities || []) as University[]
                                      }
                                      loading={
                                        searchUniversitiesQuery.isLoading
                                      }
                                      searchError={
                                        searchUniversitiesQuery.error?.message
                                      }
                                      placeholder="Search for institution..."
                                      error={
                                        entryErrors?.institution_name
                                          ?.message ||
                                        entryErrors?.university_id?.message
                                      }
                                    />
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onPress={() => {
                                        setManualEntryMode((prev) => ({
                                          ...prev,
                                          [index]: true,
                                        }));
                                        universityField.onChange(null);
                                        setValue(
                                          `education_entries.${index}.is_verified`,
                                          false,
                                          {
                                            shouldValidate: false,
                                          }
                                        );
                                      }}
                                    >
                                      Can't find your institution? Enter it
                                      manually
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    <Input
                                      placeholder="Enter institution name"
                                      value={nameField.value || ""}
                                      onChangeText={(text) => {
                                        nameField.onChange(text);
                                        universityField.onChange(null);
                                      }}
                                      aria-label="Institution name"
                                      accessibilityLabel="Institution name"
                                      aria-required="true"
                                    />
                                    <FieldError
                                      message={
                                        entryErrors?.institution_name?.message
                                      }
                                    />
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onPress={() => {
                                        setManualEntryMode((prev) => ({
                                          ...prev,
                                          [index]: false,
                                        }));
                                        nameField.onChange("");
                                        universityField.onChange(undefined);
                                      }}
                                    >
                                      Search from catalog instead
                                    </Button>
                                  </>
                                )}
                              </Stack>
                            );
                          }}
                        />
                      )}
                    />
                  </Stack>

                  {/* Degree Type */}
                  <Stack gap={8}>
                    <Text>Degree Type</Text>
                    <Controller
                      name={`education_entries.${index}.degree_type`}
                      control={control}
                      render={({ field }) => (
                        <SmartSelect
                          value={field.value}
                          onValueChange={(value) => {
                            field.onChange(value);
                            if (value !== "Other") {
                              setValue(
                                `education_entries.${index}.custom_degree_type`,
                                undefined,
                                {
                                  shouldValidate: true,
                                }
                              );
                            }
                          }}
                          options={DEGREE_TYPE_OPTIONS.map((type) => ({
                            label: type,
                            value: type,
                          }))}
                          placeholder="Select degree type"
                          allowClear
                          error={entryErrors?.degree_type?.message}
                        />
                      )}
                    />
                    {/* Custom Degree Type Input (shown when "Other" is selected) */}
                    <Controller
                      name={`education_entries.${index}.degree_type`}
                      control={control}
                      render={({ field: degreeTypeField }) => {
                        const isOther = degreeTypeField.value === "Other";
                        return (
                          <>
                            {isOther && (
                              <Controller
                                name={`education_entries.${index}.custom_degree_type`}
                                control={control}
                                render={({ field: customField }) => (
                                  <>
                                    <Input
                                      placeholder="Specify degree type"
                                      value={customField.value || ""}
                                      onChangeText={customField.onChange}
                                      aria-label="Custom degree type"
                                      accessibilityLabel="Custom degree type"
                                    />
                                    <FieldError
                                      message={
                                        entryErrors?.custom_degree_type?.message
                                      }
                                    />
                                  </>
                                )}
                              />
                            )}
                          </>
                        );
                      }}
                    />
                  </Stack>

                  {/* Field of Study */}
                  <Stack gap={8}>
                    <Text>Field of Study</Text>
                    <Controller
                      name={`education_entries.${index}.field_of_study`}
                      control={control}
                      render={({ field }) => (
                        <Input
                          placeholder="e.g. Computer Science"
                          value={field.value || ""}
                          onChangeText={field.onChange}
                          aria-label="Field of study"
                          accessibilityLabel="Field of study"
                        />
                      )}
                    />
                  </Stack>

                  {/* GPA */}
                  <Stack gap={8}>
                    <Text>GPA (Optional)</Text>
                    <Controller
                      name={`education_entries.${index}.gpa`}
                      control={control}
                      render={({ field }) => {
                        // Use local state to track raw input for better decimal handling
                        const [localValue, setLocalValue] = useState(
                          field.value?.toString() || ""
                        );

                        // Sync local value when field value changes externally (e.g., form reset)
                        useEffect(() => {
                          setLocalValue(field.value?.toString() || "");
                        }, [field.value]);

                        return (
                          <>
                            <Input
                              placeholder="e.g. 3.5 (0.0 - 4.0)"
                              value={localValue}
                              aria-label="GPA"
                              accessibilityLabel="GPA"
                              onChangeText={(text) => {
                                // Allow empty string
                                if (text === "") {
                                  setLocalValue("");
                                  field.onChange(undefined);
                                  return;
                                }

                                // Allow decimal point and digits
                                // Match pattern: optional digits, optional decimal point, optional single digit after decimal
                                const decimalPattern = /^\d*\.?\d?$/;
                                if (!decimalPattern.test(text)) {
                                  return; // Don't update if invalid pattern
                                }

                                // Update local display value
                                setLocalValue(text);

                                // Parse as float
                                const numValue = Number.parseFloat(text);

                                // Validate range and that it's a valid number
                                if (
                                  !Number.isNaN(numValue) &&
                                  numValue >= 0 &&
                                  numValue <= 4.0 &&
                                  // Ensure max 1 decimal place
                                  (text.split(".")[1]?.length ?? 0) <= 1
                                ) {
                                  // Only update form field if we have a complete number (not just "3.")
                                  if (!text.endsWith(".")) {
                                    field.onChange(numValue);
                                  }
                                }
                              }}
                              onBlur={() => {
                                // On blur, ensure we have a valid number
                                const currentValue = field.value;
                                if (
                                  currentValue !== undefined &&
                                  currentValue !== null
                                ) {
                                  // Round to 1 decimal place
                                  const rounded =
                                    Math.round(currentValue * 10) / 10;
                                  field.onChange(rounded);
                                  setLocalValue(rounded.toString());
                                } else {
                                  setLocalValue("");
                                }
                              }}
                              keyboardType="decimal-pad"
                            />
                            <FieldError message={entryErrors?.gpa?.message} />
                          </>
                        );
                      }}
                    />
                  </Stack>

                  {/* Start and End Dates */}
                  <Stack gap={8}>
                    <Row gap={12}>
                      <Stack gap={8} style={{ flex: 1 }}>
                        <Controller
                          name={`education_entries.${index}.start_date`}
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
                              error={entryErrors?.start_date?.message}
                              label="Start Date"
                            />
                          )}
                        />
                      </Stack>
                      <Stack gap={8} style={{ flex: 1 }}>
                        <Controller
                          name={`education_entries.${index}.end_date`}
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
                                `education_entries.${index}.is_current`
                              )}
                              error={entryErrors?.end_date?.message}
                              label="End Date"
                            />
                          )}
                        />
                      </Stack>
                    </Row>

                    {/* Currently Enrolled Checkbox */}
                    <Controller
                      name={`education_entries.${index}.is_current`}
                      control={control}
                      render={({ field }) => {
                        const isCurrent = Boolean(field.value);
                        const handleChange = (next: boolean) => {
                          field.onChange(next);
                          if (next) {
                            setValue(
                              `education_entries.${index}.end_date`,
                              undefined,
                              {
                                shouldValidate: true,
                              }
                            );
                          } else {
                            setValue(
                              `education_entries.${index}.expected_graduation_date`,
                              undefined,
                              { shouldValidate: true }
                            );
                          }
                        };

                        return (
                          <Row gap={8} align="center">
                            <Checkbox
                              checked={isCurrent}
                              onChange={handleChange}
                            />
                            <Label onPress={() => handleChange(!isCurrent)}>
                              Currently enrolled
                            </Label>
                          </Row>
                        );
                      }}
                    />

                    {/* Expected Graduation Date (shown when is_current is true) */}
                    <Controller
                      name={`education_entries.${index}.is_current`}
                      control={control}
                      render={({ field: isCurrentField }) => (
                        <>
                          {isCurrentField.value && (
                            <Controller
                              name={`education_entries.${index}.expected_graduation_date`}
                              control={control}
                              render={({ field: expectedField }) => (
                                <MonthYearPicker
                                  value={
                                    expectedField.value
                                      ? new Date(expectedField.value)
                                      : null
                                  }
                                  onChange={(date) => {
                                    // Store as YYYY-MM-DD format (first day of month)
                                    const dateStr = date
                                      ? date.toISOString().split("T")[0]
                                      : null;
                                    expectedField.onChange(
                                      dateStr || undefined
                                    );
                                  }}
                                  error={
                                    entryErrors?.expected_graduation_date
                                      ?.message
                                  }
                                  label="Expected Graduation Date"
                                />
                              )}
                            />
                          )}
                        </>
                      )}
                    />
                  </Stack>

                  {/* Description */}
                  <Stack gap={8}>
                    <Text>Description</Text>
                    <Controller
                      name={`education_entries.${index}.description`}
                      control={control}
                      render={({ field }) => (
                        <>
                          <TextArea
                            placeholder="Describe your education experience, achievements, relevant coursework..."
                            value={field.value || ""}
                            onChangeText={field.onChange}
                            style={{ minHeight: 80 }}
                          />
                          <FieldError
                            message={entryErrors?.description?.message}
                          />
                        </>
                      )}
                    />
                  </Stack>
                </Stack>
              </View>
            );
          })}

          {fields.length === 0 && (
            <Stack style={{ padding: 16 }} align="center" gap={8}>
              <Text style={{ color: colors.text[theme].secondary }}>
                No education entries added yet
              </Text>
            </Stack>
          )}
        </Stack>

        {/* Action Buttons */}
        <Row justify="flex-end" gap={12} style={{ paddingTop: 16 }}>
          <Button
            variant="outline"
            disabled={!isDirty}
            onPress={() => setShowCancelDialog(true)}
            style={{ opacity: !isDirty ? 0.5 : 1 }}
          >
            Cancel
          </Button>
          <Button
            variant="filled"
            color="primary"
            onPress={handleSubmit(onSubmit)}
            disabled={!isDirty || isLoading}
            style={{ opacity: !isDirty || isLoading ? 0.5 : 1 }}
          >
            {isSyncing ? "Saving..." : "Save Changes"}
          </Button>
        </Row>

        {/* Cancel Confirmation Modal */}
        <Modal
          visible={showCancelDialog}
          onClose={() => setShowCancelDialog(false)}
        >
          <ModalHeader
            title="Discard Changes?"
            description="You have unsaved changes. Are you sure you want to discard them?"
            onClose={() => setShowCancelDialog(false)}
          />
          <ModalActions
            orientation="right"
            primaryAction={{
              label: "Discard Changes",
              color: "error",
              onPress: () => {
                if (originalDataRef.current) {
                  reset(originalDataRef.current);
                  setShowCancelDialog(false);
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

interface SmartSelectOption {
  label: string;
  value: string;
}

interface SmartSelectProps {
  value?: string;
  onValueChange: (value: string | undefined) => void;
  options: SmartSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  allowClear?: boolean;
}

function SmartSelect({
  value,
  onValueChange,
  options,
  placeholder,
  disabled = false,
  error,
  allowClear = false,
}: SmartSelectProps) {
  const { theme } = useThemeContext();
  const [open, setOpen] = useState(false);
  const [contentWidth, setContentWidth] = useState<number | undefined>();
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value),
    [options, value]
  );

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (disabled) return;
      setOpen(nextOpen);
      if (nextOpen && triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setContentWidth(rect.width);
      }
    },
    [disabled]
  );

  const handleSelect = useCallback(
    (nextValue: string | undefined) => {
      onValueChange(nextValue);
      setOpen(false);
    },
    [onValueChange]
  );

  const displayLabel = selectedOption?.label ?? placeholder ?? "Select";

  const popoverContent = (
    <PopoverContent>
      <ScrollView style={{ maxHeight: 280 }}>
        <Stack gap={4} style={{ minWidth: contentWidth ?? 220, maxWidth: 320 }}>
          {allowClear && (
            <Button
              size="sm"
              variant="text"
              onPress={() => handleSelect(undefined)}
              disabled={disabled}
            >
              Clear selection
            </Button>
          )}
          {allowClear && options.length > 0 && <Separator />}
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <Button
                key={option.value}
                size="sm"
                variant={isSelected ? "light" : "text"}
                color={isSelected ? "primary" : "gray"}
                onPress={() => handleSelect(option.value)}
                disabled={disabled}
              >
                {option.label}
              </Button>
            );
          })}
        </Stack>
      </ScrollView>
    </PopoverContent>
  );

  return (
    <Stack gap={8}>
      <Popover
        open={open}
        onOpenChange={handleOpenChange}
        content={popoverContent}
        placement="bottom-start"
        width="trigger"
      >
        <Button
          variant="outline"
          iconEnd={ChevronDown}
          disabled={disabled}
          style={{
            borderColor: error
              ? colors.error[500]
              : colors.border[theme].default,
          }}
          onPress={() => handleOpenChange(!open)}
        >
          {displayLabel}
        </Button>
      </Popover>
      {error && <Text style={{ color: colors.error[600] }}>{error}</Text>}
    </Stack>
  );
}
