import type { PrerequisitesCheckResponse } from '@scaffald/sdk'
import { useEffect, useRef } from 'react'
import type { UseFormGetValues, UseFormSetValue } from 'react-hook-form'
import { type PrerequisitesFormData, prerequisitesDefaults } from '../config/prerequisites-schema'

/** The form fields /v1/prerequisites/check can prefill. Legal checkboxes never are. */
export const PREFILL_FIELDS = [
  'first_name',
  'last_name',
  'address',
  'user_types',
  'industry_id',
] as const

export type PrefillField = (typeof PREFILL_FIELDS)[number]
export type PrefillValues = Partial<Pick<PrerequisitesFormData, PrefillField>>

type CheckData = PrerequisitesCheckResponse['data'] | null | undefined

/**
 * The values a /check response has for the form, leaving out anything empty.
 * An empty value is never prefilled: the anon response the api sends before
 * the session restores carries blank names, and those must not count as "this
 * user has no name" (#1386).
 */
export function prefillValuesFrom(data: CheckData): PrefillValues {
  if (!data) return {}
  const values: PrefillValues = {}
  const first = data.first_name?.trim()
  const last = data.last_name?.trim()
  if (first) values.first_name = first
  if (last) values.last_name = last
  if (data.address) {
    const a = data.address
    values.address = {
      street: a.street ?? prerequisitesDefaults.address.street,
      city: a.city ?? prerequisitesDefaults.address.city,
      state: a.state ?? prerequisitesDefaults.address.state,
      zip: a.zip ?? prerequisitesDefaults.address.zip,
      country: a.country || prerequisitesDefaults.address.country,
      latitude: a.latitude,
      longitude: a.longitude,
    }
  }
  if (data.user_types?.length) values.user_types = [...data.user_types]
  if (data.industry_id) values.industry_id = data.industry_id
  return values
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

/**
 * Fills the onboarding form from /check whenever a response arrives, however
 * late, without overwriting what the user has entered.
 *
 * A field is filled only while it still holds what the form last put there:
 * the default at first, then the last prefilled value. Anything else is the
 * user's. This compares values rather than react-hook-form's dirty flags
 * because the address picker and the user-type checkboxes write with
 * setValue, which never marks a field dirty.
 */
export function usePrerequisitesPrefill(
  form: {
    getValues: UseFormGetValues<PrerequisitesFormData>
    setValue: UseFormSetValue<PrerequisitesFormData>
  },
  data: CheckData
) {
  const { getValues, setValue } = form
  const seeded = useRef<PrefillValues>({})

  useEffect(() => {
    const incoming = prefillValuesFrom(data)
    for (const name of PREFILL_FIELDS) {
      const next = incoming[name]
      if (next === undefined) continue
      const baseline = name in seeded.current ? seeded.current[name] : prerequisitesDefaults[name]
      const current = getValues(name)
      if (!same(current, baseline)) continue
      seeded.current = { ...seeded.current, [name]: next }
      if (same(current, next)) continue
      setValue(name, next as never, { shouldDirty: false, shouldValidate: false })
    }
  }, [data, getValues, setValue])
}
