import { useCallback, useState } from "react";
import type { ReviewDraft, ReviewDraftState } from "../types/review-draft";
import { createEmptyReviewDraft } from "../types/review-draft";

interface UseReviewDraftOptions {
  subjectId: string;
  initialDraft?: ReviewDraft;
}

interface UseReviewDraftReturn extends ReviewDraftState {
  // Step 1: Skills ratings
  updateSkillRating: (skillId: string, rating: number) => void;

  // Step 2: Skills tags
  toggleSkillStrength: (skillId: string) => void;
  toggleSkillImprovement: (skillId: string) => void;

  // Step 3: Reliability rating
  updateReliabilityRating: (rating: number) => void;

  // Step 4: Reliability tags
  toggleReliabilityStrength: (skillId: string) => void;
  toggleReliabilityImprovement: (skillId: string) => void;

  // Step 5: Collaboration rating
  updateCollaborationRating: (rating: number) => void;

  // Step 6: Collaboration tags
  toggleCollaborationStrength: (skillId: string) => void;
  toggleCollaborationImprovement: (skillId: string) => void;

  // Step 7: Summary
  updateSummary: (summary: string) => void;

  // Step 8: Recommendation
  updateRecommendation: (recommendation: boolean) => void;

  // Navigation
  setCurrentStep: (step: number) => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;

  // State management
  markAsSaved: () => void;
  resetDraft: () => void;
  getDraft: () => ReviewDraft;
}

export function useReviewDraft({
  subjectId,
  initialDraft,
}: UseReviewDraftOptions): UseReviewDraftReturn {
  const [draft, setDraft] = useState<ReviewDraft>(
    initialDraft || createEmptyReviewDraft(subjectId),
  );
  const [isLoading, _setIsLoading] = useState(false);
  const [isSaving, _setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Helper to update draft and mark as unsaved
  const updateDraft = useCallback(
    (updates: Partial<ReviewDraft>) => {
      setDraft((prev) => ({ ...prev, ...updates }));
      setHasUnsavedChanges(true);
    },
    [],
  );

  // Helper to toggle item in array
  const toggleArrayItem = useCallback(
    (array: string[], item: string): string[] => {
      return array.includes(item)
        ? array.filter((i) => i !== item)
        : [...array, item];
    },
    [],
  );

  // Step 1: Skills ratings
  const updateSkillRating = useCallback(
    (skillId: string, rating: number) => {
      updateDraft({
        skillsRatings: { ...draft.skillsRatings, [skillId]: rating },
      });
    },
    [draft.skillsRatings, updateDraft],
  );

  // Step 2: Skills tags
  const toggleSkillStrength = useCallback(
    (skillId: string) => {
      updateDraft({
        skillsStrengths: toggleArrayItem(draft.skillsStrengths, skillId),
        // Remove from improvements if adding to strengths
        skillsImprovements: draft.skillsStrengths.includes(skillId)
          ? draft.skillsImprovements
          : draft.skillsImprovements.filter((id) => id !== skillId),
      });
    },
    [
      draft.skillsStrengths,
      draft.skillsImprovements,
      toggleArrayItem,
      updateDraft,
    ],
  );

  const toggleSkillImprovement = useCallback(
    (skillId: string) => {
      updateDraft({
        skillsImprovements: toggleArrayItem(draft.skillsImprovements, skillId),
        // Remove from strengths if adding to improvements
        skillsStrengths: draft.skillsImprovements.includes(skillId)
          ? draft.skillsStrengths
          : draft.skillsStrengths.filter((id) => id !== skillId),
      });
    },
    [
      draft.skillsImprovements,
      draft.skillsStrengths,
      toggleArrayItem,
      updateDraft,
    ],
  );

  // Step 3: Reliability rating
  const updateReliabilityRating = useCallback(
    (rating: number) => {
      updateDraft({ reliabilityRating: rating });
    },
    [updateDraft],
  );

  // Step 4: Reliability tags
  const toggleReliabilityStrength = useCallback(
    (skillId: string) => {
      updateDraft({
        reliabilityStrengths: toggleArrayItem(
          draft.reliabilityStrengths,
          skillId,
        ),
        reliabilityImprovements: draft.reliabilityStrengths.includes(skillId)
          ? draft.reliabilityImprovements
          : draft.reliabilityImprovements.filter((id) => id !== skillId),
      });
    },
    [
      draft.reliabilityStrengths,
      draft.reliabilityImprovements,
      toggleArrayItem,
      updateDraft,
    ],
  );

  const toggleReliabilityImprovement = useCallback(
    (skillId: string) => {
      updateDraft({
        reliabilityImprovements: toggleArrayItem(
          draft.reliabilityImprovements,
          skillId,
        ),
        reliabilityStrengths: draft.reliabilityImprovements.includes(skillId)
          ? draft.reliabilityStrengths
          : draft.reliabilityStrengths.filter((id) => id !== skillId),
      });
    },
    [
      draft.reliabilityImprovements,
      draft.reliabilityStrengths,
      toggleArrayItem,
      updateDraft,
    ],
  );

  // Step 5: Collaboration rating
  const updateCollaborationRating = useCallback(
    (rating: number) => {
      updateDraft({ collaborationRating: rating });
    },
    [updateDraft],
  );

  // Step 6: Collaboration tags
  const toggleCollaborationStrength = useCallback(
    (skillId: string) => {
      updateDraft({
        collaborationStrengths: toggleArrayItem(
          draft.collaborationStrengths,
          skillId,
        ),
        collaborationImprovements:
          draft.collaborationStrengths.includes(skillId)
            ? draft.collaborationImprovements
            : draft.collaborationImprovements.filter((id) => id !== skillId),
      });
    },
    [
      draft.collaborationStrengths,
      draft.collaborationImprovements,
      toggleArrayItem,
      updateDraft,
    ],
  );

  const toggleCollaborationImprovement = useCallback(
    (skillId: string) => {
      updateDraft({
        collaborationImprovements: toggleArrayItem(
          draft.collaborationImprovements,
          skillId,
        ),
        collaborationStrengths:
          draft.collaborationImprovements.includes(skillId)
            ? draft.collaborationStrengths
            : draft.collaborationStrengths.filter((id) => id !== skillId),
      });
    },
    [
      draft.collaborationImprovements,
      draft.collaborationStrengths,
      toggleArrayItem,
      updateDraft,
    ],
  );

  // Step 7: Summary
  const updateSummary = useCallback(
    (summary: string) => {
      updateDraft({ summary });
    },
    [updateDraft],
  );

  // Step 8: Recommendation
  const updateRecommendation = useCallback(
    (recommendation: boolean) => {
      updateDraft({ recommendation });
    },
    [updateDraft],
  );

  // Navigation
  const setCurrentStep = useCallback(
    (step: number) => {
      updateDraft({ currentStep: step });
    },
    [updateDraft],
  );

  const goToNextStep = useCallback(() => {
    if (draft.currentStep < 8) {
      updateDraft({ currentStep: draft.currentStep + 1 });
    }
  }, [draft.currentStep, updateDraft]);

  const goToPreviousStep = useCallback(() => {
    if (draft.currentStep > 1) {
      updateDraft({ currentStep: draft.currentStep - 1 });
    }
  }, [draft.currentStep, updateDraft]);

  // State management
  const markAsSaved = useCallback(() => {
    setHasUnsavedChanges(false);
    setDraft((prev) => ({ ...prev, lastSaved: new Date().toISOString() }));
  }, []);

  const resetDraft = useCallback(() => {
    setDraft(createEmptyReviewDraft(subjectId));
    setHasUnsavedChanges(false);
  }, [subjectId]);

  const getDraft = useCallback(() => draft, [draft]);

  return {
    ...draft,
    isLoading,
    isSaving,
    hasUnsavedChanges,
    updateSkillRating,
    toggleSkillStrength,
    toggleSkillImprovement,
    updateReliabilityRating,
    toggleReliabilityStrength,
    toggleReliabilityImprovement,
    updateCollaborationRating,
    toggleCollaborationStrength,
    toggleCollaborationImprovement,
    updateSummary,
    updateRecommendation,
    setCurrentStep,
    goToNextStep,
    goToPreviousStep,
    markAsSaved,
    resetDraft,
    getDraft,
  };
}
