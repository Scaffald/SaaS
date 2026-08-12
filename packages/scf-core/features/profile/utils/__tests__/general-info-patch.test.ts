import { describe, expect, it } from 'vitest'
import type { GeneralProfileFormData } from '../../config'
import { buildGeneralInfoPatch } from '../general-info-patch'

/** What the form holds after a load that failed: every field at its default. */
const emptyForm: GeneralProfileFormData = {
  avatar_path: '',
  first_name: '',
  last_name: '',
  about: null,
  phone: '',
  email: '',
  address: {
    street: '',
    city: '',
    state: '',
    zip: '',
    country: 'United States',
    latitude: undefined,
    longitude: undefined,
  },
}

const populatedForm: GeneralProfileFormData = {
  ...emptyForm,
  first_name: 'Zach',
  last_name: 'Servideo',
  phone: '+1 (424) 280-2876',
  email: 'zach@unicorn.love',
  address: {
    street: '10 Central Street',
    city: 'Ipswich',
    state: 'MA',
    zip: '01938',
    country: 'United States',
    latitude: undefined,
    longitude: undefined,
  },
}

describe('buildGeneralInfoPatch', () => {
  // The #580 regression, stated directly: a form left empty by a failed load,
  // where the user edits one field. The old code submitted the whole object and
  // wiped name, phone and address. The patch must contain only `about`.
  it('does not send untouched fields from a form that never loaded', () => {
    const patch = buildGeneralInfoPatch({ ...emptyForm, about: 'hello' }, { about: true })

    expect(patch).toEqual({ about: 'hello' })
    expect(patch).not.toHaveProperty('first_name')
    expect(patch).not.toHaveProperty('last_name')
    expect(patch).not.toHaveProperty('phone')
    expect(patch).not.toHaveProperty('address')
  })

  it('sends nothing when nothing is dirty', () => {
    expect(buildGeneralInfoPatch(populatedForm, {})).toEqual({})
  })

  it('sends a scalar the user actually edited', () => {
    const patch = buildGeneralInfoPatch(
      { ...populatedForm, first_name: 'Zachary' },
      { first_name: true }
    )

    expect(patch).toEqual({ first_name: 'Zachary' })
  })

  it('sends the whole address object when any part of it is dirty', () => {
    const patch = buildGeneralInfoPatch(populatedForm, { address: { city: true } })

    // The server stores address as one JSONB column, so a partial address would
    // drop the untouched keys — it has to go as a whole.
    expect(patch.address).toEqual(populatedForm.address)
    expect(Object.keys(patch)).toEqual(['address'])
  })

  it('ignores an address whose leaves are all false', () => {
    const patch = buildGeneralInfoPatch(populatedForm, {
      address: { city: false, street: false },
    })

    expect(patch).toEqual({})
  })

  it('never sends email, even when marked dirty', () => {
    const patch = buildGeneralInfoPatch(populatedForm, { email: true, phone: true })

    expect(patch).not.toHaveProperty('email')
    expect(patch).toEqual({ phone: populatedForm.phone })
  })

  it('sends a deliberately cleared field', () => {
    // Clearing the avatar is a real edit and must survive the minimal-patch
    // filter — the value is falsy but the field is dirty (#591).
    const patch = buildGeneralInfoPatch(
      { ...populatedForm, avatar_path: '' },
      { avatar_path: true }
    )

    expect(patch).toEqual({ avatar_path: '' })
  })

  it('sends an explicitly nulled about', () => {
    const patch = buildGeneralInfoPatch({ ...populatedForm, about: null }, { about: true })

    expect(patch).toEqual({ about: null })
  })

  it('carries several edits together', () => {
    const patch = buildGeneralInfoPatch(
      { ...populatedForm, first_name: 'Z', phone: '+15551234567' },
      { first_name: true, phone: true }
    )

    expect(patch).toEqual({ first_name: 'Z', phone: '+15551234567' })
  })
})
