# Scaffald Design System — source

The published system is a **Design System** artifact on claude.ai:
<https://claude.ai/code/artifact/f524dfb4-da31-4024-ac5e-73e63d10a560>
(first synced 2026-10-06 from `main@9ef9b151c`). It is the brief for anything that
should look like Scaffald: tokens in light and dark, the type scale with real
font files, spacing / radii / shadows / breakpoints, a brand-book README, ten
core components with guidelines and static previews, and the logos.

`project/` is the system's own content as published, minus the binaries that
already live elsewhere in the repo (fonts under `apps/scaffald/public/fonts`,
raster logos under `apps/scaffald/assets`). Everything in it was extracted from
`packages/ui/src/tokens`, the component `*.styles.ts` files and
`apps/scaffald/global.css` — nothing is invented, and each token's usage note
carries the contrast it was measured at.

## Regenerate and republish

```bash
node docs/design-system/build.mjs
```

That rewrites `project/tokens.json` from `packages/ui/src/tokens/colors.ts`
(the ramps are parsed from the source; the semantic tokens, type scale,
spacing, radii and shadows are declared in `gen-tokens.mjs` — update them
there when the source changes) and stages a complete publish folder at
`tmp-design-system/` (gitignored), with `files-map.json` ready for the
Artifact tool.

Publishing is a Claude Code step, not a CLI one. In a session with the
Artifact tool, follow the type's revising order: read the artifact's
`project/design-system.json`, send the changed files with
`root: "tmp-design-system"`, and send the index last. Two quirks: `root` must
be inside the repo checkout, and `index.d.ts` needs
`contentType: "text/plain"` (the files map already does this). Uploads
(SVG/PNG logos) are referenced by the blob ids recorded in
`project/design-system.json`; re-upload only if a logo file changes.

## What is deliberately not in the system

- The extended Tailwind ramps in `colors.ts` (zinc … rose) — not brand colours.
- The full Liquid Glass material stack and vibrant labels — summarised by the
  `bg-glass` and `ios-*` tokens.
- The `glassInset` shadow (uses named colours the page cannot read) and the
  motion durations (the page has no motion family; they are in the README).
- A live React bundle. Previews are static renditions hand-written from the
  style files; building `components/bundle.js` from the React Native Web
  library is the obvious next step and would need the package build run.

## Sources

| System file | Source |
| --- | --- |
| `project/tokens.json` → color | `packages/ui/src/tokens/colors.ts`, `apps/scaffald/global.css` (focus ring) |
| `project/tokens.json` → type | `packages/ui/src/tokens/typography.ts`, `apps/scaffald/global.css` (`@font-face`) |
| `project/tokens.json` → spacing, radius, shadow, borderWidth, breakpoint | `spacing.ts`, `borders.ts`, `shadows.ts`, `breakpoints.ts` |
| `project/components/*` | `packages/ui/src/components/<Comp>/*.styles.ts`, `*.types.ts` |
| `project/assets/Logos/*.svg` | the brand mark and wordmark (first checked in here) |
