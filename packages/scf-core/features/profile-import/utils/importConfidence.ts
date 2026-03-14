export type ConfidenceLevel = "high" | "medium" | "low";

export interface ConfidenceBadgeConfig {
  level: ConfidenceLevel;
  label: string;
  description: string;
  colorToken: string;
}

export const CONFIDENCE_BADGES: Record<ConfidenceLevel, ConfidenceBadgeConfig> =
  {
    high: {
      level: "high",
      label: "High Confidence",
      description: "Looks great—feel free to import as-is.",
      colorToken: "#30a46c",
    },
    medium: {
      level: "medium",
      label: "Review Suggested",
      description: "We recommend double-checking before importing.",
      colorToken: "#f5d90a",
    },
    low: {
      level: "low",
      label: "Needs Review",
      description: "Please confirm or edit the details before importing.",
      colorToken: "#e5484d",
    },
  };

export function toConfidenceLevel(score?: number | null): ConfidenceLevel {
  if (score === undefined || score === null) return "medium";
  if (score >= 0.8) return "high";
  if (score >= 0.6) return "medium";
  return "low";
}
