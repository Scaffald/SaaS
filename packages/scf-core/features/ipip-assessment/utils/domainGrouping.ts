import type { IPIPDomain, IPIPQuestion } from '@scf/core/features/personality-assessment/lib/ipip'

/**
 * Domain order for micro-blocks
 */
export const DOMAIN_ORDER: IPIPDomain[] = ['A', 'E', 'N', 'C', 'O']

/**
 * Domain names for display
 */
export const DOMAIN_NAMES: Record<IPIPDomain, string> = {
  A: 'Agreeableness',
  E: 'Extraversion',
  N: 'Neuroticism',
  C: 'Conscientiousness',
  O: 'Openness',
}

/**
 * Questions per domain (24 questions = 4 questions × 6 facets)
 */
export const QUESTIONS_PER_DOMAIN = 24

/**
 * Group questions by domain
 */
export function groupQuestionsByDomain(
  questions: IPIPQuestion[]
): Record<IPIPDomain, IPIPQuestion[]> {
  const grouped: Partial<Record<IPIPDomain, IPIPQuestion[]>> = {}

  for (const question of questions) {
    if (!grouped[question.domain]) {
      grouped[question.domain] = []
    }
    const domainArray = grouped[question.domain]
    if (domainArray) {
      domainArray.push(question)
    }
  }

  // Ensure all domains are present
  for (const domain of DOMAIN_ORDER) {
    if (!grouped[domain]) {
      grouped[domain] = []
    }
  }

  return grouped as Record<IPIPDomain, IPIPQuestion[]>
}

/**
 * Get domain index from global question index
 * Returns 0-4 for domains A, E, N, C, O
 */
export function getDomainIndexFromQuestionIndex(questionIndex: number): number {
  return Math.floor(questionIndex / QUESTIONS_PER_DOMAIN)
}

/**
 * Get current domain from question index
 */
export function getCurrentDomain(questionIndex: number): IPIPDomain | null {
  const domainIndex = getDomainIndexFromQuestionIndex(questionIndex)
  return DOMAIN_ORDER[domainIndex] || null
}

/**
 * Get question index within current domain (0-23)
 */
export function getQuestionIndexInDomain(questionIndex: number): number {
  return questionIndex % QUESTIONS_PER_DOMAIN
}

/**
 * Get start index for a domain
 */
export function getDomainStartIndex(domainIndex: number): number {
  return domainIndex * QUESTIONS_PER_DOMAIN
}

/**
 * Get end index for a domain (exclusive)
 */
export function getDomainEndIndex(domainIndex: number): number {
  return (domainIndex + 1) * QUESTIONS_PER_DOMAIN
}

/**
 * Check if a question index is the last question in its domain
 */
export function isLastQuestionInDomain(questionIndex: number): boolean {
  return getQuestionIndexInDomain(questionIndex) === QUESTIONS_PER_DOMAIN - 1
}

/**
 * Calculate number of completed domains from total answers
 */
export function getCompletedDomainsCount(answersCount: number): number {
  return Math.floor(answersCount / QUESTIONS_PER_DOMAIN)
}

/**
 * Calculate domain progress percentage (0-100)
 */
export function getDomainProgress(answersInDomain: number): number {
  return Math.round((answersInDomain / QUESTIONS_PER_DOMAIN) * 100)
}
