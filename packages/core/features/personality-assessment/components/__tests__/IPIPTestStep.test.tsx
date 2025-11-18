import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type {
  IPIPChoice,
  IPIPChoices,
  IPIPDomain,
  IPIPFacet,
  IPIPQuestion,
} from '@app/core/features/personality-assessment/lib/ipip'
import { DOMAIN_NAMES, DOMAIN_ORDER, QUESTIONS_PER_DOMAIN } from '@app/core/features/ipip-assessment/utils/domainGrouping'
import { describe, expect, it, vi } from 'vitest'
import { IPIPTestStep } from '../IPIPTestStep'

const hoistedData = vi.hoisted(() => {
  const domainOrder: IPIPDomain[] = ['A', 'E', 'N', 'C', 'O']
  const questionsPerDomain = 24
  const numberToFacet = (value: number): IPIPFacet => String(value) as IPIPFacet

  const mockQuestions: IPIPQuestion[] = domainOrder.flatMap((domain) =>
    Array.from({ length: questionsPerDomain }, (_, index) => ({
      id: `${domain}-${index}`,
      text: `Question ${domain}-${index}`,
      domain,
      facet: numberToFacet((index % 6) + 1),
      keyed: index % 2 === 0 ? 'plus' : 'minus',
    })),
  )

  const choiceLabels: Array<[IPIPChoice['score'], string]> = [
    [1, 'Very Inaccurate'],
    [2, 'Moderately Inaccurate'],
    [3, 'Neither Accurate Nor Inaccurate'],
    [4, 'Moderately Accurate'],
    [5, 'Very Accurate'],
  ]

  const createChoiceSet = (): IPIPChoice[] =>
    choiceLabels.map(([score, text]) => ({
      text,
      score,
      color: score,
    }))

  const mockChoices: IPIPChoices = {
    plus: createChoiceSet(),
    minus: createChoiceSet(),
  }

  return { mockQuestions, mockChoices }
})

vi.mock('../lib/ipip', () => ({
  getQuestions: () => hoistedData.mockQuestions,
  getChoices: () => hoistedData.mockChoices,
}))

describe('IPIPTestStep', () => {
  it('renders the current domain header using DOMAIN_NAMES for accessibility', () => {
    render(
      <IPIPTestStep
        initialAnswers={[]}
        currentIndex={0}
        language="en"
        onSave={vi.fn()}
        onDomainComplete={vi.fn()}
        isLoading={false}
      />,
    )

    expect(screen.getByText(DOMAIN_NAMES[DOMAIN_ORDER[0]])).toBeVisible()
    expect(screen.getByText('Question 1 of 120')).toBeVisible()
  })

  it('fires onDomainComplete after the last question in a domain is answered', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    const onDomainComplete = vi.fn()

    render(
      <IPIPTestStep
        initialAnswers={[]}
        currentIndex={0}
        language="en"
        onSave={onSave}
        onDomainComplete={onDomainComplete}
        isLoading={false}
      />,
    )

    for (let i = 0; i < QUESTIONS_PER_DOMAIN; i += 1) {
      const choiceButtons = screen.getAllByRole('button', { name: /Very Accurate/i })
      await user.click(choiceButtons[0])
      if (i < QUESTIONS_PER_DOMAIN - 1) {
        const expectedIndex = i + 1
        await waitFor(() => {
          const lastCall = onSave.mock.calls.at(-1)
          expect(lastCall?.[1]).toBe(expectedIndex)
        })
      }
    }

    await waitFor(() => expect(onDomainComplete).toHaveBeenCalledTimes(1))
    const [domainArg, answersArg] = onDomainComplete.mock.calls[0]
    expect(domainArg).toBe('A')
    expect(Array.isArray(answersArg)).toBe(true)
    expect(answersArg).toHaveLength(QUESTIONS_PER_DOMAIN)

    expect(onSave).toHaveBeenCalled()
    const lastSave = onSave.mock.calls.at(-1)
    expect(lastSave?.[1]).toBe(QUESTIONS_PER_DOMAIN)
  })
})


