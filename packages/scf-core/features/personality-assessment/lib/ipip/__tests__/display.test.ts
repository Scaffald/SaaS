import { describe, expect, it } from 'vitest'
import { displayChoices, formatIPIPItem, sentenceCase } from '../display'
import { getChoices } from '../quiz'

describe('displayChoices (#1194)', () => {
  const choices = getChoices()

  it('runs Very inaccurate → Very accurate for a plus-keyed item', () => {
    const shown = displayChoices(choices.plus)
    expect(shown.map((c) => c.label)).toEqual([
      'Very inaccurate',
      'Moderately inaccurate',
      'Neither accurate nor inaccurate',
      'Moderately accurate',
      'Very accurate',
    ])
    expect(shown.map((c) => c.position)).toEqual([1, 2, 3, 4, 5])
    expect(shown.map((c) => c.choice.score)).toEqual([1, 2, 3, 4, 5])
  })

  it('runs the same way for a minus-keyed item, keeping its reversed scores', () => {
    const shown = displayChoices(choices.minus)
    expect(shown[0].label).toBe('Very inaccurate')
    expect(shown[4].label).toBe('Very accurate')
    expect(shown.map((c) => c.choice.score)).toEqual([5, 4, 3, 2, 1])
  })

  it('does not reorder the data it is given', () => {
    const reversed = [...choices.plus].reverse()
    const copy = [...reversed]
    displayChoices(reversed)
    expect(reversed).toEqual(copy)
  })
})

describe('sentenceCase', () => {
  it('keeps only the first letter capitalised', () => {
    expect(sentenceCase('Neither Accurate Nor Inaccurate')).toBe('Neither accurate nor inaccurate')
  })
})

describe('formatIPIPItem', () => {
  it('quotes the item as a first-person sentence', () => {
    expect(formatIPIPItem('Worry about things')).toBe('“I worry about things.”')
  })

  it('does not double a trailing full stop', () => {
    expect(formatIPIPItem('Pay attention to details.')).toBe('“I pay attention to details.”')
  })
})
