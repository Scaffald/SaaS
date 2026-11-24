import type { PrerequisitesCheckResponse } from '@scaffald/sdk'
import { act, renderHook } from '@testing-library/react'
import { useForm } from 'react-hook-form'
import { describe, expect, it } from 'vitest'
import { type PrerequisitesFormData, prerequisitesDefaults } from '../../config/prerequisites-schema'
import { prefillValuesFrom, usePrerequisitesPrefill } from '../usePrerequisitesPrefill'

type CheckData = PrerequisitesCheckResponse['data']

// What /v1/prerequisites/check answers before the session restores (#1386).
const anonBlank: CheckData = {
  first_name: '',
  last_name: '',
  address: null,
  user_types: [],
  industry_id: '',
}

const withNames: CheckData = { ...anonBlank, first_name: 'Prefill', last_name: 'Tester' }

function renderForm(initial: CheckData | undefined) {
  return renderHook(
    ({ data }: { data: CheckData | undefined }) => {
      const form = useForm<PrerequisitesFormData>({ defaultValues: prerequisitesDefaults })
      usePrerequisitesPrefill(form, data)
      return form
    },
    { initialProps: { data: initial } }
  )
}

describe('prefillValuesFrom', () => {
  it('leaves out blank values, so an anon answer prefills nothing', () => {
    expect(prefillValuesFrom(anonBlank)).toEqual({})
    expect(prefillValuesFrom(undefined)).toEqual({})
  })

  it('takes every non-empty field, filling the address from the defaults', () => {
    expect(
      prefillValuesFrom({
        first_name: ' Prefill ',
        last_name: 'Tester',
        address: { street: '1 Main St', city: 'Austin', state: 'TX', zip: '78701', country: '' },
        user_types: ['worker'],
        industry_id: 'ind-1',
      })
    ).toEqual({
      first_name: 'Prefill',
      last_name: 'Tester',
      address: {
        street: '1 Main St',
        city: 'Austin',
        state: 'TX',
        zip: '78701',
        country: 'United States',
        latitude: undefined,
        longitude: undefined,
      },
      user_types: ['worker'],
      industry_id: 'ind-1',
    })
  })
})

describe('usePrerequisitesPrefill', () => {
  it('fills the names when they arrive after the form has rendered', () => {
    const { result, rerender } = renderForm(undefined)
    expect(result.current.getValues('first_name')).toBe('')

    rerender({ data: anonBlank })
    expect(result.current.getValues('first_name')).toBe('')

    rerender({ data: withNames })
    expect(result.current.getValues('first_name')).toBe('Prefill')
    expect(result.current.getValues('last_name')).toBe('Tester')
  })

  it('never overwrites a field the user has typed in', () => {
    const { result, rerender } = renderForm(anonBlank)
    act(() => {
      result.current.setValue('first_name', 'Jodie', { shouldDirty: true })
    })

    rerender({ data: withNames })
    expect(result.current.getValues('first_name')).toBe('Jodie')
    // The field the user left alone still fills.
    expect(result.current.getValues('last_name')).toBe('Tester')
  })

  it('keeps an edit made after the prefill when a later answer changes', () => {
    const { result, rerender } = renderForm(withNames)
    expect(result.current.getValues('first_name')).toBe('Prefill')

    act(() => {
      result.current.setValue('first_name', 'Pre')
    })
    rerender({ data: { ...withNames, first_name: 'Changed', last_name: 'Elsewhere' } })

    expect(result.current.getValues('first_name')).toBe('Pre')
    // Untouched since the last prefill, so it follows the server.
    expect(result.current.getValues('last_name')).toBe('Elsewhere')
  })

  it('does not blank a prefilled field when a blank answer comes in later', () => {
    const { result, rerender } = renderForm(withNames)
    rerender({ data: anonBlank })
    expect(result.current.getValues('first_name')).toBe('Prefill')
  })

  it('keeps an address picked without the dirty flag (setValue from the picker)', () => {
    const { result, rerender } = renderForm(anonBlank)
    act(() => {
      result.current.setValue('address.street', '9 Picked Rd', { shouldValidate: false })
    })
    rerender({
      data: {
        ...withNames,
        address: { street: '1 Main St', city: 'Austin', state: 'TX', zip: '78701', country: 'US' },
      },
    })
    expect(result.current.getValues('address.street')).toBe('9 Picked Rd')
    expect(result.current.getValues('first_name')).toBe('Prefill')
  })

  it('never touches the legal checkboxes', () => {
    const { result, rerender } = renderForm(undefined)
    act(() => {
      result.current.setValue('accepts_terms_of_service', true)
    })
    rerender({ data: withNames })
    expect(result.current.getValues('accepts_terms_of_service')).toBe(true)
    expect(result.current.getValues('accepts_privacy_policy')).toBe(false)
  })
})
