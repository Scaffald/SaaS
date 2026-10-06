# Heading

The typography components: `Heading` levels 1–6, plus `Text`, `Paragraph`, `Label` and `Caption`, all resolving colour through the theme. Hand-written from `packages/ui/src/components/Typography`.

- **Levels** map one-to-one onto the Headings group: `h1` 42/47 bold is the page title, `h2` 30/34 bold a section, `h3` 22/26 and `h4` 17/20 semibold for cards and rows, `h5` body-sized by weight, `h6` the 11px uppercase kicker. Letter-spacing per level: 0.4 · 0.38 · 0 · −0.1 · −0.1 · −0.1.
- **Face** headings take the `display` serif on web and Roboto on native; `serif` on a Paragraph or Text means `Roboto Serif`, never the display face.
- **Colour** `primary` by default; `secondary`, `tertiary`, `disabled`, `error`, `success`, `warning`, or `inherit` to pick up a parent's colour (a filled button's label). Caption defaults to `secondary`.
- **Sizes** on Text and Paragraph: `xxs` 11 · `xs` / `sm` 12.5 · `md` 14 · `lg` 17 · `xl` / `2xl` 22. Weights `regular` · `medium` · `semibold` · `bold`.
- The consumer supplies the words and, for Heading, the `level` that matches the document outline — not the size they want.
