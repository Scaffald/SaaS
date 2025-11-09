import { useMemo } from "react";
import { api } from "@app/core/utils/api";
import type { ProfileWizardStepId } from "@app/supabase/client-types";
import { resolveSectionMetadata } from "../profile-completion/constants/sectionMetadata";

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
  const { data: status, isLoading } = api.profile.getStatus
    .useQuery(undefined, {
      staleTime: 5 * 60 * 1000, // 5 minutes cache
    });

  const completionData = useMemo((): ProfileCompletionData | null => {
    if (!status) return null;

    const items: ChecklistItem[] = status.sectionProgress.map(
      (section) => {
        const metadata = resolveSectionMetadata(
          section.id as ProfileWizardStepId,
        );
        return {
          id: section.id,
          title: section.title,
          description: metadata.description,
          complete: section.completed,
          actionRoute: metadata.route,
        };
      },
    );

    const totalComplete = status.sectionProgress.filter((section) =>
      section.completed
    ).length;
    const totalItems = status.sectionProgress.length;

    return {
      items,
      completionPercentage: status.completionPercentage,
      totalComplete,
      totalItems,
    };
  }, [status]);

  return {
    completionData,
    isLoading,
  };
};
