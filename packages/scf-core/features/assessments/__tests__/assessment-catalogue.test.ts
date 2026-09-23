import { describe, expect, it } from 'vitest'
import { readCompleted } from '../assessment-catalogue'

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
