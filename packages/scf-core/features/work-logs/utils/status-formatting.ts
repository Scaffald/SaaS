import { colors } from "@scaffald/ui/tokens";

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  pending_verification: "Awaiting Verification",
  verified: "Verified",
  disputed: "Disputed",
};

export const getStatusLabel = (status: string | null | undefined): string => {
  if (!status) return "Unknown";
  return STATUS_LABELS[status] ?? status.replace(/_/g, " ");
};

export const getStatusColor = (
  status: string | null | undefined,
  theme: "light" | "dark"
): string => {
  if (!status) {
    return colors.text[theme].secondary;
  }

  const STATUS_COLORS: Record<string, string> = {
    draft: colors.text[theme].tertiary,
    pending_verification: colors.fg[theme].warning,
    verified: colors.fg[theme].success,
    disputed: colors.fg[theme].error,
  };

  return STATUS_COLORS[status] ?? colors.text[theme].tertiary;
};
