import { describe, expect, it } from 'vitest'
import {
  DOMAIN_NAMES,
  DOMAIN_ORDER,
  QUESTIONS_PER_DOMAIN,
  getCompletedDomainsCount,
  getCurrentDomain,
  getDomainEndIndex,
  getDomainIndexFromQuestionIndex,
  getDomainProgress,
  getDomainStartIndex,
  getQuestionIndexInDomain,
  groupQuestionsByDomain,
  isLastQuestionInDomain,
} from '../domainGrouping'
import { getQuestions } from '@app/core/features/personality-assessment/lib/ipip'

describe('domainGrouping helpers', () => {
  it('groups 120 questions into five 24-question micro-blocks', () => {
    const questions = getQuestions()
    const grouped = groupQuestionsByDomain(questions)

    DOMAIN_ORDER.forEach((domain) => {
      const group = grouped[domain]
      expect(group).toHaveLength(QUESTIONS_PER_DOMAIN)
      expect(group.every((question) => question.domain === domain)).toBe(true)
    })
  })

  it('always returns domain buckets in canonical DOMAIN_ORDER, even with missing data', () => {
    const grouped = groupQuestionsByDomain([])
    expect(Object.keys(grouped)).toEqual(DOMAIN_ORDER)
  })

  it('maps question indexes to the correct domain bucket', () => {
    expect(getDomainIndexFromQuestionIndex(0)).toBe(0)
    expect(getDomainIndexFromQuestionIndex(QUESTIONS_PER_DOMAIN - 1)).toBe(0)
    expect(getDomainIndexFromQuestionIndex(QUESTIONS_PER_DOMAIN)).toBe(1)
    expect(getDomainIndexFromQuestionIndex(QUESTIONS_PER_DOMAIN * 2)).toBe(2)
    expect(getDomainIndexFromQuestionIndex(QUESTIONS_PER_DOMAIN * 4 + 10)).toBe(4)
    expect(getCurrentDomain(0)).toBe(DOMAIN_ORDER[0])
    expect(getCurrentDomain(QUESTIONS_PER_DOMAIN * 3)).toBe(DOMAIN_ORDER[3])
  })

  it('exposes helpers for start/end indexes within a domain block', () => {
    DOMAIN_ORDER.forEach((_, domainIndex) => {
      const start = getDomainStartIndex(domainIndex)
      const end = getDomainEndIndex(domainIndex)
      expect(start).toBe(domainIndex * QUESTIONS_PER_DOMAIN)
      expect(end).toBe((domainIndex + 1) * QUESTIONS_PER_DOMAIN)
      expect(getQuestionIndexInDomain(start)).toBe(0)
      expect(getQuestionIndexInDomain(end - 1)).toBe(QUESTIONS_PER_DOMAIN - 1)
      expect(isLastQuestionInDomain(end - 1)).toBe(true)
    })
  })

  it('calculates progress and completion counts based on answers saved', () => {
    expect(getCompletedDomainsCount(0)).toBe(0)
    expect(getCompletedDomainsCount(QUESTIONS_PER_DOMAIN)).toBe(1)
    expect(getCompletedDomainsCount(QUESTIONS_PER_DOMAIN * 4)).toBe(4)
    expect(getCompletedDomainsCount(QUESTIONS_PER_DOMAIN * 5)).toBe(5)

    expect(getDomainProgress(0)).toBe(0)
    expect(getDomainProgress(QUESTIONS_PER_DOMAIN / 2)).toBe(50)
    expect(getDomainProgress(QUESTIONS_PER_DOMAIN)).toBe(100)
  })

  it('identifies when the current question represents the last item in a domain', () => {
    const lastIndex = QUESTIONS_PER_DOMAIN - 1
    expect(isLastQuestionInDomain(lastIndex)).toBe(true)
    expect(isLastQuestionInDomain(lastIndex - 1)).toBe(false)
  })

  it('returns null when the question index exceeds the final domain block', () => {
    const beyondFinalIndex = QUESTIONS_PER_DOMAIN * DOMAIN_ORDER.length
    expect(getCurrentDomain(beyondFinalIndex)).toBeNull()
    expect(isLastQuestionInDomain(beyondFinalIndex)).toBe(false)
  })

  it('exposes friendly domain names for accessibility/UX copy', () => {
    expect(DOMAIN_NAMES.A).toBe('Agreeableness')
    expect(DOMAIN_NAMES.E).toBe('Extraversion')
    expect(DOMAIN_NAMES.N).toBe('Neuroticism')
    expect(DOMAIN_NAMES.C).toBe('Conscientiousness')
    expect(DOMAIN_NAMES.O).toBe('Openness')
  })
})


