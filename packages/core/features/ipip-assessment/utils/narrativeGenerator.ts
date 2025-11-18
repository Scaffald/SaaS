import type { IPIPDomain, IPIPScores } from '@app/core/features/personality-assessment/lib/ipip'
import { getResults } from '@app/core/features/personality-assessment/lib/ipip'
import { DOMAIN_NAMES } from './domainGrouping'

const DOMAIN_ORDER: IPIPDomain[] = ['A', 'E', 'N', 'C', 'O']

/**
 * Generate overall personality summary from top 2 domains
 */
export function generateOverallSummary(scores: IPIPScores): string {
  const narratives = getResults()

  // Calculate domain scores (using average)
  const domainScores: Array<{ domain: IPIPDomain; average: number; result: string }> = []

  for (const domain of DOMAIN_ORDER) {
    const domainScore = scores[domain]
    if (!domainScore || domainScore.count === 0) {
      continue
    }

    const average = domainScore.score / domainScore.count
    domainScores.push({
      domain,
      average,
      result: domainScore.result,
    })
  }

  // Sort by average score (descending)
  domainScores.sort((a, b) => b.average - a.average)

  // Get top 2 domains
  const topDomains = domainScores.slice(0, 2)

  if (topDomains.length === 0) {
    return 'Your personality profile shows a balanced approach across all domains, allowing you to adapt flexibly to different situations and challenges.'
  }

  // Build summary from top domains
  const sentences: string[] = []

  // Opening sentence
  const primaryDomain = topDomains[0]
  const primaryNarrative = narratives[primaryDomain.domain]
  if (primaryNarrative) {
    const domainResult = primaryNarrative.results?.[primaryDomain.result as 'low' | 'neutral' | 'high']
    if (domainResult?.text) {
      sentences.push(domainResult.text)
    }
  }

  // Secondary domain
  if (topDomains.length > 1) {
    const secondaryDomain = topDomains[1]
    const secondaryNarrative = narratives[secondaryDomain.domain]
    if (secondaryNarrative) {
      const domainResult =
        secondaryNarrative.results?.[secondaryDomain.result as 'low' | 'neutral' | 'high']
      if (domainResult?.text) {
        sentences.push(domainResult.text)
      }
    }
  }

  // Add modifiers based on specific domains
  const hasHighN = domainScores.find((d) => d.domain === 'N' && d.result === 'high')
  if (hasHighN) {
    sentences.push(
      'Your elevated neuroticism suggests you may experience stress more intensely, which can drive careful planning and risk awareness.',
    )
  }

  const hasHighC = domainScores.find((d) => d.domain === 'C' && d.result === 'high')
  if (hasHighC) {
    sentences.push('Your high conscientiousness indicates strong reliability and methodical approach to your work.')
  }

  const hasHighO = domainScores.find((d) => d.domain === 'O' && d.result === 'high')
  if (hasHighO) {
    sentences.push('Your openness to experience reflects creativity and willingness to explore new ideas and approaches.')
  }

  // Closing sentence
  if (sentences.length > 0) {
    sentences.push(
      'Together, these traits shape how you approach challenges, collaborate with others, and contribute to your professional environment.',
    )
  }

  // Fallback if no sentences generated
  if (sentences.length === 0) {
    return 'Your personality assessment reveals a balanced profile across the Big Five domains, allowing you to adapt effectively to various professional situations.'
  }

  return sentences.join(' ')
}

