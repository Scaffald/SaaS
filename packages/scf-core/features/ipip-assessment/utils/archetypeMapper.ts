import type { IPIPDomain, IPIPScores } from '@scf/core/features/personality-assessment/lib/ipip'

/**
 * Condition for archetype matching
 */
export interface ArchetypeCondition {
  domain: IPIPDomain
  level: 'low' | 'neutral' | 'high'
  weight: number // 0-1, importance of this condition
}

/**
 * Archetype definition with mapping rules
 */
export interface ArchetypeDefinition {
  name: string
  conditions: ArchetypeCondition[]
}

/**
 * Result of archetype mapping
 */
export interface ArchetypeResult {
  archetype: string // Archetype name, or "Evolving [Archetype]" if confidence < 60%
  confidence: number // 0-100, match percentage
}

/**
 * 8 Industry-neutral archetypes with weighted conditions
 * Based on archetype requirements
 */
const ARCHETYPES: ArchetypeDefinition[] = [
  {
    name: 'Builder',
    conditions: [
      { domain: 'C', level: 'high', weight: 1.0 },
      { domain: 'O', level: 'neutral', weight: 0.5 },
    ],
  },
  {
    name: 'Maker',
    conditions: [
      { domain: 'C', level: 'high', weight: 0.8 },
      { domain: 'O', level: 'high', weight: 0.8 },
      { domain: 'E', level: 'low', weight: 0.6 },
    ],
  },
  {
    name: 'Operator',
    conditions: [
      { domain: 'C', level: 'high', weight: 1.0 },
      { domain: 'N', level: 'high', weight: 0.7 },
      { domain: 'O', level: 'low', weight: 0.5 },
    ],
  },
  {
    name: 'Designer',
    conditions: [
      { domain: 'O', level: 'high', weight: 1.0 },
      { domain: 'E', level: 'neutral', weight: 0.5 },
    ],
  },
  {
    name: 'Connector',
    conditions: [
      { domain: 'E', level: 'high', weight: 1.0 },
      { domain: 'A', level: 'high', weight: 0.8 },
    ],
  },
  {
    name: 'Analyst',
    conditions: [
      { domain: 'E', level: 'low', weight: 0.8 },
      { domain: 'O', level: 'high', weight: 0.8 },
      { domain: 'C', level: 'high', weight: 0.7 },
    ],
  },
  {
    name: 'Navigator',
    conditions: [
      { domain: 'E', level: 'high', weight: 1.0 },
      { domain: 'O', level: 'high', weight: 0.8 },
      { domain: 'N', level: 'low', weight: 0.6 },
    ],
  },
  {
    name: 'Innovator',
    conditions: [
      { domain: 'O', level: 'high', weight: 1.0 },
      { domain: 'E', level: 'high', weight: 0.8 },
      { domain: 'C', level: 'low', weight: 0.5 },
    ],
  },
]

/**
 * Map Big Five domain scores to archetype with confidence scoring
 *
 * Algorithm:
 * 1. For each archetype, calculate match score:
 *    - Sum weights where domain level matches condition
 *    - Divide by total weights
 *    - Convert to percentage (0-100)
 * 2. Sort archetypes by match score descending
 * 3. Return top archetype with confidence
 * 4. If confidence < 60%, prepend "Evolving " to name
 *
 * @param scores - IPIPScores from getScore()
 * @returns ArchetypeResult with best-matching archetype and confidence
 */
export function mapToArchetype(scores: IPIPScores): ArchetypeResult {
  // Calculate match score for each archetype
  const archetypeScores = ARCHETYPES.map((archetype) => {
    let totalWeight = 0
    let matchedWeight = 0

    // Check each condition
    for (const condition of archetype.conditions) {
      totalWeight += condition.weight

      const domainScore = scores[condition.domain]
      if (!domainScore) {
        // Domain not scored, skip this condition
        continue
      }

      // Check if domain level matches condition
      if (domainScore.result === condition.level) {
        matchedWeight += condition.weight
      }
    }

    // Calculate match percentage
    const matchPercentage = totalWeight > 0 ? (matchedWeight / totalWeight) * 100 : 0

    return {
      name: archetype.name,
      score: matchPercentage,
    }
  })

  // Sort by score descending
  archetypeScores.sort((a, b) => b.score - a.score)

  // Get top archetype
  const topArchetype = archetypeScores[0]

  if (!topArchetype) {
    // Edge case: no archetypes (shouldn't happen)
    return {
      archetype: 'Evolving Builder',
      confidence: 0,
    }
  }

  const confidence = Math.round(topArchetype.score)

  // Apply "Evolving" prefix if confidence < 60%
  const archetypeName = confidence < 60 ? `Evolving ${topArchetype.name}` : topArchetype.name

  return {
    archetype: archetypeName,
    confidence,
  }
}

/**
 * Get all archetype match scores (for debugging/analysis)
 *
 * @param scores - IPIPScores from getScore()
 * @returns Array of archetype names with their match scores, sorted by score
 */
export function getAllArchetypeScores(scores: IPIPScores): Array<{ name: string; score: number }> {
  const archetypeScores = ARCHETYPES.map((archetype) => {
    let totalWeight = 0
    let matchedWeight = 0

    for (const condition of archetype.conditions) {
      totalWeight += condition.weight

      const domainScore = scores[condition.domain]
      if (!domainScore) {
        continue
      }

      if (domainScore.result === condition.level) {
        matchedWeight += condition.weight
      }
    }

    const matchPercentage = totalWeight > 0 ? (matchedWeight / totalWeight) * 100 : 0

    return {
      name: archetype.name,
      score: Math.round(matchPercentage),
    }
  })

  return archetypeScores.sort((a, b) => b.score - a.score)
}
