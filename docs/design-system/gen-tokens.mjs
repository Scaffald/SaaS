import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const src = fs.readFileSync(ROOT + '/packages/ui/src/tokens/colors.ts','utf8')
// pull the 2-space-indented ramp blocks
const ramps = {}
const re = /^  (\w+): \{\n([\s\S]*?)^  \},/gm
let m
while ((m = re.exec(src))) {
  const pairs = [...m[2].matchAll(/^\s{4}(\d+): '(#[0-9a-fA-F]{6})'/gm)]
  if (pairs.length) ramps[m[1]] = Object.fromEntries(pairs.map(p => [p[1], p[2].toLowerCase()]))
}
const keep = ['primary','gray','neutral','info','success','warning','error']
for (const k of keep) if (!ramps[k]) throw new Error('missing ramp '+k)

const rampUsage = {
  primary: 'Brand teal. 500 is the logo teal and the default border-active/focus; 600 fills primary buttons and marks active tabs (6.7:1 with white); 300 is the dark-theme emphasis step (7.7:1 on gray-900); 50/100 tint selected rows and the light button.',
  gray: 'Warm stone neutrals — the ground of every screen. 50/100 are surfaces, 200/300 hairlines, 500 tertiary text, 700 body copy, 900 ink and the dark-theme page.',
  neutral: 'Warm sand neutrals from the Figma source. Used only for tinted imagery and warm panels; the UI’s neutrals are the gray ramp.',
  info: 'Slate blue for informational states: border-info, fg-info, StatusIndicator help.',
  success: 'Moss green. 500 for success borders, icons and the Toggle red-green on state; 600 fills success buttons (7.1:1 with white).',
  warning: 'The single amber. Serves two named jobs and no third: warning (caution) and attention (act on this: overdue, over-SLA). 700 is the light-theme attention text (6.7:1 on white), 400 the dark-theme one.',
  error: 'Terracotta. 500 for error borders, helper text (5.0:1 on white) and icons; 600 fills error buttons (7.1:1 with white).',
}
const tokens = []
const add = (name, value, usage) => tokens.push({ name, value, usage })
for (const k of keep) {
  const steps = Object.keys(ramps[k]).map(Number).sort((a,b)=>a-b)
  steps.forEach((s, i) => add(`${k}-${s}`, ramps[k][s], i === 0 ? rampUsage[k] : (s === 500 ? `${k} base step.` : `${k} ramp step ${s}.`)))
}
add('white', '#ffffff', 'Base/0. The light page, filled-button labels, the toggle thumb, text on gray-900 chips.')
add('black', '#000000', 'Only inside overlays and shadows (bg-overlay is black at 50%).')

const T = (light, dark) => ({ light, dark })
// Text
add('text-primary', T('{gray-900}', '{white}'), 'Titles and primary copy on bg-default, bg-subtle, bg-muted and surface-card: 18.8:1 in both themes.')
add('text-secondary', T('{gray-700}', '{gray-200}'), 'Body paragraphs and StatusIndicator labels on bg-default/bg-subtle: 12.1:1 light, 14.1:1 dark (11.0:1 on surface-card dark).')
add('text-tertiary', T('{gray-500}', '{gray-400}'), 'Secondary text, helper text, metric kickers and inactive tabs on bg-default/bg-subtle: 5.6:1 light, 6.5:1 dark (5.0:1 on surface-card dark).')
add('text-disabled', T('{gray-300}', '{gray-600}'), 'Disabled labels only. Decorative by design: 1.7:1 light, 2.1:1 dark — never carry information in it.')
add('text-inverse', T('{white}', '{gray-900}'), 'Text on the opposite ground: a selected chip (gray-900 fill, 18.8:1), filled gray buttons.')
add('text-emphasis', T('{primary-600}', '{primary-300}'), 'Links, active nav, the figure in an emphasised metric: 6.7:1 on white, 6.3:1 on bg-subtle; 7.7:1 on gray-900.')
add('text-attention', T('{warning-700}', '{warning-400}'), '“Act on this”: overdue, over-SLA, stale in stage. Never for errors. 6.7:1 on white, 6.1:1 on bg-attention; 9.3:1 on gray-900, 7.0:1 on dark bg-attention.')
// Backgrounds
add('bg-default', T('{white}', '{gray-900}'), 'The page.')
add('bg-subtle', T('{gray-50}', '{gray-800}'), 'Secondary surfaces: panels, sections, hovered outline buttons, the dark-theme input well.')
add('bg-muted', T('{gray-100}', '{gray-750}'), 'Tertiary surfaces: tooltips, badges, the light gray button; the dark-theme card.')
add('bg-emphasis', T('{gray-200}', '{gray-700}'), 'Surfaces that need more weight; the selected default-type tab.')
add('bg-active', T('{gray-300}', '{gray-600}'), 'Active or hovered surfaces.')
add('bg-selected', T('{primary-50}', '#0a3540'), 'A selected row or item. text-primary reads 17:1 light, 13:1 dark on it.')
add('bg-attention', T('{warning-100}', '{warning-900}'), 'The wash behind an over-SLA row or a transparency banner; pair with text-attention and border-attention.')
add('bg-disabled', T('{gray-100}', '{gray-900}'), 'Disabled inputs and controls (dark: one shade darker than the page, suppressed).')
add('bg-overlay', 'rgba(0, 0, 0, 0.5)', 'The scrim under modals, sheets and dialogs.')
add('bg-glass', T('rgba(255, 255, 255, 0.7)', 'rgba(30, 25, 20, 0.7)'), 'Glass card fill on web, under backdrop-filter blur(50px) saturate(180%).')
add('bg-glass-fallback', T('rgba(249, 248, 246, 0.88)', 'rgba(30, 25, 20, 0.88)'), 'Glass card fill on native, where there is no backdrop-filter.')
add('bg-drawer-nav-active', '#5a778a', 'The active item in the drawer/sidebar — a blue-grey the brand has nowhere else. White text and icon on it: 4.7:1.')
add('surface-card', T('{white}', '{gray-750}'), 'Card fill (Card.styles.ts). Dark cards sit one shade lighter than the page so inputs read as inset.')
add('surface-input', T('{white}', '{gray-800}'), 'Input and outline-button fill (Input.styles.ts). Dark inputs are one shade darker than a card.')
// Borders
add('border-default', T('{gray-200}', '{gray-500}'), 'The hairline: dividers, input and card borders, MetricRow rules. Light is 1.3:1 — a hairline, not a meaningful mark; dark is 3.4:1 on the page.')
add('border-subtle', T('{gray-100}', '{gray-700}'), 'Outlined cards and the most delicate separation.')
add('border-muted', T('{gray-300}', '{gray-600}'), 'Hovered inputs and gray outline buttons.')
add('border-emphasis', T('{gray-400}', '{gray-400}'), 'Borders that must be seen: 2.9:1 on white, 4.4:1 on gray-900.')
add('border-active', '{primary-500}', 'Hovered or active controls.')
add('border-selected', '{primary-500}', 'Selected controls.')
add('border-focus', '{primary-500}', 'Focused inputs and buttons (Input uses primary-600 on web).')
add('border-disabled', T('{gray-200}', '{gray-700}'), 'Disabled controls.')
add('border-error', '{error-500}', 'Invalid inputs, error checkboxes.')
add('border-warning', T('{warning-600}', '{warning-500}'), 'Warning state outline.')
add('border-success', '{success-500}', 'Success state outline.')
add('border-info', '{info-500}', 'Informational outline.')
add('border-attention', T('{warning-600}', '{warning-500}'), 'The amber rule around an over-SLA row or chip.')
add('border-ghost', T('rgba(176, 179, 173, 0.2)', 'rgba(110, 103, 96, 0.2)'), 'Barely-there outline for glass cards and glass buttons.')
// Foreground (non-text marks)
add('fg-default', T('{gray-900}', '{white}'), 'Primary non-text marks: checks, rules drawn in ink.')
add('fg-subtle', T('{gray-700}', '{gray-200}'), 'Subtle marks.')
add('fg-muted', T('{gray-500}', '{gray-400}'), 'Muted marks and the default Icon colour.')
add('fg-emphasis', T('{gray-400}', '{gray-500}'), 'Marks needing more weight than muted.')
add('fg-active', T('{primary-600}', '{primary-300}'), 'Active or hovered marks. The teal ramp inverts for dark: primary-500 was only 3.4:1 on gray-900, so dark uses 300 (7.7:1).')
add('fg-selected', T('{primary-600}', '{primary-300}'), 'Selected marks; same inversion as fg-active.')
add('fg-disabled', T('{gray-300}', '{gray-600}'), 'Disabled marks.')
add('fg-error', '{error-500}', 'Error marks: 5.0:1 on white, 3.8:1 on gray-900 (icon floor).')
add('fg-warning', T('{warning-600}', '{warning-500}'), 'Warning marks: 4.4:1 on white, 6.4:1 on gray-900.')
add('fg-attention', T('{warning-700}', '{warning-400}'), '“Act on this” marks beside text-attention.')
add('fg-success', '{success-500}', 'Success marks and the positive Metric delta: 5.0:1 on white, 3.8:1 on gray-900.')
add('fg-info', '{info-500}', 'Informational marks: 5.2:1 on white, 3.6:1 on gray-900.')
// Icons
add('icon-default', T('{gray-900}', '{white}'), 'Icons drawn in ink.')
add('icon-subtle', T('{gray-700}', '{gray-200}'), 'Subtle icons.')
add('icon-muted', T('{gray-500}', '{gray-400}'), 'Muted icons; the Input leading/trailing icon.')
add('icon-emphasis', T('{gray-400}', '{gray-500}'), 'Icons with more weight than muted.')
add('icon-active', '{primary-500}', 'Active icons. Source keeps primary-500 in both themes: 3.4:1 on gray-900, just at the icon floor — prefer fg-active (primary-300) in dark.')
add('icon-selected', '{primary-500}', 'Selected icons; same caveat as icon-active.')
add('icon-disabled', T('{gray-300}', '{gray-600}'), 'Disabled icons.')
add('icon-error', '{error-500}', 'Error icons.')
add('icon-warning', '#9a6614', 'Warning icons. An older ochre the warning ramp no longer contains (4.9:1 on white) — the source keeps it; prefer fg-warning for new work.')
add('icon-success', '{success-500}', 'Success icons.')
add('icon-info', '{info-500}', 'Informational icons.')
// Focus
add('focus-ring', '{primary-300}', 'Keyboard focus on web (global.css): a 2px solid outline, 2px offset, 4px radius, on :focus-visible only. 7.7:1 on gray-900 but 2.4:1 on white — below the 3:1 mark floor on the light page; the source ships it anyway. Inputs add the focus-primary shadow instead.')
// iOS 26 native tokens
add('ios-accent-blue', T('#0088ff', '#0a84ff'), 'iOS 26 system tint for the bordered / bordered-prominent / borderless Button variants and ActionSheet. Native sheets, alerts and menus only.')
add('ios-accent-red', T('#ff383c', '#ff453a'), 'iOS 26 destructive tint.')
add('ios-accent-green', T('#34c759', '#30d158'), 'iOS 26 system green.')
add('ios-accent-orange', T('#ff9500', '#ff9f0a'), 'iOS 26 system orange.')
add('ios-fill-primary', T('rgba(120, 120, 128, 0.2)', 'rgba(120, 120, 128, 0.36)'), 'iOS 26 control fill, strongest.')
add('ios-fill-secondary', T('rgba(120, 120, 128, 0.16)', 'rgba(120, 120, 128, 0.32)'), 'iOS 26 bordered Button and alert text-field fill.')
add('ios-fill-tertiary', T('rgba(118, 118, 128, 0.12)', 'rgba(118, 118, 128, 0.24)'), 'iOS 26 control fill, lighter.')
add('ios-fill-quaternary', T('rgba(116, 116, 128, 0.08)', 'rgba(118, 118, 128, 0.18)'), 'iOS 26 control fill, lightest.')
add('ios-label-primary', T('#000000', '#ffffff'), 'Label on iOS 26 vibrant and glass surfaces.')
add('ios-label-secondary', T('rgba(60, 60, 67, 0.6)', 'rgba(235, 235, 245, 0.6)'), 'Secondary label on iOS 26 surfaces.')
add('ios-label-tertiary', T('rgba(60, 60, 67, 0.3)', 'rgba(235, 235, 245, 0.3)'), 'Tertiary label on iOS 26 surfaces.')
add('ios-label-quaternary', T('rgba(60, 60, 67, 0.18)', 'rgba(235, 235, 245, 0.18)'), 'Quaternary label on iOS 26 surfaces.')
add('ios-separator-opaque', T('#c6c6c8', '#38383a'), 'iOS 26 opaque separator.')
add('ios-separator-vibrant', T('#e6e6e6', 'rgba(255, 255, 255, 0.15)'), 'iOS 26 separator on glass; the Alert’s button divider.')

// validate names unique + pattern
const seen = new Set()
for (const t of tokens) { if (!/^[A-Za-z0-9][A-Za-z0-9_.-]{0,63}$/.test(t.name)) throw new Error('bad name '+t.name); if (seen.has(t.name)) throw new Error('dup '+t.name); seen.add(t.name) }
// validate aliases resolve
const names = seen
for (const t of tokens) { const vals = typeof t.value === 'string' ? [t.value] : Object.values(t.value); for (const v of vals) { const a = /^\{(.+)\}$/.exec(v); if (a && !names.has(a[1])) throw new Error('alias to missing '+a[1]+' in '+t.name) } }

const type = {
  fonts: [
    { family: 'Roboto', file: 'fonts/Roboto-Regular.woff2', weight: '400', style: 'normal' },
    { family: 'Roboto', file: 'fonts/Roboto-Medium.woff2', weight: '500', style: 'normal' },
    { family: 'Roboto', file: 'fonts/Roboto-Bold.woff2', weight: '700', style: 'normal' },
    { family: 'Roboto Serif', file: 'fonts/RobotoSerif-Regular.woff2', weight: '400', style: 'normal' },
    { family: 'Scaffald Display', file: 'fonts/CormorantGaramond-Variable.woff2', weight: '300 700', style: 'normal' },
  ],
  families: {
    sans: 'Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
    display: '"Scaffald Display", Georgia, "Times New Roman", serif',
    serif: '"Roboto Serif", Georgia, serif',
    mono: '"Roboto Mono", ui-monospace, Menlo, monospace',
  },
  groups: [
    { name: 'Headings', family: 'display', note: 'The six-step interface scale plus one display size. Display face on web only; native headings stay on Roboto until the serif is proven legible on a phone outdoors.', styles: [
      { name: 'h1', fontSize: '42px', lineHeight: '47px', fontWeight: 700, letterSpacing: '0.4px', sample: 'Find the crew for the job', usage: 'Page titles only. The one display size.' },
      { name: 'h2', fontSize: '30px', lineHeight: '34px', fontWeight: 700, letterSpacing: '0.38px', sample: 'Applications this week', usage: 'Section titles; the figure in a MetricBlock (semibold, tabular numerals).' },
      { name: 'h3', fontSize: '22px', lineHeight: '26px', fontWeight: 600, letterSpacing: '0px', sample: 'Pipeline by stage', usage: 'Card and panel titles.' },
      { name: 'h4', fontSize: '17px', lineHeight: '20px', fontWeight: 600, letterSpacing: '-0.1px', sample: 'Site foreman, Oakland', usage: 'Row and list-item titles.' },
      { name: 'h5', fontSize: '14px', lineHeight: '18px', fontWeight: 600, letterSpacing: '-0.1px', sample: 'Documents', usage: 'Body-size heading carried by weight alone, as Apple’s Headline is.' },
      { name: 'h6', fontSize: '11px', lineHeight: '16px', fontWeight: 500, letterSpacing: '-0.1px', sample: 'OVER SLA', usage: 'The uppercase letterspaced kicker above a title or a metric figure — smaller than body on purpose. MetricBlock tracks it at 1.2px.' },
    ] },
    { name: 'Text', family: 'sans', note: 'Body leads at ~1.55, headings at ~1.15. 12.5px is a step of the scale, not a half-step: native rounds it, web does not.', styles: [
      { name: 'subtitle', fontSize: '22px', lineHeight: '34px', fontWeight: 400, letterSpacing: '-0.1px', sample: 'Three new matches since Monday', usage: 'Lead paragraph under a page title.' },
      { name: 'large', fontSize: '17px', lineHeight: '26px', fontWeight: 400, letterSpacing: '-0.2px', sample: 'Your profile is visible to employers in your trade.', usage: 'Paragraph L: long-form reading, onboarding copy.' },
      { name: 'body', fontSize: '14px', lineHeight: '22px', fontWeight: 400, letterSpacing: '-0.15px', sample: 'Applied 3 days ago · Awaiting screening', usage: 'Paragraph M — the default for everything. Input addon text.' },
      { name: 'body-medium', fontSize: '14px', lineHeight: '22px', fontWeight: 500, letterSpacing: '-0.15px', sample: 'Applied 3 days ago', usage: 'Emphasised body; Button, Chip and Tab labels take this weight at their own sizes. Native has no 600: semibold renders as Roboto-Medium.' },
      { name: 'body-bold', fontSize: '14px', lineHeight: '22px', fontWeight: 600, letterSpacing: '-0.15px', sample: 'Applied 3 days ago', usage: 'Strong body (paragraphMSemiBold).' },
      { name: 'small', fontSize: '12.5px', lineHeight: '19px', fontWeight: 400, letterSpacing: '0px', sample: '12 candidates · sorted by response time', usage: 'Paragraph S: input text, helper text, Button md/lg labels, Metric deltas, Tab labels.' },
      { name: 'small-medium', fontSize: '12.5px', lineHeight: '19px', fontWeight: 500, letterSpacing: '0px', sample: 'Filters & sort', usage: 'Input labels, Tab labels, Chip md/lg labels.' },
      { name: 'caption', fontSize: '12.5px', lineHeight: '19px', fontWeight: 400, letterSpacing: '0.1px', sample: 'Updated 2 min ago', usage: 'Metadata and timestamps; Button sm and Chip sm labels. Same size as small, looser tracking.' },
      { name: 'caption-medium', fontSize: '12.5px', lineHeight: '19px', fontWeight: 500, letterSpacing: '0.1px', sample: 'Updated 2 min ago', usage: 'Emphasised metadata.' },
      { name: 'xxs', fontSize: '11px', lineHeight: '17px', fontWeight: 400, letterSpacing: '0px', sample: 'Sample size 25', usage: 'The smallest text: fine print, chart axes.' },
    ] },
    { name: 'Serif', family: 'serif', note: 'Roboto Serif is the body serif (the `serif` prop). It never sets headings — that is the display face.', styles: [
      { name: 'body-serif', fontSize: '14px', lineHeight: '22px', fontWeight: 400, letterSpacing: '-0.15px', sample: 'A note from the employer, in their words.', usage: 'Quoted copy and applicant quotes.' },
      { name: 'large-serif', fontSize: '17px', lineHeight: '26px', fontWeight: 400, letterSpacing: '-0.2px', sample: 'A note from the employer, in their words.', usage: 'Longer quoted passages.' },
    ] },
  ],
}

const sp = {
  0:'None.', 2:'The finest gap; also the smallest radius.', 4:'Icon-to-label gap, Metric block gap, Input label-to-field gap (padding xs, gap xs, inset xs).',
  6:'Button sm vertical padding, Chip sm horizontal padding, Tabs sm vertical (padding sm, gap sm).', 8:'Button gap, Input vertical padding, Chip md padding, the divider-to-content gap (padding md, gap md, inset sm).',
  10:'Button lg vertical padding, Chip lg horizontal padding (padding lg).', 12:'Input horizontal padding, Tabs lg vertical, Card padding md (padding xl, gap lg, inset md).',
  16:'Button sm horizontal, Tabs horizontal padding, Card padding lg (padding 2xl, gap xl, inset lg).', 20:'Button md horizontal padding (padding 3xl, inset xl).',
  24:'Button lg horizontal, Card padding xl; between sections (gap 2xl, inset 2xl).', 28:'gap 3xl.', 32:'Card padding 2xl; page gutters (padding 4xl, gap 4xl, inset 3xl).',
  40:'Large section gaps (padding 5xl, gap 5xl).', 48:'padding 6xl.', 64:'gap 6xl.', 80:'gap 7xl.', 96:'gap 8xl.', 128:'gap 9xl.', 160:'namedSpacing 4xl.',
  192:'Layout width.', 224:'Layout width.', 256:'Layout width.', 320:'Layout width: the narrowest phone column.', 384:'Layout width.', 512:'Layout width.', 640:'Layout width; MetricRow stacks below it.', 768:'Layout width: the sm container.',
}
const spacing = { note: 'The Figma 27-step primitive scale, in px. Only these indices exist — spacing[3] is not a thing; write the literal.', tokens: Object.keys(sp).map(k => ({ name: `space-${k}`, value: `${k}px`, usage: sp[k] })) }

const radius = { note: 'Three interface steps — 2 · 4 · 7 — and a pill. Corners stay nearly square; hairlines and whitespace do the separating. The iOS 26 radii belong to native sheets, alerts and menus only.', tokens: [
  { name: 'radius-none', value: '0px', usage: 'Line-type inputs.' },
  { name: 'radius-xxxs', value: '2px', usage: 'Interface step 1 (`xxxs`, `xxs`): the sm checkbox.' },
  { name: 'radius-xs', value: '4px', usage: 'Interface step 2 (`xs`, `s`, `m`, `sm`, `md`): buttons, checkboxes, the focus outline.' },
  { name: 'radius-l', value: '7px', usage: 'Interface step 3 (`l` through `xxxxl`, `lg` through `4xl` all resolve here): inputs, cards, panels.' },
  { name: 'radius-max', value: '999px', usage: 'Pills: chips, toggles, avatars.' },
  { name: 'radius-ios-sheet', value: '34px', usage: 'iOS 26 action sheet and alert corners.' },
  { name: 'radius-ios-menu-action', value: '20px', usage: 'iOS 26 context-menu quick action.' },
  { name: 'radius-ios-alert-field', value: '26px', usage: 'iOS 26 alert text field.' },
  { name: 'radius-ios-menu-container', value: '30px', usage: 'iOS 26 context-menu container.' },
  { name: 'radius-ios-pill', value: '100px', usage: 'iOS 26 pill button.' },
] }

const shadow = { note: 'Ink-tinted (gray-900) and quiet. The same strings serve both themes; cards are the main consumer, and the prototype direction is to need them less.', tokens: [
  { name: 'shadow-xs', value: '0 1px 2px 0 rgba(22, 17, 13, 0.051)', usage: 'Raised: Card elevation sm.' },
  { name: 'shadow-s', value: '0 1px 3px 0 rgba(22, 17, 13, 0.078)', usage: 'Floating: Card elevation md, chips.' },
  { name: 'shadow-m', value: '0 4px 6px -1px rgba(22, 17, 13, 0.078)', usage: 'Modal dialogs, dropdowns; Card elevation lg.' },
  { name: 'shadow-l', value: '0 10px 15px -3px rgba(22, 17, 13, 0.078)', usage: 'Drawers and side sheets.' },
  { name: 'shadow-xl', value: '0 20px 25px -5px rgba(22, 17, 13, 0.102)', usage: 'Large overlays.' },
  { name: 'shadow-xxl', value: '0 25px 50px -12px rgba(22, 17, 13, 0.251)', usage: 'Top-level overlays, maximum elevation.' },
  { name: 'shadow-button', value: '0 1px 2px 0 rgba(22, 17, 13, 0.039)', usage: 'Filled buttons and classic inputs at rest.' },
  { name: 'shadow-tabs', value: '0 1px 3px 0 rgba(22, 17, 13, 0.051)', usage: 'The selected shadow-type tab.' },
  { name: 'shadow-soft', value: '0 2px 24px -4px rgba(0, 0, 0, 0.04)', usage: 'Wide, airy: dashboard and profile cards (Card elevation soft).' },
  { name: 'shadow-glass', value: '0 1px 12px -2px rgba(22, 17, 13, 0.06)', usage: 'Glass cards.' },
  { name: 'shadow-glass-elevated', value: '0 8px 32px -4px rgba(0, 0, 0, 0.12), 0 2px 8px -2px rgba(0, 0, 0, 0.08)', usage: 'Floating glass panels.' },
  { name: 'shadow-ios-sheet', value: '0 8px 40px 0 rgba(0, 0, 0, 0.12)', usage: 'iOS 26 sheet, alert and menu.' },
  { name: 'focus-base', value: '0 0 0 4px rgba(206, 210, 218, 1), 0 0 0 2px rgba(255, 255, 255, 1)', usage: 'Neutral focus ring: a 2px white gap then a 2px gray ring (web only; native uses borders).' },
  { name: 'focus-primary', value: '0 0 0 4px rgba(127, 209, 222, 1), 0 0 0 2px rgba(255, 255, 255, 1)', usage: 'Brand focus ring on focused inputs: white gap then primary-200.' },
  { name: 'focus-error', value: '0 0 0 4px rgba(229, 142, 128, 1), 0 0 0 2px rgba(255, 255, 255, 1)', usage: 'Error focus ring: white gap then error-300.' },
] }

const borderWidth = { note: 'Hairlines are 1px (StyleSheet.hairlineWidth on native for MetricRow rules).', tokens: [
  { name: 'border-width-thin', value: '1px', usage: 'Every default border, divider and input outline.' },
  { name: 'border-width-medium', value: '2px', usage: 'The line-tab indicator and the focus outline.' },
  { name: 'border-width-thick', value: '3px', usage: 'Emphasis dividers.' },
  { name: 'border-width-heavy', value: '4px', usage: 'Reserved.' },
] }
const breakpoint = { note: 'Min-width breakpoints; useResponsive() exposes them. Mobile is < 800, tablet 800–1019, desktop ≥ 1280.', tokens: [
  { name: 'breakpoint-xs', value: '660px', usage: 'Large phones.' },
  { name: 'breakpoint-sm', value: '800px', usage: 'Tablet begins; the drawer becomes persistent.' },
  { name: 'breakpoint-md', value: '1020px', usage: 'Small laptop.' },
  { name: 'breakpoint-lg', value: '1280px', usage: 'Desktop begins.' },
  { name: 'breakpoint-xl', value: '1420px', usage: 'Wide desktop.' },
  { name: 'breakpoint-xxl', value: '1600px', usage: 'Widest.' },
  { name: 'container-xs', value: '640px', usage: 'Content max-width at xs.' },
  { name: 'container-sm', value: '768px', usage: 'Content max-width at sm.' },
  { name: 'container-md', value: '1024px', usage: 'Content max-width at md.' },
  { name: 'container-lg', value: '1280px', usage: 'Content max-width at lg.' },
  { name: 'container-xl', value: '1400px', usage: 'Content max-width at xl.' },
  { name: 'container-xxl', value: '1536px', usage: 'Content max-width at xxl.' },
] }

const out = {
  name: 'Scaffald', version: 1,
  meta: { source: 'github', repo: 'Scaffald/SaaS', ref: 'main@9ef9b151c', package: 'packages/ui',
    paths: { tokens: ['packages/ui/src/tokens/colors.ts','packages/ui/src/tokens/typography.ts','packages/ui/src/tokens/spacing.ts','packages/ui/src/tokens/borders.ts','packages/ui/src/tokens/shadows.ts','packages/ui/src/tokens/breakpoints.ts','packages/ui/src/tokens/animations.ts','apps/scaffald/global.css'],
      fonts: ['apps/scaffald/public/fonts/'], assets: ['apps/scaffald/assets/', 'redesign/logo.svg', 'redesign/logo-mark.svg'], docs: ['.radium/scaffald-ui.md','packages/ui/README.md'] },
    components: { Button: 'packages/ui/src/components/Button', Input: 'packages/ui/src/components/Input', Card: 'packages/ui/src/components/Card', Chip: 'packages/ui/src/components/Chip', Metric: 'packages/ui/src/components/Metric', Tabs: 'packages/ui/src/components/Tabs', Checkbox: 'packages/ui/src/components/Checkbox', Toggle: 'packages/ui/src/components/Toggle', StatusIndicator: 'packages/ui/src/components/StatusIndicator', Heading: 'packages/ui/src/components/Typography' },
    synced: '2026-10-06' },
  color: { themes: [{ id: 'light', name: 'Light' }, { id: 'dark', name: 'Dark' }], tokens },
  type, spacing, radius, shadow, borderWidth, breakpoint,
}
fs.writeFileSync(ROOT + '/docs/design-system/project/tokens.json', JSON.stringify(out, null, 2))
console.log('colors', tokens.length, 'styles', type.groups.reduce((n,g)=>n+g.styles.length,0), 'spacing', spacing.tokens.length)
