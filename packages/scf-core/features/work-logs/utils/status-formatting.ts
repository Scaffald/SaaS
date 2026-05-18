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

export const getStatusBg = (
  status: string | null | undefined,
  theme: "light" | "dark"
): string => {
  if (!status) return colors.bg[theme].muted;

  const STATUS_BG: Record<string, string> = {
    draft: colors.bg[theme].muted,
    pending_verification:
      theme === "dark" ? colors.warning[900] : colors.warning[100],
    verified: theme === "dark" ? colors.success[900] : colors.success[100],
    disputed: theme === "dark" ? colors.error[900] : colors.error[100],
  };

  return STATUS_BG[status] ?? colors.bg[theme].muted;
};
