import type { IPIPDomain, IPIPScores } from '@app/core/features/personality-assessment/lib/ipip';

/**
 * Normalized domain scores (0-100 scale)
 */
export type NormalizedScores = {
  [K in IPIPDomain]: {
    percentage: number;
    average: number;
    result: 'low' | 'neutral' | 'high';
  };
}

/**
 * Normalize IPIP scores from average-based (1-5) to percentage (0-100)
 * Formula: (average - 1) / 4 * 100
 * - Score of 1.0 → 0%
 * - Score of 3.0 → 50%
 * - Score of 5.0 → 100%
 *
 * @param scores - IPIPScores from getScore()
 * @returns NormalizedScores with percentage values
 */
export function normalizeScores(scores: IPIPScores): NormalizedScores {
  const normalized: Partial<NormalizedScores> = {};

  const domains: IPIPDomain[] = ['A', 'E', 'N', 'C', 'O'];

  for (const domain of domains) {
    const domainScore = scores[domain];

    if (!domainScore || domainScore.count === 0) {
      // Handle edge case: no answers for this domain
      normalized[domain] = {
        percentage: 50, // Default to neutral (50%)
        average: 3.0,
        result: 'neutral',
      };
      continue;
    }

    const average = domainScore.score / domainScore.count;

    // Validate average is in expected range (1-5)
    if (average < 1 || average > 5) {
      // Clamp to valid range
      const clampedAverage = Math.max(1, Math.min(5, average));
      normalized[domain] = {
        percentage: ((clampedAverage - 1) / 4) * 100,
        average: clampedAverage,
        result: domainScore.result as 'low' | 'neutral' | 'high',
      };
      continue;
    }

    // Normalize: (average - 1) / 4 * 100
    const percentage = ((average - 1) / 4) * 100;

    normalized[domain] = {
      percentage: Math.round(percentage * 100) / 100, // Round to 2 decimal places
      average: Math.round(average * 100) / 100,
      result: domainScore.result as 'low' | 'neutral' | 'high',
    };
  }

  return normalized as NormalizedScores;
}

