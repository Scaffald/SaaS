/**
 * The decisions behind the /auth card, kept free of component imports so they
 * can be tested without the react-native graph (#1210).
 *
 * The card follows the prototype's `auth-auth` screen: a Sign in / Create
 * account switch above one email form. Scaffald's email path is passwordless,
 * so both tabs send the same magic link — a new address gets an account, a
 * known one gets signed in. The tabs change what the card says and which
 * extra paths it offers, never which auth call runs.
 */

export type AuthMode = 'signin' | 'create'

/** Tab order in the segmented control. */
export const AUTH_MODES: readonly AuthMode[] = ['signin', 'create']

type ParamValue = string | string[] | undefined

const first = (value: ParamValue): string | undefined => (Array.isArray(value) ? value[0] : value)

/**
 * Which tab the card opens on.
 *
 * The landing page's "Create your worker profile" / "Register your
 * organization" buttons arrive with `?intent=worker|org`; those visitors came
 * to make an account, so they land on Create account. Everyone else — a
 * returning user, a signed-out session, a deep link — lands on Sign in.
 */
export function initialAuthMode(params: { intent?: ParamValue }): AuthMode {
  const intent = first(params.intent)
  return intent === 'worker' || intent === 'org' ? 'create' : 'signin'
}

/**
 * Passwords only exist on accounts that already have one, so the password
 * path is offered on Sign in alone. Switching to Create account drops back to
 * the email link.
 */
export function canUsePassword(mode: AuthMode): boolean {
  return mode === 'signin'
}

/** Translation key for the card's primary button. */
export function primaryActionKey(mode: AuthMode, usePassword: boolean, pending: boolean): string {
  if (usePassword && canUsePassword(mode)) {
    return pending ? 'auth.login.passwordSigningIn' : 'auth.login.passwordSignIn'
  }
  if (pending) return 'auth.login.sending'
  return mode === 'create' ? 'auth.login.createButton' : 'auth.login.submitButton'
}

/** Translation key for the line under the tabs that says what the email does. */
export function modeDescriptionKey(mode: AuthMode): string {
  return mode === 'create' ? 'auth.login.createDescription' : 'auth.login.description'
}

export type AuthSlide = {
  /** Two-digit ordinal shown large above the kicker. */
  n: string
  kicker: string
  title: string
  body: string
}

/**
 * The value-prop panel beside the form on desktop, in place of the old
 * testimonial photo carousel. The shape — numbered, kicker, title, one
 * sentence — is the prototype's `AUTH_SLIDES`; the copy is ours where the
 * prototype promised what the product does not do yet. Its "Anonymous until
 * you say so" and "every application autofills" are not true today (an
 * employer sees a worker's name; there is no work-profile autofill), so those
 * slides say what is: contact details stay private, applications are tracked.
 */
export const AUTH_SLIDES: readonly AuthSlide[] = [
  {
    n: '01',
    kicker: 'For workers',
    title: 'Prove it once.',
    body: 'Assessments and verified certifications sit on one profile, so the proof travels with you to every application.',
  },
  {
    n: '02',
    kicker: 'For workers',
    title: 'Your contact details stay yours.',
    body: 'Your email and phone number are never shown to an employer until you choose to share them.',
  },
  {
    n: '03',
    kicker: 'For workers',
    title: 'Know where every application stands.',
    body: 'Submitted, viewed, shortlisted — each application shows its status, and you hear when it moves.',
  },
  {
    n: '04',
    kicker: 'For employers',
    title: 'Hire from proof, not piles.',
    body: 'Read verified certifications and assessment results on every candidate, then move them through one shared pipeline.',
  },
]

/** How long each slide holds before the panel advances. */
export const AUTH_SLIDE_INTERVAL_MS = 7000

/** The slide after `index`, wrapping to the first. */
export function nextSlideIndex(index: number, count: number): number {
  if (count <= 0) return 0
  return (index + 1) % count
}
