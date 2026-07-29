/**
 * Marketing palette.
 *
 * The marketing surfaces use a darker, higher-contrast take on the brand than
 * the product UI does, so these live here rather than in @scaffald/ui tokens.
 * Ported from the Tailwind theme block of the retired Next.js site.
 */
export const brand = {
  deep: '#034550',
  deeper: '#022d38',
  teal: '#1d7282',
  tealHover: '#125b69',
  tealBright: '#3fb5c7',
  tealSoft: '#7fd1de',
  tealPale: '#bde9f0',
  tealWash: '#e8f6f9',

  ink: '#16110d',
  body: '#3c352c',
  muted: '#6e6760',
  /**
   * Only legible on white/near-white. At 2.7:1 it fails WCAG AA on any of the
   * darker surfaces — use `muted` (5.6:1) or `onDarkMuted` there instead.
   */
  faint: '#9e9790',
  /** Muted text on the deep/deeper brand surfaces. 4.7:1 on `deeper`. */
  onDarkMuted: '#8FA8AE',

  surface: '#ffffff',
  surfaceAlt: '#f9f8f6',
  surfaceSunk: '#f1efeb',
  border: '#e3dfd9',
} as const

/** Horizontal page gutter + max content width, shared by every section. */
export const layout = {
  maxWidth: 1152,
  narrowMaxWidth: 768,
  gutter: 24,
} as const

export const MARKETING_LINKS = {
  linkedin: 'https://www.linkedin.com/company/scaffald/',
  unicorn: 'https://unicorn.love/',
  email: 'hello@scaffald.com',
} as const
