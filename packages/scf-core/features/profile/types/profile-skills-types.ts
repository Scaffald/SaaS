/**
 * Profile Skills Types
 * Shared types for profile skills feature
 */

/**
 * Parent skill from search (multi-taxonomy format)
 * Now includes hierarchy information for CSI skills
 */
export interface ParentSkill {
  id: string;
  name: string;
  code: string;
  depth: number;
  childCount?: number;
  parentId?: string | null;
  parentName?: string | null;
  hierarchyPath?: string | null;
}

/**
 * Pending search state
 */
export interface PendingSearch {
  id: string;
  term: string;
  taxonomy: 'csi' | 'onet' | 'both';
}

/**
 * Profile industry
 */
export interface ProfileIndustry {
  id: string;
  name: string;
  slug: string;
}
