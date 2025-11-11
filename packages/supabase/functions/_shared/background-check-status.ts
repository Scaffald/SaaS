import { z } from "zod";

import { backgroundCheckStatusEnum } from "./background-check-schemas.ts";

export type BackgroundCheckStatus = z.infer<typeof backgroundCheckStatusEnum>;

export const BACKGROUND_CHECK_BASE_COLUMNS =
  "id, status, status_history, provider_check_id, summary, findings, component_statuses, metadata, completed_at, expires_at, estimated_completion_date, updated_at";

export const BACKGROUND_CHECK_SYNC_COLUMNS = `${BACKGROUND_CHECK_BASE_COLUMNS}, user_id, requested_by_user_id, package:background_check_packages(display_name, slug)`;

const providerStatusMap: Record<string, BackgroundCheckStatus> = {
  pending: "pending",
  queued: "pending",
  invited: "invited",
  awaiting_invitation: "invited",
  submitted: "submitted",
  processing: "in_progress",
  "in-progress": "in_progress",
  in_progress: "in_progress",
  under_review: "under_review",
  review: "under_review",
  complete_clear: "completed_clear",
  complete_consider: "completed_consider",
  complete_not_clear: "completed_not_clear",
  partially_complete: "partially_completed",
  partial: "partially_completed",
  failed: "failed",
  cancelled: "cancelled",
  canceled: "cancelled",
  disputed: "disputed",
  expired: "expired",
  refunded: "refunded",
};

const terminalStatuses = new Set<BackgroundCheckStatus>([
  "completed_clear",
  "completed_consider",
  "completed_not_clear",
  "failed",
  "cancelled",
  "disputed",
  "expired",
  "refunded",
]);

export function mapProviderStatus(status: string | null | undefined): BackgroundCheckStatus | null {
  if (!status) return null;
  const normalised = status.toLowerCase();
  if (providerStatusMap[normalised]) {
    return providerStatusMap[normalised];
  }
  if (normalised.startsWith("complete") || normalised.startsWith("completed")) {
    return "completed_clear";
  }
  if (normalised.includes("progress")) {
    return "in_progress";
  }
  return null;
}

export function shouldSyncStatus(status: BackgroundCheckStatus): boolean {
  return !terminalStatuses.has(status);
}

export function appendStatusHistory(
  history: unknown,
  entry: Record<string, unknown>,
): unknown[] {
  const existing = Array.isArray(history) ? [...history] : [];
  existing.push(entry);
  return existing;
}

export function mergeMetadata(
  existing: unknown,
  patch: Record<string, unknown>,
): Record<string, unknown> {
  if (existing && typeof existing === "object" && !Array.isArray(existing)) {
    return { ...(existing as Record<string, unknown>), ...patch };
  }
  return { ...patch };
}


