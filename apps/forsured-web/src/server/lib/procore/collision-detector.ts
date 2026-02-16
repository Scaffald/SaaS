/**
 * Collision detection module for Procore entity matching.
 *
 * Compares incoming Procore entities against existing ForSured records
 * to find matches via linked ID, exact name, or fuzzy name similarity.
 *
 * No external dependencies — uses a simple Levenshtein distance implementation.
 */

export interface CollisionResult {
  matchStatus: 'no_match' | 'exact_match' | 'fuzzy_match';
  matchedEntityId: string | null;
  confidence: number;
  matchReason: string | null;
  resolution: 'pending' | 'link';
}

/**
 * Business suffixes to strip during name normalization.
 * These are legal/organizational suffixes that don't carry
 * meaningful domain information for matching purposes.
 */
const STRIP_SUFFIXES = new Set([
  'llc',
  'inc',
  'corp',
  'ltd',
  'co',
  'company',
  'enterprises',
  'services',
  'group',
]);

/**
 * Normalize a company/entity name for comparison.
 *
 * - Lowercases
 * - Strips punctuation (keeps alphanumeric and spaces)
 * - Removes common business suffixes (LLC, Inc, Corp, etc.)
 * - Collapses whitespace
 * - Trims
 */
export function normalizeName(name: string): string {
  let normalized = name.toLowerCase();

  // Remove all non-alphanumeric, non-space characters (punctuation)
  normalized = normalized.replace(/[^a-z0-9\s]/g, '');

  // Collapse whitespace and trim
  normalized = normalized.replace(/\s+/g, ' ').trim();

  // Strip business suffixes from the end, repeatedly
  // (handles cases like "Mega Services Group" → "Mega")
  let words = normalized.split(' ');
  while (words.length > 1 && STRIP_SUFFIXES.has(words[words.length - 1])) {
    words.pop();
  }

  return words.join(' ');
}

/**
 * Compute the Levenshtein edit distance between two strings.
 */
function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;

  // Quick exits
  if (m === 0) return n;
  if (n === 0) return m;

  // Use a single-row DP approach for space efficiency
  const prev = new Array<number>(n + 1);
  for (let j = 0; j <= n; j++) {
    prev[j] = j;
  }

  for (let i = 1; i <= m; i++) {
    let prevDiag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= n; j++) {
      const temp = prev[j];
      if (a[i - 1] === b[j - 1]) {
        prev[j] = prevDiag;
      } else {
        prev[j] = 1 + Math.min(prevDiag, prev[j - 1], prev[j]);
      }
      prevDiag = temp;
    }
  }

  return prev[n];
}

/**
 * Compute similarity between two strings as a value in [0, 1].
 * Uses: 1 - (levenshteinDistance / maxLength).
 */
function similarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1.0;
  return 1 - levenshteinDistance(a, b) / maxLen;
}

const FUZZY_THRESHOLD = 0.7;

/**
 * Detect collisions between an incoming Procore entity and existing records.
 *
 * Detection priority:
 * 1. Previously linked — existing record's procore_id/procore_vendor_id matches
 *    the Procore entity ID. Returns exact_match with resolution 'link'.
 * 2. Exact name match — normalized names are identical. Returns exact_match
 *    with confidence 1.0 and resolution 'pending'.
 * 3. Fuzzy name match — Levenshtein similarity >= 0.7. Returns fuzzy_match
 *    with the similarity as confidence and resolution 'pending'.
 * 4. No match — returns no_match with null matchedEntityId.
 */
export function detectCollision(
  procoreEntity: { id: number; name: string },
  existingRecords: Array<{
    id: string;
    name: string;
    procore_id?: string | null;
    procore_vendor_id?: string | null;
  }>,
  procoreIdField: 'procore_id' | 'procore_vendor_id',
): CollisionResult {
  const procoreIdStr = String(procoreEntity.id);

  // Priority 1: Previously linked by procore ID
  for (const record of existingRecords) {
    const linkedId = record[procoreIdField];
    if (linkedId != null && linkedId === procoreIdStr) {
      return {
        matchStatus: 'exact_match',
        matchedEntityId: record.id,
        confidence: 1.0,
        matchReason: `Previously linked via ${procoreIdField}`,
        resolution: 'link',
      };
    }
  }

  const incomingNormalized = normalizeName(procoreEntity.name);

  // Priority 2: Exact normalized name match
  for (const record of existingRecords) {
    if (normalizeName(record.name) === incomingNormalized) {
      return {
        matchStatus: 'exact_match',
        matchedEntityId: record.id,
        confidence: 1.0,
        matchReason: `Exact normalized name match: "${incomingNormalized}"`,
        resolution: 'pending',
      };
    }
  }

  // Priority 3: Fuzzy name match — pick the best one above threshold
  let bestMatch: { id: string; sim: number } | null = null;

  for (const record of existingRecords) {
    const recordNormalized = normalizeName(record.name);
    const sim = similarity(incomingNormalized, recordNormalized);
    if (sim >= FUZZY_THRESHOLD && (bestMatch === null || sim > bestMatch.sim)) {
      bestMatch = { id: record.id, sim };
    }
  }

  if (bestMatch !== null) {
    return {
      matchStatus: 'fuzzy_match',
      matchedEntityId: bestMatch.id,
      confidence: bestMatch.sim,
      matchReason: `Fuzzy name match with similarity ${bestMatch.sim.toFixed(2)}`,
      resolution: 'pending',
    };
  }

  // Priority 4: No match
  return {
    matchStatus: 'no_match',
    matchedEntityId: null,
    confidence: 0,
    matchReason: null,
    resolution: 'pending',
  };
}
