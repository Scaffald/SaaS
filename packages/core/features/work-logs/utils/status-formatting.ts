const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  pending_verification: "Awaiting Verification",
  verified: "Verified",
  disputed: "Disputed",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "$color10",
  pending_verification: "$orange10",
  verified: "$green10",
  disputed: "$red10",
};

export const getStatusLabel = (status: string | null | undefined): string => {
  if (!status) return "Unknown";
  return STATUS_LABELS[status] ?? status.replace(/_/g, " ");
};

export const getStatusColor = (status: string | null | undefined): string => {
  if (!status) {
    return "$gray10";
  }
  return STATUS_COLORS[status] ?? "$color10";
};

