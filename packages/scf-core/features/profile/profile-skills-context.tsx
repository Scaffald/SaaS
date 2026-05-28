import { useTrackEngagementMutation } from "@scf/core/utils/engagement-sdk-hooks";
import { useToast } from "@scaffald/ui";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ParentSkill, PendingSearch } from "./types/profile-skills-types";
import {
  getSkillGuidanceForIndustry,
  type SkillSuggestion,
} from "./constants/skill-guidance";
import { useProfileSkillsQueries } from "./hooks/useProfileSkillsQueries";
import { useProfileSkillsMutations } from "./hooks/useProfileSkillsMutations";

const createPendingSearchId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const _DEFAULT_INDUSTRY_SLUG = "construction";

interface ProfileSkillsContextValue {
  isLoadingIndustries: boolean;
  industries: ReturnType<typeof useProfileSkillsQueries>["industries"];
  selectedIndustryId: string;
  selectedIndustrySlug: string;
  industryDisplayName: string;
  handleIndustryChange: (industryId: string) => Promise<void>;
  skillGuidance: ReturnType<typeof getSkillGuidanceForIndustry>;
  skillCount: number;
  hasMinimumSkills: boolean;
  completionPercent: number;
  handleSuggestionSelect: (suggestion: SkillSuggestion) => void;
  pendingSearch: PendingSearch | null;
  clearPendingSearch: () => void;
  searchSkills: (query: string, taxonomies: string[]) => Promise<ParentSkill[]>;
  selectSkill: (
    skillId: string,
    proficiency: number,
    taxonomy: string,
    skillDetails?: ParentSkill
  ) => Promise<void>;
  isSearchingSkills: boolean;
  existingSkillIds: string[];
  isAddingSkill: boolean;
  isRemovingSkill: boolean;
}

const ProfileSkillsContext = createContext<ProfileSkillsContextValue | null>(
  null
);

interface ProfileSkillsProviderProps {
  children: ReactNode;
}

export function ProfileSkillsProvider({
  children,
}: ProfileSkillsProviderProps) {
  const toast = useToast();
  const [pendingSearch, setPendingSearch] = useState<PendingSearch | null>(
    null
  );

  // Use extracted hooks
  const queries = useProfileSkillsQueries();
  const mutations = useProfileSkillsMutations();

  // Destructure stable values to prevent infinite loops
  // Extract callbacks separately to ensure they have stable references
  const {
    isLoadingIndustries,
    industries,
    selectedIndustryId,
    selectedIndustrySlug,
    existingSkillIds,
    skillCount,
    hasMinimumSkills,
    completionPercent,
    setSelectedIndustryId,
  } = queries;

  // Extract mutations and callbacks - use refs to access mutations to prevent recreation
  const updateIndustryMutationRef = useRef(mutations.updateIndustryMutation);
  updateIndustryMutationRef.current = mutations.updateIndustryMutation;

  const searchParentSkillsMutationRef = useRef(
    mutations.searchParentSkillsMutation
  );
  searchParentSkillsMutationRef.current = mutations.searchParentSkillsMutation;

  const selectSkill = mutations.selectSkill;
  const isSearchingSkills = mutations.isSearchingSkills;
  const isAddingSkill = mutations.isAddingSkill;
  const isRemovingSkill = mutations.isRemovingSkill;

  // Handle industry change - use ref to access mutation to prevent callback recreation
  // Prevent infinite loops by only updating if value actually changed
  const handleIndustryChange = useCallback(
    async (industryId: string) => {
      // Don't do anything if the value hasn't changed
      if (industryId === selectedIndustryId) {
        return;
      }

      try {
        // Update state first for immediate UI feedback
        setSelectedIndustryId(industryId);
        // Then update on server
        await updateIndustryMutationRef.current.mutateAsync({
          industryId,
        });
      } catch (error) {
        // Rollback state on error
        console.error("Failed to update industry:", error);
        // Optionally rollback to previous value
        // But for now, just let the error be handled by the mutation's onError
      }
    },
    [setSelectedIndustryId, selectedIndustryId] // Include selectedIndustryId to check for changes
  );

  // Handle suggestion select
  const handleSuggestionSelect = useCallback(
    (suggestion: SkillSuggestion) => {
      const searchTerm = suggestion.searchTerm ?? suggestion.label;
      setPendingSearch({
        id: createPendingSearchId(),
        term: searchTerm,
        taxonomy: suggestion.taxonomy,
      });
      toast.show({
        title: "Suggestion Applied",
        message: `Searching for "${suggestion.label}"...`,
        duration: 2500,
      });
    },
    [toast]
  );

  const clearPendingSearch = useCallback(() => {
    setPendingSearch(null);
  }, []);

  // Track skill searches for engagement analytics
  const trackEventMutation = useTrackEngagementMutation();

  // Search skills function - use cascading approach (searchParentSkills)
  const searchSkills = useCallback(
    async (query: string, taxonomies: string[]): Promise<ParentSkill[]> => {
      if (!selectedIndustryId || taxonomies.length === 0 || !query.trim()) {
        return [];
      }

      try {
        // Use searchParentSkills (cascading approach). Pass the selected
        // taxonomies (csi/onet) through so O*NET occupation search works.
        const result = await searchParentSkillsMutationRef.current.mutateAsync({
          query,
          industryId: selectedIndustryId,
          limit: 20,
          taxonomies: taxonomies as Array<"csi" | "onet">,
        });

        // Map results to ParentSkill format (now includes hierarchy information)
        // Cast to unknown[] first because the SDK type is minimal but the API returns extended fields
        const skills = (
          (result.skills || []) as unknown as Array<{
            skill_id: string;
            skill_name: string;
            csi_display: string | null;
            csi_code: string[] | null;
            child_count: number;
            parent_id: string | null;
            parent_name: string | null;
            depth: number;
            hierarchy_path: string | null;
          }>
        ).map((skill) => ({
          id: skill.skill_id,
          name: skill.skill_name,
          code: skill.csi_display || skill.skill_id,
          depth: skill.depth || 0,
          childCount: skill.child_count,
          parentId: skill.parent_id || null,
          parentName: skill.parent_name || null,
          hierarchyPath: skill.hierarchy_path || skill.skill_name,
        }));

        // Track skill search for engagement analytics (only if results exist)
        if (skills.length > 0) {
          try {
            const taxonomyList = taxonomies.join(",");
            trackEventMutation.mutate({
              eventType: "search",
              targetType: undefined,
              targetId: undefined,
              metadata: {
                query: query.trim(),
                results_count: skills.length,
                taxonomy: taxonomyList,
                industry_id: selectedIndustryId,
              },
            });
          } catch (error) {
            // Silent error handling - don't impact search functionality
            console.warn("Failed to track skill search:", error);
          }
        }

        return skills;
      } catch (error) {
        console.error("Search error:", error);
        return [];
      }
    },
    [selectedIndustryId, trackEventMutation] // Only depends on primitive values
  );

  // Derived state
  const industryDisplayName = useMemo(
    () =>
      selectedIndustrySlug
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" "),
    [selectedIndustrySlug]
  );

  const skillGuidance = useMemo(
    () => getSkillGuidanceForIndustry(selectedIndustrySlug),
    [selectedIndustrySlug]
  );

  // Memoize context value - use primitive values and stable callbacks
  // Boolean values like isAddingSkill might change frequently but shouldn't cause loops
  const value: ProfileSkillsContextValue = useMemo(
    () => ({
      isLoadingIndustries,
      industries,
      selectedIndustryId,
      selectedIndustrySlug,
      industryDisplayName,
      handleIndustryChange,
      skillGuidance,
      skillCount,
      hasMinimumSkills,
      completionPercent,
      handleSuggestionSelect,
      pendingSearch,
      clearPendingSearch,
      searchSkills,
      selectSkill,
      isSearchingSkills,
      existingSkillIds,
      isAddingSkill,
      isRemovingSkill,
    }),
    [
      isLoadingIndustries,
      industries,
      selectedIndustryId,
      selectedIndustrySlug,
      industryDisplayName,
      handleIndustryChange,
      skillGuidance,
      skillCount,
      hasMinimumSkills,
      completionPercent,
      handleSuggestionSelect,
      pendingSearch,
      clearPendingSearch,
      searchSkills,
      selectSkill,
      isSearchingSkills,
      existingSkillIds,
      // Include boolean values - they should only change when mutations start/stop
      // If they're causing loops, something else is triggering mutations repeatedly
      isAddingSkill,
      isRemovingSkill,
    ]
  );

  return (
    <ProfileSkillsContext.Provider value={value}>
      {children}
    </ProfileSkillsContext.Provider>
  );
}

export function useProfileSkillsContext(): ProfileSkillsContextValue {
  const context = useContext(ProfileSkillsContext);
  if (!context) {
    throw new Error(
      "useProfileSkillsContext must be used within a ProfileSkillsProvider"
    );
  }

  return context;
}
