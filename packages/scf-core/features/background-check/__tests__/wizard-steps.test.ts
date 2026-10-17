import { describe, expect, it } from 'vitest'
import {
  canContinueFrom,
  canGoBackFrom,
  documentsAreComplete,
  footerActionFor,
  stepNumber,
  type StepGateInput,
} from '../wizard-steps'

const base: StepGateInput = {
  selectedPackageId: undefined,
  consent: { acceptsDisclosure: false, signature: '' },
  requiredDocuments: [],
  documents: [],
}

const doc = (documentType: string) => ({
  documentType,
  storagePath: `pending://${documentType}`,
  fileName: documentType,
  mimeType: 'application/octet-stream',
  fileSize: 0,
})

describe('stepNumber', () => {
  it('zero-pads to two digits', () => {
    expect(stepNumber(0)).toBe('01')
    expect(stepNumber(4)).toBe('05')
  })
})

describe('footerActionFor', () => {
  it('offers Continue on the steps the footer moves forward', () => {
    expect(footerActionFor('packages')).toBe('continue')
    expect(footerActionFor('consent')).toBe('continue')
    expect(footerActionFor('documents')).toBe('continue')
  })

  it('leaves payment to the payment form', () => {
    expect(footerActionFor('payment')).toBeNull()
  })

  it('finishes from confirmation', () => {
    expect(footerActionFor('confirmation')).toBe('done')
  })
})

describe('canContinueFrom', () => {
  it('needs a package on the package step', () => {
    expect(canContinueFrom('packages', base)).toBe(false)
    expect(canContinueFrom('packages', { ...base, selectedPackageId: 'pkg' })).toBe(true)
  })

  it('needs the disclosure accepted and a signature on the consent step', () => {
    expect(
      canContinueFrom('consent', { ...base, consent: { acceptsDisclosure: true, signature: '' } })
    ).toBe(false)
    expect(
      canContinueFrom('consent', { ...base, consent: { acceptsDisclosure: false, signature: 'Jo Doe' } })
    ).toBe(false)
    expect(
      canContinueFrom('consent', { ...base, consent: { acceptsDisclosure: true, signature: ' J ' } })
    ).toBe(false)
    expect(
      canContinueFrom('consent', { ...base, consent: { acceptsDisclosure: true, signature: 'Jo Doe' } })
    ).toBe(true)
  })

  it('needs every required document on the documents step', () => {
    const required = ['government_id', 'drivers_license']
    expect(canContinueFrom('documents', { ...base, requiredDocuments: required })).toBe(false)
    expect(
      canContinueFrom('documents', {
        ...base,
        requiredDocuments: required,
        documents: [doc('government_id')],
      })
    ).toBe(false)
    expect(
      canContinueFrom('documents', {
        ...base,
        requiredDocuments: required,
        documents: [doc('government_id'), doc('drivers_license')],
      })
    ).toBe(true)
  })

  it('never continues from payment or confirmation through the footer', () => {
    const ready = { ...base, selectedPackageId: 'pkg' }
    expect(canContinueFrom('payment', ready)).toBe(false)
    expect(canContinueFrom('confirmation', ready)).toBe(false)
  })
})

describe('documentsAreComplete', () => {
  it('is complete when the package needs nothing', () => {
    expect(documentsAreComplete([], [])).toBe(true)
  })
})

describe('canGoBackFrom', () => {
  it('has nothing to go back to on the first step', () => {
    expect(canGoBackFrom('packages', 0)).toBe(false)
  })

  it('goes back from the middle steps', () => {
    expect(canGoBackFrom('consent', 1)).toBe(true)
    expect(canGoBackFrom('payment', 3)).toBe(true)
  })

  it('does not go back once the check is submitted', () => {
    expect(canGoBackFrom('confirmation', 4)).toBe(false)
  })
})
