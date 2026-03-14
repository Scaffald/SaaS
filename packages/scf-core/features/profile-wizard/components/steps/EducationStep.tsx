import { ToggleSwitch } from "@scaffald/ui";
import { MonthYearPicker } from "../../../profile/components/MonthYearPicker";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { Input, Paragraph, Text, Row, Stack, useThemeContext } from "@scaffald/ui";
import { colors } from '@scaffald/ui/tokens'
import { z } from "zod";
import type { EducationStepData } from "../../hooks/useProfileWizard";
import { StepNavigation } from "../StepNavigation";
import type { WizardStepComponentProps } from "./types";

const educationSchema = z.object({
  degreeType: z.string().optional(),
  institutionName: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  isCurrent: z.boolean(),
});

type EducationFormValues = z.infer<typeof educationSchema>;

const DEFAULT_VALUES: EducationFormValues = {
  degreeType: "",
  institutionName: "",
  startDate: "",
  endDate: "",
  isCurrent: false,
};

export function EducationStep({
  initialData,
  isSaving,
  isLastStep,
  onBack,
  onContinue,
  onSaveForLater,
  onSkip,
  onStepStateChange,
}: WizardStepComponentProps<"education">) {
  const { theme } = useThemeContext();
  const t = theme === "dark" ? "dark" : "light";

  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty },
  } = useForm<EducationFormValues>({
    defaultValues: toEducationFormValues(initialData),
    resolver: zodResolver(educationSchema),
    mode: "onChange",
  });

  const values = useWatch({ control });

  useEffect(() => {
    if (!initialData) return;
    reset(toEducationFormValues(initialData), { keepDefaultValues: false });
  }, [initialData, reset]);

  useEffect(() => {
    const payload: EducationStepData = {
      degreeType: normalizeText(values.degreeType),
      institutionName: normalizeText(values.institutionName),
      startDate: normalizeWizardDate(values.startDate),
      endDate: values.isCurrent ? null : normalizeWizardDate(values.endDate),
      isCurrent: values.isCurrent ?? false,
    };

    onStepStateChange?.({
      data: payload,
      isValid: true,
      isDirty,
    });
  }, [values, isDirty, onStepStateChange]);

  const submit = handleSubmit(async (data) => {
    await onContinue(formatEducationPayload(data));
  });

  const handleSaveForLater = handleSubmit(async (data) => {
    await onSaveForLater?.(formatEducationPayload(data));
  });

  const handleSkip = async () => {
    await onSkip?.();
  };

  return (
    <Stack gap={16}>
      <Stack gap={8}>
        <Text>Highest education</Text>
        <Paragraph style={{ color: colors.text[t].secondary }}>
          Add your latest degree or training program. This section is optional
          but strengthens your profile.
        </Paragraph>
      </Stack>

      <Stack gap={8}>
        <Text>Degree or credential</Text>
        <Controller
          control={control}
          name="degreeType"
          render={({ field }) => (
            <Input
              {...field}
              placeholder="Associate of Applied Science, Carpentry"
              onChangeText={field.onChange}
            />
          )}
        />
      </Stack>

      <Stack gap={8}>
        <Text>Institution</Text>
        <Controller
          control={control}
          name="institutionName"
          render={({ field }) => (
            <Input
              {...field}
              placeholder="Northwest Technical College"
              onChangeText={field.onChange}
            />
          )}
        />
      </Stack>

      <Row gap={12}>
        <Stack flex={1} gap={8}>
          <Controller
            control={control}
            name="startDate"
            render={({ field }) => (
              <MonthYearPicker
                label="Start Date"
                value={parseWizardDate(field.value)}
                onChange={(date: Date | null) =>
                  field.onChange(date ? formatWizardDate(date) : "")
                }
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
              aria-label="I am currently enrolled"
            />
          )}
        />
        <Text>I am currently enrolled</Text>
      </Row>

      <StepNavigation
        canGoBack
        canGoNext
        isLastStep={isLastStep}
        isSaving={isSaving}
        onBack={onBack}
        onNext={submit}
        onSkip={onSkip ? handleSkip : undefined}
        onSaveForLater={onSaveForLater ? handleSaveForLater : undefined}
        nextLabel="Finish"
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

function formatEducationPayload(data: EducationFormValues): EducationStepData {
  return {
    degreeType: normalizeText(data.degreeType),
    institutionName: normalizeText(data.institutionName),
    startDate: normalizeWizardDate(data.startDate),
    endDate: data.isCurrent ? null : normalizeWizardDate(data.endDate),
    isCurrent: data.isCurrent ?? false,
  };
}

function toEducationFormValues(
  data?: EducationStepData | null
): EducationFormValues {
  if (!data) {
    return DEFAULT_VALUES;
  }

  return {
    degreeType: data.degreeType ?? "",
    institutionName: data.institutionName ?? "",
    startDate: data.startDate ?? "",
    endDate: data.endDate ?? "",
    isCurrent: data.isCurrent ?? false,
  };
}
