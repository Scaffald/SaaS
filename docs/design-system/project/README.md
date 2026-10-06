Scaffald is a hiring platform for the construction trades: workers, employers, recruiters, screening partners and admins share one app on web, iOS and Android. The interface is built on `@scaffald/ui`, a React Native + web component library, and every value in this system is the library's own. Use it as the brief for anything that should look like Scaffald.

## Content fundamentals

- **Plain, specific, unhurried.** Say what happened and what to do: "Applied 3 days ago · Awaiting screening", "2 due today". No exclamation marks, no sales voice, no emoji in product copy.
- **Sentence case everywhere** — titles, buttons, tabs, labels. The only uppercase is the `h6` kicker above a title or a metric figure ("OVER SLA", "SEARCH APPEARANCES").
- **Verb first on buttons**: "Post a job", "Log follow-up", "Advance stage". A view has at most one primary (filled `primary`) button, for the thing the view is for.
- **Figures are figures.** Set counts and money in `h2` with tabular numerals inside a `MetricBlock`: label above, figure, delta beneath. Never bury a number in a sentence when it is the point of the screen.
- **Attention is not error.** Something overdue, over-SLA or stale is `text-attention` on `bg-attention` with a `border-attention` rule; something broken is the `error` ramp. Keep the two apart — the amber means "act on this", the terracotta means "this failed".
- **Say the sample.** Statistics shown to workers carry their basis ("Median of 31 applications"); under 25 applications the figure is suppressed, not rounded.

## Visual foundations

### Colour

- The ground is warm stone: `bg-default` (white / `gray-900`), `bg-subtle` for panels, `bg-muted` for the dark-theme card. Everything neutral comes from the `gray` ramp; the `neutral` sand ramp is for warm imagery only.
- **One accent.** Teal `primary` is the only brand hue in the interface: `primary-600` fills the primary button and underlines the active tab, `text-emphasis` carries links and active nav, `bg-selected` tints a selected row. The amber is reserved for priority (`text-attention`, `bg-attention`, `border-attention`) so the teal stays the single accent.
- Text on the ground is `text-primary` (18.8:1), `text-secondary` for paragraphs (12.1:1 light, 14.1:1 dark) and `text-tertiary` for helper text, kickers and inactive tabs (5.6:1 / 6.5:1). `text-disabled` is decorative (1.7:1 / 2.1:1): never put information in it alone.
- Every filled control gets `white` text: `primary-600` 6.7:1, `success-600` and `error-600` 7.1:1, `gray-900` 18.8:1. Do not fill with `warning-500` (2.9:1 with white) — amber is a text and border colour, not a fill.
- The dark theme inverts the teal: anything that is `primary-600` on light becomes `primary-300` on dark (`text-emphasis`, `fg-active`), because `primary-500` is only 3.4:1 on `gray-900`. `icon-active` still keeps `primary-500` in the source; prefer `fg-active` for new dark-theme work.
- Status marks that must be told apart carry a word or an icon as well as a colour: `StatusIndicator` always has a label. Success (moss) and error (terracotta) differ in hue and are never the only cue.
- Glass (`bg-glass`, `border-ghost`, `shadow-glass`) exists for the iOS 26 surfaces and dashboard cards; it is not the default container.

### Type

- Two faces, three roles. `Roboto` sets everything (`sans`); the `display` face — Cormorant Garamond registered as `Scaffald Display` — sets headings on web only; `Roboto Serif` is the body serif for quoted copy. Native headings stay on Roboto until the serif is proven legible on a phone outdoors.
- Six interface steps and one display size: 11 · 12.5 · 14 · 17 · 22 · 30, and 42 for `h1`. Body leads at about 1.55, headings at about 1.15. Do not add a seventh size.
- `body` (14/22) is the default. `small` (12.5/19) sets input text, helper text, Button md/lg labels and Tab labels. `caption` is the same size with 0.1px tracking for metadata. `h5` is body-sized and carried by weight; `h6` is the 11px uppercase kicker.
- Weights are 400, 500, 600, 700. Native Roboto has no 600: semibold renders as Roboto-Medium there, so never rely on 500 vs 600 to distinguish two things.
- Figures that stand as data (metric values, table columns, pagers) set tabular numerals.

### Spacing and layout

- The 27-step primitive scale in px (`space-0` … `space-768`). Only those indices exist — `spacing[3]` is not a thing. Controls are built from 4 · 6 · 8 · 10 · 12 · 16 · 20 · 24; sections from 24 · 32 · 40; the rest are layout widths.
- Touch targets are 44px: Button md and lg are 44 tall, Input is at least 40 and grows with its label.
- Breakpoints are min-width: `breakpoint-sm` (800) is where the drawer becomes persistent, `breakpoint-lg` (1280) is desktop. `MetricRow` stacks below 640. Read widths through `useResponsive()`, never `useWindowDimensions`.
- Separate with hairlines and whitespace first (`border-default`, 1px; `StyleSheet.hairlineWidth` on native); reach for a card when content genuinely needs a surface of its own.

### Radii, borders, shadows

- Three radii and a pill: `radius-xxxs` (2) for the small checkbox, `radius-xs` (4) for buttons, checkboxes and the focus outline, `radius-l` (7) for inputs, cards and panels, `radius-max` for chips and toggles. The iOS 26 radii (`radius-ios-*`) are for native sheets, alerts and menus; never round a card with them.
- Borders are `border-width-thin` (1px) in `border-default`; `border-subtle` on outlined cards; `border-muted` on hover; the state colours (`border-error`, `border-focus`, `border-attention`) replace, never add.
- Shadows are ink-tinted and quiet: `shadow-button` under a filled button or classic input at rest, `shadow-xs` / `shadow-s` / `shadow-m` for Card elevation sm / md / lg, `shadow-soft` for the airy dashboard card, `shadow-m` upward for anything that floats.

### States and focus

- Hover moves one ramp step (`primary-600` → `primary-700`; `gray-100` → `gray-200`), pressed one more. A pressed card drops to 0.9 opacity and 0.98 scale; disabled cards are 0.6, disabled chips 0.4.
- Keyboard focus on web is `focus-ring` (`primary-300`): a 2px solid outline, 2px offset, 4px radius, on `:focus-visible` only. It is 7.7:1 on the dark page but 2.4:1 on white, below the 3:1 floor for a mark — a known gap the source ships; inputs use the `focus-primary` shadow (white gap then `primary-200`) instead.
- Reduced motion is honoured: the Toggle thumb snaps instead of springing.

### Motion

Durations: instant 0, fastest 100, faster 150, fast 200, normal 300, slow 400, slower 500, slowest 700 ms. Quick interactions are 150 ms ease-out; standard transitions 300 ms ease-in-out; the Toggle thumb uses the `snappy` spring. Motion is not a token family on this page; take these from `tokens/animations.ts`.

## Iconography

Icons are Lucide (`lucide-react-native`), rendered through the `Icon` wrapper at 20px by default in `fg-muted`; 18 / 20 / 22 inside Button sm / md / lg, 16 / 18 / 20 inside Chip sm / md / lg. Stroke icons only, never filled glyphs or emoji. The mark and wordmark in Logos are the brand's own files; the wordmark's teal and its cyan-to-teal gradient are not interface tokens — do not pick them up for UI.

## Using the components

Ten core components are documented here with static previews hand-written from their source; the rest of the 115-component library is listed under Inventory. Every component resolves its colours through `colors.<role>[theme].<variant>`: always pass the theme. The consumer supplies labels, children and handlers; variants, sizes and state colours come from the system.

Not synced: the extended Tailwind ramps in `colors.ts` (zinc through rose, 17 ramps) are not brand colours and are left out; the glass material stack, vibrant labels and iOS system grays are summarised by the `ios-*` and `bg-glass` tokens rather than carried in full; the `glassInset` shadow uses named colours the page cannot read; `Roboto Mono` is named as a family but the app ships no file for it; and the library's React Native components were not bundled — previews are static renditions of the source styles (read-only route).
