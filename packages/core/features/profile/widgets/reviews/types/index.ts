/**
 * Type definitions for review analytics and visualization components
 */

export interface ReviewAnalytics {
  overall: {
    totalReviews: number;
    recommendCount: number;
    notRecommendCount: number;
    recommendPercentage: number;
  };
  skills: SkillRating[];
  categories: CategoryRating[];
  tags: {
    strengths: TagData[];
    improvements: TagData[];
  };
  timeline: TimelineData[];
}

export interface SkillRating {
  skillId: string;
  skillName: string;
  averageRating: number;
  frequency: number;
}

export interface CategoryRating {
  category: string;
  averageRating: number;
  frequency: number;
}

export interface TagData {
  name: string;
  count: number;
  category: string;
}

export interface TimelineData {
  month: string;
  count: number;
  avgRating: number;
  totalRating: number;
}

export interface ReviewWidgetProps {
  userId: string;
  showEdit?: boolean;
  variant?: "full" | "compact";
}

export type ReviewTab = "overview" | "skills" | "soft-skills" | "reviews";
