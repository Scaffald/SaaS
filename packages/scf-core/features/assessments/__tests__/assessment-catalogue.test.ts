import { describe, expect, it } from 'vitest'
import {
  type AssessmentEntry,
  entryActionLabel,
  entryActionRoute,
  readCompleted,
  splitRecommended,
} from '../assessment-catalogue'

const entry = (key: string, complete: boolean, resultsRoute?: string): AssessmentEntry => ({
  key,
  title: key,
  proves: '',
  estimate: '',
  complete,
  route: `/assessments/${key}`,
  resultsRoute,
})

describe('splitRecommended (#1193)', () => {
  it('recommends the first assessment not yet taken and lists the rest', () => {
    const entries = [entry('ipip', true), entry('riasec', false), entry('pulse', false)]
    const { recommended, rest } = splitRecommended(entries)
    expect(recommended?.key).toBe('riasec')
    expect(rest.map((e) => e.key)).toEqual(['ipip', 'pulse'])
  })

  it('recommends nothing once every assessment is done', () => {
    const entries = [entry('ipip', true), entry('riasec', true)]
    const { recommended, rest } = splitRecommended(entries)
    expect(recommended).toBeNull()
    expect(rest).toHaveLength(2)
  })
})

describe('entry actions', () => {
  it('begins an assessment that has not been taken', () => {
    expect(entryActionLabel(entry('riasec', false))).toBe('Begin')
    expect(entryActionRoute(entry('riasec', false))).toBe('/assessments/riasec')
  })

  it('reviews results that have their own screen', () => {
    const done = entry('ipip', true, '/assessments/ipip/results')
    expect(entryActionLabel(done)).toBe('Review')
    expect(entryActionRoute(done)).toBe('/assessments/ipip/results')
  })

  it('offers a retake where results have no screen', () => {
    expect(entryActionLabel(entry('pulse', true))).toBe('Take again')
    expect(entryActionRoute(entry('pulse', true))).toBe('/assessments/pulse')
  })

  it('does not send an unfinished assessment to its results', () => {
    expect(entryActionRoute(entry('ipip', false, '/assessments/ipip/results'))).toBe(
      '/assessments/ipip'
    )
  })
})

describe('readCompleted', () => {
  it('accepts every spelling of "done" the four status endpoints use', () => {
    // Each of these is a real response shape: the IPIP endpoint nests under
    // `data`, RIASEC answers `complete`, occupation answers `selected`.
    expect(readCompleted({ isCompleted: true })).toBe(true)
    expect(readCompleted({ data: { isCompleted: true } })).toBe(true)
    expect(readCompleted({ complete: true })).toBe(true)
    expect(readCompleted({ completed: true })).toBe(true)
    expect(readCompleted({ selected: true })).toBe(true)
    expect(readCompleted({ data: { complete: true } })).toBe(true)
  })

  it('is false for an unfinished assessment', () => {
    expect(readCompleted({ isCompleted: false })).toBe(false)
    expect(readCompleted({ data: { isCompleted: false } })).toBe(false)
    expect(readCompleted({})).toBe(false)
  })

  it('is false rather than throwing when the request has not answered', () => {
    expect(readCompleted(undefined)).toBe(false)
    expect(readCompleted(null)).toBe(false)
  })

  it('does not treat a truthy non-boolean as done', () => {
    // A status endpoint returning a date or a count here would otherwise
    // read as completion.
    expect(readCompleted({ isCompleted: 'no' })).toBe(false)
    expect(readCompleted({ completed: 0 })).toBe(false)
  })
})
