import type { ComponentType } from 'react'

export type NavItem = {
  title: string
  href: string
  description?: string
  tags?: string[]
  component?: ComponentType
}

export type NavSection = {
  id: string
  title: string
  items: NavItem[]
}

export const NAV_SECTIONS: NavSection[] = [
  {
    id: 'overview',
    title: 'Overview',
    items: [
      {
        title: 'Welcome',
        href: '/styleguide',
        description: 'Start here for conventions, IA, and usage of the showcase.',
        tags: ['getting-started', 'introduction'],
      },
      {
        title: 'Audit Summary',
        href: '/styleguide/audit',
        description: 'Machine-generated inventory of tech stack, tokens, and gaps.',
        tags: ['discovery', 'inventory'],
      },
      {
        title: 'Approval Queue',
        href: '/styleguide/approval-queue',
        description: 'Net-new items that need sign-off before implementation.',
        tags: ['workflow'],
      },
    ],
  },
  {
    id: 'basics',
    title: 'Basics',
    items: [
      {
        title: 'Design Tokens',
        href: '/styleguide/basics/design-tokens',
        description:
          'Color, spacing, radius, and typography primitives derived from Tamagui config.',
        tags: ['tokens', 'foundations'],
      },
      {
        title: 'Grid & Layout',
        href: '/styleguide/basics/grid',
        description: '12-column responsive grid utilities mapped to media queries.',
        tags: ['layout', 'responsive'],
      },
      {
        title: 'Typography',
        href: '/styleguide/basics/typography',
        description: 'Heading and body scale mapped to Inter font assets.',
        tags: ['type'],
      },
      {
        title: 'Colors',
        href: '/styleguide/basics/colors',
        description: 'Brand palette and status mappings for Bootstrap-style variants.',
        tags: ['palette'],
      },
      {
        title: 'Utilities',
        href: '/styleguide/basics/utilities',
        description: 'Spacing, display, and text helpers generated from tokens.',
        tags: ['helpers'],
      },
    ],
  },
  {
    id: 'forms',
    title: 'Forms',
    items: [
      {
        title: 'Inputs',
        href: '/styleguide/forms/inputs',
        description: 'Text fields, textareas, and masked input patterns.',
        tags: ['forms'],
      },
      {
        title: 'Selects',
        href: '/styleguide/forms/selects',
        description: 'Native and custom select menus with Tamagui Adapt.',
        tags: ['forms'],
      },
      {
        title: 'Checkboxes & Radios',
        href: '/styleguide/forms/choice',
        description: 'Boolean and multi-select controls with accessibility guidance.',
        tags: ['forms'],
      },
      {
        title: 'Input Groups',
        href: '/styleguide/forms/input-groups',
        description: 'Prefix/suffix add-ons aligned to Bootstrap 2 patterns.',
        tags: ['forms', 'layout'],
      },
      {
        title: 'Validation',
        href: '/styleguide/forms/validation',
        description: 'Inline, toast, and async validation examples and APIs.',
        tags: ['forms', 'validation'],
      },
      {
        title: 'Form Components Showcase',
        href: '/styleguide/forms',
        description: 'Interactive playground for complex composed form components.',
        tags: ['forms', 'playground'],
      },
    ],
  },
  {
    id: 'components',
    title: 'Components',
    items: [
      {
        title: 'Buttons',
        href: '/styleguide/components/buttons',
        description: 'Primary, secondary, ghost, and destructive patterns.',
        tags: ['cta'],
      },
      {
        title: 'Button Groups',
        href: '/styleguide/components/button-groups',
        description: 'Horizontal and vertical grouping with segmented control behaviour.',
        tags: ['cta', 'layout'],
      },
      {
        title: 'Dropdowns',
        href: '/styleguide/components/dropdowns',
        description: 'Menu triggers, placement, and keyboard support.',
        tags: ['menu'],
      },
      {
        title: 'Navigation',
        href: '/styleguide/components/navigation',
        description: 'Tabs, pills, and navbars mapped to Tamagui primitives.',
        tags: ['nav'],
      },
      {
        title: 'Breadcrumbs',
        href: '/styleguide/components/breadcrumbs',
        description: 'Hierarchy trails with truncation strategies.',
        tags: ['nav'],
      },
      {
        title: 'Pagination',
        href: '/styleguide/components/pagination',
        description: 'Offset and cursor pagination controls with size variants.',
        tags: ['nav'],
      },
      {
        title: 'Labels & Badges',
        href: '/styleguide/components/labels-badges',
        description: 'Status indicators with tone mappings.',
        tags: ['feedback'],
      },
      {
        title: 'Alerts',
        href: '/styleguide/components/alerts',
        description: 'Inline feedback panels, dismissible behaviours.',
        tags: ['feedback'],
      },
      {
        title: 'Progress',
        href: '/styleguide/components/progress',
        description: 'Determinate and indeterminate progress bars.',
        tags: ['feedback'],
      },
    ],
  },
  {
    id: 'data-display',
    title: 'Data Display',
    items: [
      {
        title: 'Tables',
        href: '/styleguide/data-display/tables',
        description: 'Striped, bordered, and condensed variants built from DataTable.',
        tags: ['data'],
      },
      {
        title: 'Lists',
        href: '/styleguide/data-display/lists',
        description: 'Definition, media, and actionable list patterns.',
        tags: ['data'],
      },
      {
        title: 'Media Object',
        href: '/styleguide/data-display/media-object',
        description: 'Avatar-driven media components with alignment rules.',
        tags: ['layout'],
      },
      {
        title: 'Charts',
        href: '/styleguide/data-display/charts',
        description: 'Comprehensive chart catalogue leveraging @unicornlove/ui primitives.',
        tags: ['data', 'visualization'],
      },
    ],
  },
  {
    id: 'overlays',
    title: 'Overlays',
    items: [
      {
        title: 'Modal',
        href: '/styleguide/overlays/modal',
        description: 'Responsive modal wrapper with focus trap expectations.',
        tags: ['overlay'],
      },
      {
        title: 'Tooltip & Popover',
        href: '/styleguide/overlays/tooltip-popover',
        description: 'Hover and click triggered overlays with arrow positioning.',
        tags: ['overlay'],
      },
    ],
  },
  {
    id: 'utilities',
    title: 'Utilities',
    items: [
      {
        title: 'Search',
        href: '/styleguide/utilities/search',
        description: 'Client-side search indexing for the showcase.',
        tags: ['search'],
      },
      {
        title: 'Accessibility',
        href: '/styleguide/utilities/accessibility',
        description: 'WCAG alignment, focus management, and screen reader helpers.',
        tags: ['a11y'],
      },
    ],
  },
  {
    id: 'examples',
    title: 'Examples',
    items: [
      {
        title: 'Dashboard',
        href: '/styleguide/examples/dashboard',
        description: 'Data-rich dashboard sample using cards, tables, and charts.',
        tags: ['layout', 'example'],
      },
      {
        title: 'Marketing Page',
        href: '/styleguide/examples/marketing',
        description: 'Hero, feature grid, and testimonials layout.',
        tags: ['example'],
      },
      {
        title: 'Sign-In',
        href: '/styleguide/examples/sign-in',
        description: 'Authentication form with social providers.',
        tags: ['example', 'forms'],
      },
      {
        title: 'Pricing',
        href: '/styleguide/examples/pricing',
        description: 'Tiered pricing table with call-to-action emphasis.',
        tags: ['example'],
      },
      {
        title: 'Settings',
        href: '/styleguide/examples/settings',
        description: 'Account settings layout combining forms and lists.',
        tags: ['example'],
      },
    ],
  },
  {
    id: 'changelog',
    title: 'Changelog',
    items: [
      {
        title: 'Release Notes',
        href: '/styleguide/changelog',
        description: 'Document updates to the design system and showcase.',
        tags: ['history'],
      },
    ],
  },
]

export const FLAT_NAV_ITEMS = NAV_SECTIONS.flatMap((section) => section.items)
