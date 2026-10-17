/**
 * What the background-check wizard's footer offers on each step.
 *
 * Each step used to draw its own full-width Continue under its content, and
 * the wizard drew Back and the step count on a second row beneath that — two
 * footers, with the primary action on neither of them (#1191). The footer is
 * one row now, owned by the wizard, so the rule for when Continue is allowed
 * has to live somewhere both can read: here, rather than inside each step.
 */

import type {
  BackgroundCheckWizardStep,
  ConsentDetails,
  DocumentDraft,
} from './hooks/useBackgroundCheckForm'

export const STEP_LABELS: Record<BackgroundCheckWizardStep, string> = {
  packages: 'Package',
  consent: 'Consent',
  documents: 'Documents',
  payment: 'Payment',
  confirmation: 'Confirmation',
}

/** "01", "02" … — the stepper's numbered tabs. */
export function stepNumber(index: number): string {
  return String(index + 1).padStart(2, '0')
}

export interface StepGateInput {
  selectedPackageId?: string
  consent: ConsentDetails
  requiredDocuments: string[]
  documents: DocumentDraft[]
}

export function consentIsComplete(consent: ConsentDetails): boolean {
  return consent.acceptsDisclosure && consent.signature.trim().length > 1
}

export function documentsAreComplete(requiredDocuments: string[], documents: DocumentDraft[]) {
  if (requiredDocuments.length === 0) return true
  const provided = new Set(documents.map((doc) => doc.documentType))
  return requiredDocuments.every((doc) => provided.has(doc))
}

/**
 * The footer's right-hand action. Payment has none: Stripe's form carries
 * the step's one primary ("Pay & start screening"), and a Continue beside it
 * would skip payment. Confirmation's only way on is back to Verification.
 */
export type FooterAction = 'continue' | 'done' | null

export function footerActionFor(step: BackgroundCheckWizardStep): FooterAction {
  if (step === 'payment') return null
  if (step === 'confirmation') return 'done'
  return 'continue'
}

export function canContinueFrom(step: BackgroundCheckWizardStep, input: StepGateInput): boolean {
  switch (step) {
    case 'packages':
      return Boolean(input.selectedPackageId)
    case 'consent':
      return consentIsComplete(input.consent)
    case 'documents':
      return documentsAreComplete(input.requiredDocuments, input.documents)
    default:
      return false
  }
}

/** Back is offered until the check is paid for; after that there is nothing to go back to. */
export function canGoBackFrom(step: BackgroundCheckWizardStep, index: number): boolean {
  return index > 0 && step !== 'confirmation'
}
