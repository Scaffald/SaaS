import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ResumeWizardSection } from "../../hooks/useResumeWizard";
import { useResumeWizard } from "../../hooks/useResumeWizard";

interface MockWizardState {
  id: string;
  resumeId: string;
  currentStep: number;
  completedSteps: number[];
  parsedData?: Record<string, unknown>;
  errors?: Array<{ section: ResumeWizardSection; message: string }>;
}

let wizardState: MockWizardState | undefined;
const refetchMock = vi.fn(async () => ({ data: wizardState }));
const saveSectionMutateAsync = vi.fn();
const updateProgressMutateAsync = vi.fn();

vi.mock("@app/core/utils/api", () => ({
  api: {
    resume: {
      getWizardState: {
        useQuery: vi.fn(() => ({
          data: wizardState,
          isLoading: false,
          refetch: refetchMock,
        })),
      },
      saveSection: {
        useMutation: () => ({
          mutateAsync: saveSectionMutateAsync,
          isLoading: false,
        }),
      },
      updateProgress: {
        useMutation: () => ({
          mutateAsync: updateProgressMutateAsync,
          isLoading: false,
        }),
      },
    },
  },
}));

const RESUME_ID = "resume-123";

describe("useResumeWizard", () => {
  beforeEach(() => {
    wizardState = {
      id: "wizard-123",
      resumeId: RESUME_ID,
      currentStep: 0,
      completedSteps: [],
      parsedData: {},
      errors: [],
    };

    refetchMock.mockReset();
    refetchMock.mockImplementation(async () => ({ data: wizardState }));

    saveSectionMutateAsync.mockReset();
    saveSectionMutateAsync.mockResolvedValue(undefined);

    updateProgressMutateAsync.mockReset();
    updateProgressMutateAsync.mockResolvedValue(undefined);
  });

  it("initializes the current index from wizard state and clamps within step range", () => {
    if (!wizardState) {
      throw new Error("wizardState should be initialized");
    }
    wizardState = {
      ...wizardState,
      currentStep: 3,
      completedSteps: [0, 1, 2],
    };

    const { result } = renderHook(() => useResumeWizard(RESUME_ID));

    expect(result.current.steps).toHaveLength(7);
    expect(result.current.currentIndex).toBe(3);
    expect(result.current.currentStep.id).toBe("skills");
  });

  it("saveSection sends merge strategy payload and advances to next step", async () => {
    if (!wizardState) {
      throw new Error("wizardState should be initialized");
    }
    wizardState = {
      ...wizardState,
      currentStep: 0,
      completedSteps: [],
    };

    const { result } = renderHook(() => useResumeWizard(RESUME_ID));
    expect(result.current.currentIndex).toBe(0);

    await act(async () => {
      await result.current.saveSection("general", { firstName: "Ada" });
    });

    expect(saveSectionMutateAsync).toHaveBeenCalledTimes(1);
    expect(saveSectionMutateAsync).toHaveBeenCalledWith({
      section: "general",
      data: { firstName: "Ada" },
      mergeStrategy: { mode: "replace" },
      wizardState: {
        resumeId: RESUME_ID,
        currentStep: 0,
        completedSteps: [],
      },
    });

    expect(refetchMock).toHaveBeenCalledTimes(1);
    expect(result.current.currentIndex).toBe(1);
    expect(result.current.currentStep.id).toBe("experience");
  });

  it("skipSection updates progress and moves to the following step", async () => {
    if (!wizardState) {
      throw new Error("wizardState should be initialized");
    }
    wizardState = {
      ...wizardState,
      currentStep: 1,
      completedSteps: [0],
    };

    const { result } = renderHook(() => useResumeWizard(RESUME_ID));
    expect(result.current.currentIndex).toBe(1);

    await act(async () => {
      await result.current.skipSection();
    });

    expect(updateProgressMutateAsync).toHaveBeenCalledTimes(1);
    expect(updateProgressMutateAsync).toHaveBeenCalledWith({
      resumeId: RESUME_ID,
      currentStep: 2,
      completedSteps: [0, 1],
    });

    expect(refetchMock).toHaveBeenCalledTimes(1);
    expect(result.current.currentIndex).toBe(2);
    expect(result.current.currentStep.id).toBe("education");
  });

  it("exposes parsed data and errors from the wizard query", () => {
    const parsedData = {
      general: [{ firstName: "Casey", lastName: "Jones" }],
    };
    const errors = [{ section: "skills" as const, message: "Missing skills" }];

    if (!wizardState) {
      throw new Error("wizardState should be initialized");
    }
    wizardState = {
      ...wizardState,
      parsedData,
      errors,
    };

    const { result } = renderHook(() => useResumeWizard(RESUME_ID));

    expect(result.current.parsedData).toEqual(parsedData);
    expect(result.current.errors).toEqual(errors);
  });
});
