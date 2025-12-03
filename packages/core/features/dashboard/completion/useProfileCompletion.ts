import { api } from "@app/core/utils/api";
import type { ProfileWizardStepId } from "@app/supabase/client-types";
import { useMemo } from "react";
import { resolveSectionMetadata } from "../../profile-completion/constants/sectionMetadata";

type SectionProgressSummary = {
  id: string;
  title: string;
  completed: boolean;
};

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  complete: boolean;
  actionRoute?: string;
  actionLabel?: string;
}

export interface ProfileCompletionData {
  items: ChecklistItem[];
  completionPercentage: number;
  totalComplete: number;
  totalItems: number;
}

export const useProfileCompletion = () => {
  const { data: status, isLoading } = api.profile.completion.getStatus.useQuery(
    undefined,
    {
      staleTime: 5 * 60 * 1000, // 5 minutes cache
    },
  );

  const completionData = useMemo((): ProfileCompletionData | null => {
    if (!status) return null;

    const items: ChecklistItem[] = status.sectionProgress.map(
      (section: SectionProgressSummary): ChecklistItem => {
        const sectionId = section.id as ProfileWizardStepId;
        const metadata = resolveSectionMetadata(sectionId);

        return {
          id: sectionId,
          title: section.title,
          description: metadata.description,
          complete: section.completed,
          actionRoute: metadata.route,
        };
      },
    );

    const totalComplete = status.sectionProgress.filter(
      (section: SectionProgressSummary) => section.completed,
    ).length;
    const totalItems = status.sectionProgress.length;

    return {
      items,
      completionPercentage: status.completionPercentage ?? 0,
      totalComplete,
      totalItems,
    };
  }, [status]);

  return {
    completionData,
    isLoading,
  };
};
