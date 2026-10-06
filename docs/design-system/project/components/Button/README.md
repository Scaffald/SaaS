# Button

One filled `primary` button per view, for the thing the view is for; everything else is `outline` gray or `text`. Hand-written from `packages/ui/src/components/Button`.

- **Variants** `filled` · `outline` · `light` · `text` · `glass`, each in `gray` · `primary` · `success` · `error`. The iOS 26 trio `bordered-prominent` · `bordered` · `borderless` uses `ios-accent-blue` (red when `destructive`) and belongs to native sheets.
- **Sizes** sm 36px, md and lg 44px (the 44pt touch minimum). Labels are `small-medium` (12.5/19, 500); sm uses `caption`. Icons 18 / 20 / 22.
- **Shape** `radius-xs` (4px); filled buttons carry `shadow-button`.
- **Colour** filled primary is `primary-600` with `white` (6.7:1), hover `primary-700`, pressed `primary-800`; outline gray is `gray-300` border on `surface-input` with `text-primary`; light is ramp 100 fill with ramp 700 text (6.5:1).
- **Disabled** filled drops to ramp 200 with white text and no shadow — decorative, so pair with a reason in helper text.
- The consumer supplies the label (verb first, sentence case), `onPress`, and optionally `iconStart` / `iconEnd` (a Lucide component), `loading`, `fullWidth`.
