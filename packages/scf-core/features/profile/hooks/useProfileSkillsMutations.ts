import {
  useAddSkillMultiTaxonomyMutation,
  useRemoveSkillMultiTaxonomyMutation,
  useUpdatePrimaryIndustryMutation,
  useSearchParentSkillsMutation,
} from '@scf/core/utils/profile-skills-sdk-hooks';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@unicornlove/beyond-ui';
import { useCallback, useMemo, useRef } from 'react';
import type { ParentSkill } from '../types/profile-skills-types';
import {
  completeProfileSync,
  failProfileSync,
  resetProfileSyncError,
  startProfileSync,
} from '../utils/profile-sync-store';
import { invalidateProfileQueries } from '../utils/profile-sync';

interface UseProfileSkillsMutationsReturn {
  addSkillMutation: ReturnType<typeof useAddSkillMultiTaxonomyMutation>;
  removeSkillMutation: ReturnType<typeof useRemoveSkillMultiTaxonomyMutation>;
  updateIndustryMutation: ReturnType<typeof useUpdatePrimaryIndustryMutation>;
  searchParentSkillsMutation: ReturnType<typeof useSearchParentSkillsMutation>;
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
  const toast = useToast();
  const queryClient = useQueryClient();

  // Store skill details for optimistic updates (accessed in onMutate)
  const pendingSkillDetailsRef = useRef<ParentSkill | null>(null);

  // Add skill mutation with optimistic updates
  const addSkillMutation = useAddSkillMultiTaxonomyMutation({
    async onMutate(variables) {
      resetProfileSyncError();
      startProfileSync();

      // Cancel outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ['scaffald', 'skills', 'multi-taxonomy'] });

      // Snapshot previous value for rollback
      const previousSkills = queryClient.getQueryData(['scaffald', 'skills', 'multi-taxonomy']);

      // Get skill details from ref (set by selectSkill before mutation)
      const skillDetails = pendingSkillDetailsRef.current;

      // Optimistically update cache
      if (skillDetails) {
        queryClient.setQueryData(['scaffald', 'skills', 'multi-taxonomy'], (old: unknown) => {
          if (!old || typeof old !== 'object' || !('skills' in old)) return old;
          const tempId = `temp-${Date.now()}`;
          const newSkill = {
            id: tempId,
            skill_details: {
              name: skillDetails.name,
              display_code: skillDetails.code,
              hierarchy_level: skillDetails.depth,
              code: skillDetails.code,
            },
            proficiency_level: variables.proficiencyLevel,
            csi_skill_id: variables.taxonomy === 'csi' ? variables.skillId : null,
            onet_occupation_id: variables.taxonomy === 'onet' ? variables.skillId : null,
            created_at: new Date().toISOString(),
            skill_taxonomy: variables.taxonomy,
            years_experience: variables.yearsExperience || null,
            verified: false,
            notes: variables.notes || null,
          };
          return {
            ...old,
            skills: [newSkill, ...((old as { skills: unknown[] }).skills || [])],
          };
        });
        // Clear ref after use
        pendingSkillDetailsRef.current = null;
      }

      return { previousSkills };
    },
    onError: (error, _variables, context) => {
      // Rollback optimistic update
      if (context?.previousSkills !== undefined) {
        queryClient.setQueryData(['scaffald', 'skills', 'multi-taxonomy'], context.previousSkills);
      }
      // Clear ref on error
      pendingSkillDetailsRef.current = null;
      toast.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to add skill',
        variant: 'error',
      });
      failProfileSync();
    },
    onSuccess: async () => {
      toast.show({
        title: 'Skill Added',
        message: 'Skill has been added to your profile!',
      });
      // Invalidate to get real server data (replaces temporary ID)
      await queryClient.invalidateQueries({ queryKey: ['scaffald', 'skills', 'multi-taxonomy'] });
      completeProfileSync();
    },
    onSettled: (_data, error) => {
      if (!error) {
        completeProfileSync();
      }
    },
  });

  // Remove skill mutation
  const removeSkillMutation = useRemoveSkillMultiTaxonomyMutation({
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['scaffald', 'skills', 'multi-taxonomy'] });
    },
  });

  // Update primary industry mutation
  const updateIndustryMutation = useUpdatePrimaryIndustryMutation({
    onMutate: () => {
      resetProfileSyncError();
      startProfileSync();
    },
    onSuccess: async () => {
      toast.show({
        title: 'Industry Updated',
        message: 'Your primary industry has been updated',
      });
      await invalidateProfileQueries(queryClient);
    },
    onError: (error) => {
      toast.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to update industry',
        variant: 'error',
      });
      failProfileSync();
    },
    onSettled: (_data, error) => {
      if (!error) {
        completeProfileSync();
      }
    },
  });

  // Search parent skills mutation (cascading approach)
  const searchParentSkillsMutation = useSearchParentSkillsMutation();

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
