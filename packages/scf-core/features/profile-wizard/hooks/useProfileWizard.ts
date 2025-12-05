import { api } from "@scf/core/utils/api";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_WIZARD_PROGRESS,
  PROFILE_WIZARD_STEP_META,
  PROFILE_WIZARD_STEPS,
  type ProfileWizardProgress,
  type ProfileWizardStepId,
} from "../utils/wizardSteps";

export interface GeneralInfoStepData {
  firstName: string;
  lastName: string;
  headline: string;
  bio: string;
}

export interface SkillEntry {
  id: string;
  name: string;
  taxonomy: "csi" | "onet";
  proficiency: number;
}

export interface SkillsStepData {
  skills: SkillEntry[];
}

export interface ExperienceStepData {
  jobTitle: string;
  companyName: string;
  startDate: string | null;
  endDate: string | null;
  isCurrent: boolean;
  summary?: string;
}

export interface CertificationEntry {
  id?: string;
  name: string;
  issuer: string;
  issuedOn?: string | null;
  expiresOn?: string | null;
}

export interface CertificationsStepData {
  certifications: CertificationEntry[];
}

export interface EmploymentPreferencesStepData {
  locationPreference: string | null;
  hourlyRate: string | null;
  availability: string | null;
  remotePreference?: "remote" | "hybrid" | "onsite" | null;
}

export interface EducationStepData {
  degreeType: string;
  institutionName: string;
  startDate: string | null;
  endDate: string | null;
  isCurrent: boolean;
}

export type WizardStepPayloads = {
  general: GeneralInfoStepData;
  skills: SkillsStepData;
  experience: ExperienceStepData;
  certifications: CertificationsStepData;
  preferences: EmploymentPreferencesStepData;
  education: EducationStepData;
};

export type WizardStepData = Partial<WizardStepPayloads>;

export interface SaveStepInput<
  TStep extends ProfileWizardStepId = ProfileWizardStepId,
> {
  step: TStep;
  data: WizardStepPayloads[TStep];
  skip?: boolean;
}

interface UseQueryLike<TData> {
  data: TData | undefined;
  isLoading: boolean;
  isError: boolean;
  refetch: () => Promise<unknown>;
}

interface UseMutationLike<TData, TVariables> {
  mutateAsync: (variables: TVariables) => Promise<TData>;
  isPending: boolean;
}

interface ProfileWizardApi {
  getProgress: {
    useQuery: (
      input?: undefined,
      options?: {
        enabled?: boolean;
        staleTime?: number;
      },
    ) => UseQueryLike<ProfileWizardProgressResponse>;
  };
  saveStep: {
    useMutation: () => UseMutationLike<
      ProfileWizardProgressResponse,
      SaveStepInput
    >;
  };
  complete: {
    useMutation: () => UseMutationLike<
      ProfileWizardProgressResponse,
      { celebrate?: boolean }
    >;
  };
}

export interface ProfileWizardProgressResponse extends ProfileWizardProgress {
  stepData: WizardStepData;
}

interface ProfileWizardUtils {
  getProgress: {
    invalidate: () => Promise<unknown>;
  };
}

export interface WizardState {
  currentStep: ProfileWizardStepId;
  stepData: WizardStepData;
  progress: ProfileWizardProgress;
  isSaving: boolean;
  isCompleting: boolean;
  lastSavedAt: Date | null;
}

export interface UseProfileWizardReturn {
  state: WizardState;
  orderedSteps: ProfileWizardStepId[];
  goToStep: (step: ProfileWizardStepId) => void;
  goNext: () => void;
  goBack: () => void;
  saveStep: <TStep extends ProfileWizardStepId>(
    input: SaveStepInput<TStep>,
  ) => Promise<ProfileWizardProgressResponse>;
  completeWizard: (
    options?: { celebrate?: boolean },
  ) => Promise<ProfileWizardProgressResponse>;
  markStepSkipped: (step: ProfileWizardStepId) => void;
  refresh: () => Promise<void>;
  isLoading: boolean;
  isError: boolean;
}

const DEFAULT_STATE: WizardState = {
  currentStep: DEFAULT_WIZARD_PROGRESS.currentStep,
  stepData: {},
  progress: DEFAULT_WIZARD_PROGRESS,
  isSaving: false,
  isCompleting: false,
  lastSavedAt: null,
};

const profileWizardApi =
  (api as unknown as { profileWizard: ProfileWizardApi }).profileWizard;

const profileWizardUtils = () =>
  (api.useUtils() as unknown as { profileWizard: ProfileWizardUtils })
    .profileWizard;

function getAdjacentStep(
  current: ProfileWizardStepId,
  direction: 1 | -1,
): ProfileWizardStepId {
  const currentIndex = PROFILE_WIZARD_STEPS.indexOf(current);
  const nextIndex = currentIndex + direction;
  if (nextIndex < 0) {
    return PROFILE_WIZARD_STEPS[0];
  }
  if (nextIndex >= PROFILE_WIZARD_STEPS.length) {
    return PROFILE_WIZARD_STEPS[PROFILE_WIZARD_STEPS.length - 1];
  }
  return PROFILE_WIZARD_STEPS[nextIndex];
}

function mergeProgress(
  response: ProfileWizardProgressResponse | undefined,
  previousState: WizardState,
): WizardState {
  if (!response) {
    return previousState;
  }

  return {
    currentStep: response.currentStep,
    stepData: response.stepData ?? previousState.stepData,
    progress: {
      currentStep: response.currentStep,
      completedSteps: response.completedSteps,
      completionPercentage: response.completionPercentage,
      lastSavedAt: response.lastSavedAt,
      requiredSteps: response.requiredSteps,
    },
    isSaving: false,
    isCompleting: false,
    lastSavedAt: response.lastSavedAt
      ? new Date(response.lastSavedAt)
      : previousState.lastSavedAt,
  };
}

export function useProfileWizard(
  initialStep?: ProfileWizardStepId,
): UseProfileWizardReturn {
  const [state, setState] = useState<WizardState>({
    ...DEFAULT_STATE,
    currentStep: initialStep ?? DEFAULT_STATE.currentStep,
  });

  const utils = profileWizardUtils();
  const { data, isLoading, isError, refetch } = profileWizardApi.getProgress
    .useQuery(undefined, {
      staleTime: 60_000,
    });

  useEffect(() => {
    if (!data) return;

    setState((prev) => ({
      ...mergeProgress(data, prev),
      currentStep: initialStep && PROFILE_WIZARD_STEPS.includes(initialStep)
        ? initialStep
        : data.currentStep,
    }));
  }, [data, initialStep]);

  const orderedSteps = useMemo(() => PROFILE_WIZARD_STEPS.slice(), []);

  const goToStep = useCallback((step: ProfileWizardStepId) => {
    setState((prev) => ({
      ...prev,
      currentStep: step,
    }));
  }, []);

  const goNext = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentStep: getAdjacentStep(prev.currentStep, 1),
    }));
  }, []);

  const goBack = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentStep: getAdjacentStep(prev.currentStep, -1),
    }));
  }, []);

  const saveStepMutation = profileWizardApi.saveStep.useMutation();

  const saveStep = useCallback(
    async <TStep extends ProfileWizardStepId>(input: SaveStepInput<TStep>) => {
      setState((prev) => ({
        ...prev,
        isSaving: true,
        stepData: {
          ...prev.stepData,
          [input.step]: input.data,
        },
      }));

      const result = await saveStepMutation.mutateAsync(input);

      setState((prev) => ({
        ...mergeProgress(result, prev),
        isSaving: false,
      }));

      await utils.getProgress.invalidate();

      return result;
    },
    [saveStepMutation, utils],
  );

  const markStepSkipped = useCallback((step: ProfileWizardStepId) => {
    setState((prev) => ({
      ...prev,
      progress: {
        ...prev.progress,
        completedSteps: prev.progress.completedSteps.filter((id) =>
          id !== step
        ),
      },
    }));
  }, []);

  const completeMutation = profileWizardApi.complete.useMutation();

  const completeWizard = useCallback(
    async (options?: { celebrate?: boolean }) => {
      setState((prev) => ({
        ...prev,
        isCompleting: true,
      }));

      const result = await completeMutation.mutateAsync({
        celebrate: options?.celebrate ?? true,
      });

      setState((prev) => ({
        ...mergeProgress(result, prev),
        isCompleting: false,
      }));

      await utils.getProgress.invalidate();

      return result;
    },
    [completeMutation, utils],
  );

  const refresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return {
    state,
    orderedSteps,
    goToStep,
    goNext,
    goBack,
    saveStep,
    completeWizard,
    markStepSkipped,
    refresh,
    isLoading,
    isError,
  };
}

export function getStepDisplayMeta(step: ProfileWizardStepId) {
  return PROFILE_WIZARD_STEP_META[step];
}
