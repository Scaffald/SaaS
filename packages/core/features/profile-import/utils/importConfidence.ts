import type { GetThemeValueForKey } from "@unicornlove/ui";

export type ConfidenceLevel = "high" | "medium" | "low";

export interface ConfidenceBadgeConfig {
  level: ConfidenceLevel;
  label: string;
  description: string;
  colorToken: GetThemeValueForKey<"color">;
}

export const CONFIDENCE_BADGES: Record<ConfidenceLevel, ConfidenceBadgeConfig> =
  {
    high: {
      level: "high",
      label: "High Confidence",
      description: "Looks great—feel free to import as-is.",
      colorToken: "$green9",
    },
    medium: {
      level: "medium",
      label: "Review Suggested",
      description: "We recommend double-checking before importing.",
      colorToken: "$yellow9",
    },
    low: {
      level: "low",
      label: "Needs Review",
      description: "Please confirm or edit the details before importing.",
      colorToken: "$red9",
    },
  };

export function toConfidenceLevel(score?: number | null): ConfidenceLevel {
  if (score === undefined || score === null) return "medium";
  if (score >= 0.8) return "high";
  if (score >= 0.6) return "medium";
  return "low";
}
