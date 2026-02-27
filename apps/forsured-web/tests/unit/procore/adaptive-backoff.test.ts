/**
 * Unit tests for the Procore adaptive backoff module.
 *
 * Validates that sync intervals scale up (backoff) when no changes are
 * detected and scale down (cooldown) when changes are found, with
 * clamping to configurable min/max bounds. Also covers the manual-sync
 * debounce helpers.
 *
 * Uses vi.resetModules() + dynamic import() so each test picks up
 * its own set of environment variables.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Env var keys used by the module under test
const ENV_KEYS = [
  'PROCORE_SYNC_MIN_INTERVAL_MINUTES',
  'PROCORE_SYNC_MAX_INTERVAL_MINUTES',
  'PROCORE_SYNC_BACKOFF_MULTIPLIER',
  'PROCORE_SYNC_COOLDOWN_MULTIPLIER',
  'PROCORE_SYNC_MANUAL_DEBOUNCE_MINUTES',
] as const;

describe('procore/adaptive-backoff', () => {
  const savedEnv: Record<string, string | undefined> = {};

  beforeEach(() => {
    // Snapshot current env values so we can restore them
    for (const key of ENV_KEYS) {
      savedEnv[key] = process.env[key];
    }
    // Clear all relevant env vars so defaults apply unless a test sets them
    for (const key of ENV_KEYS) {
      delete process.env[key];
    }
    vi.resetModules();
  });

  afterEach(() => {
    // Restore original env values
    for (const key of ENV_KEYS) {
      if (savedEnv[key] !== undefined) {
        process.env[key] = savedEnv[key];
      } else {
        delete process.env[key];
      }
    }
    vi.resetModules();
  });

  // ----------------------------------------------------------------
  // computeNextInterval
  // ----------------------------------------------------------------

  describe('computeNextInterval', () => {
    it('halves interval when changes are detected (default cooldown multiplier 0.5)', async () => {
      const { computeNextInterval } = await import(
        '@/server/lib/procore/adaptive-backoff'
      );
      expect(computeNextInterval(60, true)).toBe(30);
    });

    it('doubles interval when no changes are detected (default backoff multiplier 2)', async () => {
      const { computeNextInterval } = await import(
        '@/server/lib/procore/adaptive-backoff'
      );
      expect(computeNextInterval(60, false)).toBe(120);
    });

    it('clamps to minimum interval when result would be below min', async () => {
      const { computeNextInterval } = await import(
        '@/server/lib/procore/adaptive-backoff'
      );
      // 15 * 0.5 = 7.5, but min is 15
      expect(computeNextInterval(15, true)).toBe(15);
    });

    it('clamps to maximum interval when result would exceed max', async () => {
      const { computeNextInterval } = await import(
        '@/server/lib/procore/adaptive-backoff'
      );
      // 6000 * 2 = 12000, but max is 10080
      expect(computeNextInterval(6000, false)).toBe(10080);
    });

    it('respects custom env-var overrides for multipliers and bounds', async () => {
      process.env.PROCORE_SYNC_MIN_INTERVAL_MINUTES = '5';
      process.env.PROCORE_SYNC_MAX_INTERVAL_MINUTES = '500';
      process.env.PROCORE_SYNC_BACKOFF_MULTIPLIER = '3';
      process.env.PROCORE_SYNC_COOLDOWN_MULTIPLIER = '0.25';

      const { computeNextInterval } = await import(
        '@/server/lib/procore/adaptive-backoff'
      );
      // 100 * 3 = 300 (within [5, 500])
      expect(computeNextInterval(100, false)).toBe(300);
      // 100 * 0.25 = 25 (within [5, 500])
      expect(computeNextInterval(100, true)).toBe(25);
    });

    it('uses default values when env vars are missing', async () => {
      const { getConfig } = await import(
        '@/server/lib/procore/adaptive-backoff'
      );
      const config = getConfig();
      expect(config.minInterval).toBe(15);
      expect(config.maxInterval).toBe(10080);
      expect(config.backoffMultiplier).toBe(2);
      expect(config.cooldownMultiplier).toBe(0.5);
      expect(config.manualDebounceMins).toBe(5);
    });
  });

  // ----------------------------------------------------------------
  // canManualSync
  // ----------------------------------------------------------------

  describe('canManualSync', () => {
    it('returns true when lastManualSyncAt is null (never synced)', async () => {
      const { canManualSync } = await import(
        '@/server/lib/procore/adaptive-backoff'
      );
      expect(canManualSync(null)).toBe(true);
    });

    it('returns false when within the debounce window', async () => {
      const { canManualSync } = await import(
        '@/server/lib/procore/adaptive-backoff'
      );
      // 1 minute ago — well within the default 5-minute debounce
      const oneMinuteAgo = new Date(Date.now() - 1 * 60 * 1000);
      expect(canManualSync(oneMinuteAgo)).toBe(false);
    });

    it('returns true when outside the debounce window', async () => {
      const { canManualSync } = await import(
        '@/server/lib/procore/adaptive-backoff'
      );
      // 10 minutes ago — past the default 5-minute debounce
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      expect(canManualSync(tenMinutesAgo)).toBe(true);
    });
  });

  // ----------------------------------------------------------------
  // minutesUntilManualSync
  // ----------------------------------------------------------------

  describe('minutesUntilManualSync', () => {
    it('returns 0 when no previous manual sync has occurred', async () => {
      const { minutesUntilManualSync } = await import(
        '@/server/lib/procore/adaptive-backoff'
      );
      expect(minutesUntilManualSync(null)).toBe(0);
    });

    it('returns remaining minutes when within debounce window', async () => {
      const { minutesUntilManualSync } = await import(
        '@/server/lib/procore/adaptive-backoff'
      );
      // 2 minutes ago with 5-minute debounce => ~3 minutes remaining
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
      const remaining = minutesUntilManualSync(twoMinutesAgo);
      // Allow small timing tolerance
      expect(remaining).toBeGreaterThanOrEqual(2.9);
      expect(remaining).toBeLessThanOrEqual(3.1);
    });

    it('returns 0 when past the debounce window', async () => {
      const { minutesUntilManualSync } = await import(
        '@/server/lib/procore/adaptive-backoff'
      );
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      expect(minutesUntilManualSync(tenMinutesAgo)).toBe(0);
    });
  });
});
