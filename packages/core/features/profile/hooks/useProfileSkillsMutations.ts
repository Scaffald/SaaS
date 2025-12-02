import { api } from "@app/core/utils/api";
import { useToastController } from "@tamagui/toast";
import { useCallback, useMemo, useRef } from "react";
import type { ParentSkill } from "../types/profile-skills-types.ts";
import {
  completeProfileSync,
  failProfileSync,
  resetProfileSyncError,
  startProfileSync,
} from "../utils/profile-sync-store.ts";
import { invalidateProfileQueries } from "../utils/profile-sync.ts";

interface UseProfileSkillsMutationsReturn {
  addSkillMutation: ReturnType<
    typeof api.profile.skillsMultiTaxonomy.addSkill.useMutation
  >;
  removeSkillMutation: ReturnType<
    typeof api.profile.skillsMultiTaxonomy.removeSkill.useMutation
  >;
  updateIndustryMutation: ReturnType<
    typeof api.profile.skillsMultiTaxonomy.updatePrimaryIndustry.useMutation
  >;
  searchParentSkillsMutation: ReturnType<
    typeof api.profile.skills.searchParentSkills.useMutation
  >;
  selectSkill: (
    skillId: string,
    proficiency: number,
    taxonomy: string,
    skillDetails?: ParentSkill,
  ) => Promise<void>;
  isAddingSkill: boolean;
  isRemovingSkill: boolean;
  isSearchingSkills: boolean;
}

/**
 * Hook for managing profile skills mutations
 * Handles adding, removing skills, and updating primary industry
 */
export function useProfileSkillsMutations(): UseProfileSkillsMutationsReturn {
  const toast = useToastController();
  const utils = api.useContext();

  // Store skill details for optimistic updates (accessed in onMutate)
  const pendingSkillDetailsRef = useRef<ParentSkill | null>(null);

  // Add skill mutation with optimistic updates
  const addSkillMutation = api.profile.skillsMultiTaxonomy.addSkill.useMutation(
    {
      async onMutate(variables: {
        taxonomy: "csi" | "onet";
        skillId: string;
        proficiencyLevel: number;
      }) {
        resetProfileSyncError();
        startProfileSync();

        // Cancel outgoing refetches to avoid overwriting optimistic update
        await utils.profile.skillsMultiTaxonomy.getUserSkills.cancel();

        // Snapshot previous value for rollback
        const previousSkills = utils.profile.skillsMultiTaxonomy.getUserSkills
          .getData();

        // Get skill details from ref (set by selectSkill before mutation)
        const skillDetails = pendingSkillDetailsRef.current;

        // Optimistically update cache
        if (skillDetails) {
          utils.profile.skillsMultiTaxonomy.getUserSkills.setData(
            undefined,
            (old) => {
              if (!old) return old;
              const tempId = `temp-${Date.now()}`;
              const newSkill = {
                id: tempId,
                skill_details: {
                  name: skillDetails.name,
                  display_code: skillDetails.code,
                  hierarchy_level: skillDetails.depth,
                },
                proficiency_level: variables.proficiencyLevel,
                csi_skill_id: variables.taxonomy === "csi"
                  ? variables.skillId
                  : null,
                onet_occupation_id: variables.taxonomy === "onet"
                  ? variables.skillId
                  : null,
                created_at: new Date().toISOString(),
              };
              return {
                ...old,
                skills: [newSkill, ...(old.skills || [])],
              };
            },
          );
          // Clear ref after use
          pendingSkillDetailsRef.current = null;
        }

        return { previousSkills };
      },
      onError: (
        error: unknown,
        _variables: unknown,
        context: { previousSkills?: unknown } | undefined,
      ) => {
        // Rollback optimistic update
        if (context?.previousSkills !== undefined) {
          utils.profile.skillsMultiTaxonomy.getUserSkills.setData(
            undefined,
            context.previousSkills as never,
          );
        }
        // Clear ref on error
        pendingSkillDetailsRef.current = null;
        toast.show("Error", {
          message: error instanceof Error
            ? error.message
            : "Failed to add skill",
        });
        failProfileSync();
      },
      onSuccess: async () => {
        toast.show("Skill Added", {
          message: "Skill has been added to your profile!",
        });
        // Invalidate to get real server data (replaces temporary ID)
        await utils.profile.skillsMultiTaxonomy.getUserSkills.invalidate();
        completeProfileSync();
      },
      onSettled: (_data: unknown, error: unknown) => {
        if (!error) {
          completeProfileSync();
        }
      },
    },
  );

  // Remove skill mutation
  const removeSkillMutation = api.profile.skillsMultiTaxonomy.removeSkill
    .useMutation({
      onSuccess: async () => {
        await utils.profile.skillsMultiTaxonomy.getUserSkills.invalidate();
      },
    });

  // Update primary industry mutation
  const updateIndustryMutation = api.profile.skillsMultiTaxonomy
    .updatePrimaryIndustry.useMutation({
      onMutate: () => {
        resetProfileSyncError();
        startProfileSync();
      },
      onSuccess: async () => {
        toast.show("Industry Updated", {
          message: "Your primary industry has been updated",
        });
        await invalidateProfileQueries(utils);
      },
      onError: (error: unknown) => {
        toast.show("Error", {
          message: error instanceof Error
            ? error.message
            : "Failed to update industry",
        });
        failProfileSync();
      },
      onSettled: (_data: unknown, error: unknown) => {
        if (!error) {
          completeProfileSync();
        }
      },
    });

  // Search parent skills mutation (cascading approach)
  const searchParentSkillsMutation = api.profile.skills.searchParentSkills
    .useMutation();

  // Select skill wrapper (stores skill details before mutation)
  // Use ref to access mutation directly to avoid dependency issues
  const addSkillMutationRef = useRef(addSkillMutation);
  addSkillMutationRef.current = addSkillMutation;

  const selectSkill = useCallback(
    async (
      skillId: string,
      proficiency: number,
      taxonomy: string,
      skillDetails?: ParentSkill,
    ) => {
      // Store skill details in ref for optimistic update
      if (skillDetails) {
        pendingSkillDetailsRef.current = skillDetails;
      }
      await addSkillMutationRef.current.mutateAsync({
        taxonomy: taxonomy as "csi" | "onet",
        skillId,
        proficiencyLevel: proficiency,
      });
    },
    [], // No dependencies - use ref to access mutation
  );

  // Return object with mutations and callbacks
  // Mutations are stable from React Query, so this should be fine
  // But to be safe, we memoize the stable parts and only recompute isPending values
  const stableMutations = useMemo(
    () => ({
      addSkillMutation,
      removeSkillMutation,
      updateIndustryMutation,
      searchParentSkillsMutation,
      selectSkill,
    }),
    [
      addSkillMutation,
      removeSkillMutation,
      updateIndustryMutation,
      searchParentSkillsMutation,
      selectSkill,
    ],
  );

  // Return object with isPending values computed fresh each render
  // but mutations and callbacks are memoized
  return {
    ...stableMutations,
    isAddingSkill: addSkillMutation.isPending,
    isRemovingSkill: removeSkillMutation.isPending,
    isSearchingSkills: searchParentSkillsMutation.isPending,
  };
}
