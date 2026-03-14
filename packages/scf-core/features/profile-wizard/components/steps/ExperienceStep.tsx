import { ToggleSwitch } from "@scaffald/ui";
import { MonthYearPicker } from "../../../profile/components/MonthYearPicker";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { Input, Paragraph, Text, Row, Stack, useThemeContext } from "@scaffald/ui";
import { colors } from "@scaffald/ui/tokens";
import { z } from "zod";
import type { ExperienceStepData } from "../../hooks/useProfileWizard";
import { StepNavigation } from "../StepNavigation";
import type { WizardStepComponentProps } from "./types";

const experienceSchema = z.object({
  jobTitle: z.string().min(1, "Job title is required"),
  companyName: z.string().min(1, "Company is required"),
  startDate: z.string().min(4, "Start date is required"),
  endDate: z.string().optional(),
  isCurrent: z.boolean(),
  summary: z.string().optional(),
});

type ExperienceFormValues = z.infer<typeof experienceSchema>;

const DEFAULT_VALUES: ExperienceFormValues = {
  jobTitle: "",
  companyName: "",
  startDate: "",
  endDate: "",
  isCurrent: true,
  summary: "",
};

export function ExperienceStep({
  initialData,
  isSaving,
  isLastStep,
  onBack,
  onContinue,
  onSaveForLater,
  onSkip,
  onStepStateChange,
}: WizardStepComponentProps<"experience">) {
  const { theme } = useThemeContext();
  const t = theme === "dark" ? "dark" : "light";

  const {
    control,
    handleSubmit,
    formState: { errors, isValid, isDirty },
    reset,
  } = useForm<ExperienceFormValues>({
    defaultValues: toExperienceFormValues(initialData),
    resolver: zodResolver(experienceSchema),
    mode: "onChange",
  });

  const values = useWatch({ control });

  useEffect(() => {
    if (!initialData) {
      return;
    }

    reset(toExperienceFormValues(initialData), { keepDefaultValues: false });
  }, [initialData, reset]);

  useEffect(() => {
    const payload = formatExperiencePayload(values);

    onStepStateChange?.({
      data: payload,
      isValid,
      isDirty,
    });
  }, [values, isValid, isDirty, onStepStateChange]);

  const submit = handleSubmit(async (data) => {
    await onContinue(formatExperiencePayload(data));
  });

  const handleSaveForLater = handleSubmit(async (data) => {
    await onSaveForLater?.(formatExperiencePayload(data));
  });

  const handleSkip = async () => {
    await onSkip?.();
  };

  return (
    <Stack gap={16}>
      <Stack gap={8}>
        <Text>Add your latest experience</Text>
        <Paragraph style={{ color: colors.text[t].secondary }}>
          Showcase your most recent role. You can add more later in your full
          profile.
        </Paragraph>
      </Stack>

      <Stack gap={8}>
        <Text>Job Title *</Text>
        <Controller
          control={control}
          name="jobTitle"
          render={({ field }) => (
            <Input
              {...field}
              placeholder="Lead Carpenter"
              onChangeText={field.onChange}
            />
          )}
        />
        {errors.jobTitle && (
          <Text style={{ color: colors.error[500] }}>{errors.jobTitle.message}</Text>
        )}
      </Stack>

      <Stack gap={8}>
        <Text>Company *</Text>
        <Controller
          control={control}
          name="companyName"
          render={({ field }) => (
            <Input
              {...field}
              placeholder="Summit Builders"
              onChangeText={field.onChange}
            />
          )}
        />
        {errors.companyName && (
          <Text style={{ color: colors.error[500] }}>{errors.companyName.message}</Text>
        )}
      </Stack>

      <Row gap={12}>
        <Stack flex={1} gap={8}>
          <Controller
            control={control}
            name="startDate"
            render={({ field }) => (
              <MonthYearPicker
                label="Start Date *"
                value={parseWizardDate(field.value)}
                onChange={(date: Date | null) =>
                  field.onChange(date ? formatWizardDate(date) : "")
                }
                error={errors.startDate?.message}
              />
            )}
          />
        </Stack>

        <Stack flex={1} gap={8}>
          <Controller
            control={control}
            name="endDate"
            render={({ field }) => (
              <MonthYearPicker
                label="End Date"
                value={parseWizardDate(field.value)}
                onChange={(date: Date | null) =>
                  field.onChange(date ? formatWizardDate(date) : "")
                }
                disabled={values.isCurrent}
                error={errors.endDate?.message}
              />
            )}
          />
        </Stack>
      </Row>

      <Row gap={8} align="center">
        <Controller
          control={control}
          name="isCurrent"
          render={({ field }) => (
            <ToggleSwitch
              checked={Boolean(field.value)}
              onChange={field.onChange}
              aria-label="I currently work here"
              data-testid="toggle-current-job"
            />
          )}
        />
        <Text>I currently work here</Text>
      </Row>

      <Stack gap={8}>
        <Text>Summary</Text>
        <Controller
          control={control}
          name="summary"
          render={({ field }) => (
            <Input
              {...field}
              placeholder="Installed custom millwork across four high-rise projects..."
              onChangeText={field.onChange}
            />
          )}
        />
      </Stack>

      <StepNavigation
        canGoBack
        canGoNext={isValid}
        isLastStep={isLastStep}
        isSaving={isSaving}
        onBack={onBack}
        onNext={submit}
        onSkip={onSkip ? handleSkip : undefined}
        onSaveForLater={onSaveForLater ? handleSaveForLater : undefined}
        nextLabel="Next: Certifications"
      />
    </Stack>
  );
}

function parseWizardDate(value?: string | null): Date | null {
  if (!value) return null;
  const [yearPart, monthPart] = value.split("-");
  const year = Number.parseInt(yearPart ?? "", 10);
  const month = Number.parseInt(monthPart ?? "", 10);
  if (Number.isNaN(year) || Number.isNaN(month)) {
    return null;
  }
  return new Date(year, month - 1, 1);
}

function formatWizardDate(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  return `${year}-${month}-01`;
}

function normalizeWizardDate(value?: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeText(value?: string | null): string {
  return value?.trim() ?? "";
}

function formatExperiencePayload(
  data: Partial<ExperienceFormValues>
): ExperienceStepData {
  return {
    jobTitle: normalizeText(data.jobTitle),
    companyName: normalizeText(data.companyName),
    startDate: normalizeWizardDate(data.startDate),
    endDate: data.isCurrent ? null : normalizeWizardDate(data.endDate),
    isCurrent: data.isCurrent ?? true,
    summary: normalizeText(data.summary),
  };
}

function toExperienceFormValues(
  data?: ExperienceStepData | null
): ExperienceFormValues {
  if (!data) {
    return DEFAULT_VALUES;
  }

  return {
    jobTitle: data.jobTitle ?? "",
    companyName: data.companyName ?? "",
    startDate: data.startDate ?? "",
    endDate: data.endDate ?? "",
    isCurrent: data.isCurrent ?? true,
    summary: data.summary ?? "",
  };
}
