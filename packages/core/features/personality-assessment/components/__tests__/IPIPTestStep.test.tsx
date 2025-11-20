import { describe, expect, it, vi } from 'vitest'

vi.mock('@tamagui/web', () => {
  return {
    useThemeState: () => ({
      isNewTheme: false,
      theme: {},
      className: '',
      style: {},
    }),
    useThemeWithState: () => ({
      isNewTheme: false,
      theme: {},
      className: '',
      style: {},
    }),
    setupHooks: () => {},
    View: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  }
})

vi.mock('tamagui', () => {
  const React = require('react') as typeof import('react')
  const create =
    (tag = 'div') =>
    ({ children, ...props }: { children?: React.ReactNode } & Record<string, unknown>) =>
      React.createElement(tag, props, children)

  const Progress = Object.assign(
    ({ children, ...props }: { children?: React.ReactNode } & Record<string, unknown>) => (
      <div data-testid="progress" {...props}>
        {children}
      </div>
    ),
    {
      Indicator: ({
        children,
        ...props
      }: { children?: React.ReactNode } & Record<string, unknown>) => (
        <div data-testid="progress-indicator" {...props}>
          {children}
        </div>
      ),
    }
  )

  return {
    YStack: create(),
    XStack: create(),
    Text: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
    Button: ({
      children,
      onPress,
      ...props
    }: {
      children?: React.ReactNode
      onPress?: () => void
    }) => (
      <button type="button" onClick={onPress} {...props}>
        {children}
      </button>
    ),
    Progress,
  }
})

import {
  DOMAIN_NAMES,
  DOMAIN_ORDER,
  QUESTIONS_PER_DOMAIN,
} from '@app/core/features/ipip-assessment/utils/domainGrouping'
import type {
  IPIPChoice,
  IPIPChoices,
  IPIPDomain,
  IPIPFacet,
  IPIPQuestion,
} from '@app/core/features/personality-assessment/lib/ipip'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

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
    }))
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

import { IPIPTestStep } from '../IPIPTestStep'

const createPrefilledAnswers = () =>
  hoistedData.mockQuestions.slice(0, QUESTIONS_PER_DOMAIN - 1).map((question, index) => ({
    id: question.id,
    domain: question.domain,
    facet: Number.parseInt(question.facet, 10),
    score: ((index % 5) + 1) as IPIPChoice['score'],
  }))

vi.mock('../lib/ipip', () => ({
  getQuestions: () => hoistedData.mockQuestions,
  getChoices: () => hoistedData.mockChoices,
}))

vi.mock('tamagui', async () => {
  const actual = await vi.importActual<typeof import('tamagui')>('tamagui')
  return {
    ...actual,
    Button: ({
      onPress,
      children,
      accessibilityLabel,
      disabled,
    }: {
      onPress?: () => void
      children?: React.ReactNode
      accessibilityLabel?: string
      disabled?: boolean
    }) => (
      <button type="button" onClick={onPress} aria-label={accessibilityLabel} disabled={disabled}>
        {children}
      </button>
    ),
  }
})

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
      />
    )

    expect(screen.getByText(DOMAIN_NAMES[DOMAIN_ORDER[0]])).toBeVisible()
    expect(screen.getByText('Question 1 of 120')).toBeVisible()
  })

  it('fires onDomainComplete after the last question in a domain is answered', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    const onDomainComplete = vi.fn()
    const initialAnswers = createPrefilledAnswers()

    render(
      <IPIPTestStep
        initialAnswers={initialAnswers}
        currentIndex={QUESTIONS_PER_DOMAIN - 1}
        language="en"
        onSave={onSave}
        onDomainComplete={onDomainComplete}
        isLoading={false}
      />
    )

    const choiceButtons = screen.getAllByRole('button', { name: /Very Accurate/i })
    await user.click(choiceButtons[0])

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
