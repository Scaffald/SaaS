import { useState } from "react";
import type { OnetElementRating } from "../data/mock-onet-elements";

interface OnetReviewDraft {
  subjectId: string;
  onetRatings: Record<string, OnetElementRating>; // key is element ID
  summary: string;
  recommendation: boolean | null;
  currentStep: number;
}

export function useOnetReviewDraft({ subjectId }: { subjectId: string }) {
  const [draft, setDraft] = useState<OnetReviewDraft>({
    subjectId,
    onetRatings: {},
    summary: "",
    recommendation: null,
    currentStep: 1,
  });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const updateRating = (rating: OnetElementRating) => {
    setDraft((prev) => ({
      ...prev,
      onetRatings: {
        ...prev.onetRatings,
        [rating.elementId]: rating,
      },
    }));
    setHasUnsavedChanges(true);
  };

  const updateSummary = (summary: string) => {
    setDraft((prev) => ({ ...prev, summary }));
    setHasUnsavedChanges(true);
  };

  const updateRecommendation = (recommendation: boolean) => {
    setDraft((prev) => ({ ...prev, recommendation }));
    setHasUnsavedChanges(true);
  };

  const goToNextStep = () => {
    setDraft((prev) => ({ ...prev, currentStep: prev.currentStep + 1 }));
    setHasUnsavedChanges(true);
  };

  const goToPreviousStep = () => {
    setDraft((prev) => ({
      ...prev,
      currentStep: Math.max(1, prev.currentStep - 1),
    }));
  };

  const goToStep = (step: number) => {
    setDraft((prev) => ({ ...prev, currentStep: step }));
  };

  const markAsSaved = () => {
    setHasUnsavedChanges(false);
  };

  const getDraft = () => draft;

  // Get category completion stats
  const getCategoryStats = (elementIds: string[]) => {
    const rated =
      elementIds.filter((id) => draft.onetRatings[id]?.rating > 0).length;
    return {
      total: elementIds.length,
      rated,
      percentage: elementIds.length > 0 ? (rated / elementIds.length) * 100 : 0,
    };
  };

  // Get all strengths and improvements
  const getStrengthsAndImprovements = () => {
    const strengths: OnetElementRating[] = [];
    const improvements: OnetElementRating[] = [];

    for (const rating of Object.values(draft.onetRatings)) {
      if (rating.rating >= 3) {
        if (rating.isStrength) {
          strengths.push(rating);
        } else {
          improvements.push(rating);
        }
      }
    }

    return { strengths, improvements };
  };

  return {
    // State
    currentStep: draft.currentStep,
    onetRatings: draft.onetRatings,
    summary: draft.summary,
    recommendation: draft.recommendation,
    hasUnsavedChanges,

    // Actions
    updateRating,
    updateSummary,
    updateRecommendation,
    goToNextStep,
    goToPreviousStep,
    goToStep,
    markAsSaved,
    getDraft,

    // Helpers
    getCategoryStats,
    getStrengthsAndImprovements,
  };
}
