/**
 * Adaptive backoff module for Procore sync scheduling.
 *
 * Computes the next sync interval based on whether changes were detected
 * during the previous sync cycle:
 *   - Changes detected   -> multiply by cooldownMultiplier (speed up polling)
 *   - No changes detected -> multiply by backoffMultiplier  (slow down polling)
 *
 * The resulting interval is always clamped to [minInterval, maxInterval].
 *
 * All thresholds are configurable via environment variables, with sensible
 * defaults for production use.
 */

const DEFAULT_MIN_INTERVAL = 15; // minutes
const DEFAULT_MAX_INTERVAL = 10080; // 7 days in minutes
const DEFAULT_BACKOFF_MULTIPLIER = 2;
const DEFAULT_COOLDOWN_MULTIPLIER = 0.5;
const DEFAULT_MANUAL_DEBOUNCE_MINS = 5;

export function getConfig() {
  return {
    minInterval:
      Number(process.env.PROCORE_SYNC_MIN_INTERVAL_MINUTES) ||
      DEFAULT_MIN_INTERVAL,
    maxInterval:
      Number(process.env.PROCORE_SYNC_MAX_INTERVAL_MINUTES) ||
      DEFAULT_MAX_INTERVAL,
    backoffMultiplier:
      Number(process.env.PROCORE_SYNC_BACKOFF_MULTIPLIER) ||
      DEFAULT_BACKOFF_MULTIPLIER,
    cooldownMultiplier:
      Number(process.env.PROCORE_SYNC_COOLDOWN_MULTIPLIER) ||
      DEFAULT_COOLDOWN_MULTIPLIER,
    manualDebounceMins:
      Number(process.env.PROCORE_SYNC_MANUAL_DEBOUNCE_MINUTES) ||
      DEFAULT_MANUAL_DEBOUNCE_MINS,
  };
}

/**
 * Compute next sync interval.
 *
 * Changes detected  -> multiply by cooldownMultiplier (speed up)
 * No changes        -> multiply by backoffMultiplier  (slow down)
 *
 * Result is clamped to [minInterval, maxInterval].
 */
export function computeNextInterval(
  currentIntervalMinutes: number,
  changesDetected: boolean,
): number {
  const { minInterval, maxInterval, backoffMultiplier, cooldownMultiplier } =
    getConfig();

  const multiplier = changesDetected ? cooldownMultiplier : backoffMultiplier;
  const raw = currentIntervalMinutes * multiplier;

  return Math.min(maxInterval, Math.max(minInterval, raw));
}

/**
 * Check if a manual sync is allowed (debounce guard).
 *
 * Returns true when either no previous manual sync has occurred or enough
 * time has elapsed since the last one.
 */
export function canManualSync(lastManualSyncAt: Date | null): boolean {
  if (lastManualSyncAt === null) {
    return true;
  }
  const { manualDebounceMins } = getConfig();
  const elapsedMs = Date.now() - lastManualSyncAt.getTime();
  return elapsedMs >= manualDebounceMins * 60 * 1000;
}

/**
 * Minutes remaining until a manual sync is allowed.
 *
 * Returns 0 when sync is already permitted (no previous sync or debounce
 * window has elapsed).
 */
export function minutesUntilManualSync(lastManualSyncAt: Date | null): number {
  if (lastManualSyncAt === null) {
    return 0;
  }
  const { manualDebounceMins } = getConfig();
  const elapsedMs = Date.now() - lastManualSyncAt.getTime();
  const remainingMs = manualDebounceMins * 60 * 1000 - elapsedMs;

  if (remainingMs <= 0) {
    return 0;
  }
  return remainingMs / (60 * 1000);
}
