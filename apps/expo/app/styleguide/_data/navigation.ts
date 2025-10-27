import type { ReactNode } from 'react'

export type NavGroup = {
  id: string
  title: string
  items: NavItem[]
}

export type NavItem = {
  slug: string
  title: string
  description?: string
  path: string
  icon?: ReactNode
}

export const navGroups: NavGroup[] = [
  {
    id: 'basics',
    title: 'Basics',
    items: [
      {
        slug: 'getting-started',
        title: 'Getting Started',
        path: '/styleguide/basics/getting-started',
        description: 'How to run the styleguide locally and integrate components.',
      },
      {
        slug: 'design-tokens',
        title: 'Design Tokens',
        path: '/styleguide/basics/design-tokens',
        description: 'Source-of-truth tokens for color, spacing, typography, and radii.',
      },
      {
        slug: 'grid',
        title: 'Grid & Layout',
        path: '/styleguide/basics/grid',
        description: 'Responsive 12-column grid inspired by Bootstrap 2.',
      },
      {
        slug: 'typography',
        title: 'Typography',
        path: '/styleguide/basics/typography',
        description: 'Heading hierarchy and body copy scaled to our Inter tokens.',
      },
      {
        slug: 'colors',
        title: 'Color System',
        path: '/styleguide/basics/colors',
        description: 'Brand and semantic color usage mapped from tokens.',
      },
      {
        slug: 'utilities',
        title: 'Utilities',
        path: '/styleguide/basics/utilities',
        description: 'Spacing, display, and color utilities derived from tokens.',
      },
    ],
  },
  {
    id: 'forms',
    title: 'Forms',
    items: [
      {
        slug: 'inputs',
        title: 'Inputs',
        path: '/styleguide/forms/inputs',
      },
      {
        slug: 'selects',
        title: 'Selects',
        path: '/styleguide/forms/selects',
      },
      {
        slug: 'checkboxes-radios',
        title: 'Checkboxes & Radios',
        path: '/styleguide/forms/checkboxes-radios',
      },
      {
        slug: 'input-groups',
        title: 'Input Groups',
        path: '/styleguide/forms/input-groups',
      },
      {
        slug: 'validation',
        title: 'Validation',
        path: '/styleguide/forms/validation',
      },
    ],
  },
  {
    id: 'components',
    title: 'Components',
    items: [
      {
        slug: 'buttons',
        title: 'Buttons',
        path: '/styleguide/components/buttons',
      },
      {
        slug: 'button-groups',
        title: 'Button Groups',
        path: '/styleguide/components/button-groups',
      },
      {
        slug: 'dropdowns',
        title: 'Dropdowns',
        path: '/styleguide/components/dropdowns',
      },
      {
        slug: 'navigation',
        title: 'Navigation',
        path: '/styleguide/components/navigation',
      },
      {
        slug: 'tabs-pills',
        title: 'Tabs & Pills',
        path: '/styleguide/components/tabs-pills',
      },
      {
        slug: 'breadcrumbs',
        title: 'Breadcrumbs',
        path: '/styleguide/components/breadcrumbs',
      },
      {
        slug: 'pagination',
        title: 'Pagination',
        path: '/styleguide/components/pagination',
      },
      {
        slug: 'labels-badges',
        title: 'Labels & Badges',
        path: '/styleguide/components/labels-badges',
      },
      {
        slug: 'alerts',
        title: 'Alerts',
        path: '/styleguide/components/alerts',
      },
      {
        slug: 'progress',
        title: 'Progress',
        path: '/styleguide/components/progress',
      },
    ],
  },
  {
    id: 'data-display',
    title: 'Data Display',
    items: [
      {
        slug: 'tables',
        title: 'Tables',
        path: '/styleguide/data-display/tables',
      },
      {
        slug: 'lists',
        title: 'Lists',
        path: '/styleguide/data-display/lists',
      },
      {
        slug: 'media-object',
        title: 'Media Object',
        path: '/styleguide/data-display/media-object',
      },
    ],
  },
  {
    id: 'overlays',
    title: 'Overlays',
    items: [
      {
        slug: 'modal',
        title: 'Modal',
        path: '/styleguide/overlays/modal',
      },
      {
        slug: 'tooltip',
        title: 'Tooltip',
        path: '/styleguide/overlays/tooltip',
      },
      {
        slug: 'popover',
        title: 'Popover',
        path: '/styleguide/overlays/popover',
      },
    ],
  },
  {
    id: 'utilities',
    title: 'Utilities',
    items: [
      {
        slug: 'grid-utilities',
        title: 'Grid Helpers',
        path: '/styleguide/utilities/grid-utilities',
      },
      {
        slug: 'spacing',
        title: 'Spacing Helpers',
        path: '/styleguide/utilities/spacing',
      },
      {
        slug: 'color-utilities',
        title: 'Color Utilities',
        path: '/styleguide/utilities/color',
      },
    ],
  },
  {
    id: 'examples',
    title: 'Examples',
    items: [
      {
        slug: 'dashboard',
        title: 'Dashboard Layout',
        path: '/styleguide/examples/dashboard',
      },
      {
        slug: 'marketing',
        title: 'Marketing Page',
        path: '/styleguide/examples/marketing',
      },
      {
        slug: 'sign-in',
        title: 'Sign-in Flow',
        path: '/styleguide/examples/sign-in',
      },
      {
        slug: 'pricing',
        title: 'Pricing Table',
        path: '/styleguide/examples/pricing',
      },
      {
        slug: 'settings',
        title: 'Settings Form',
        path: '/styleguide/examples/settings',
      },
    ],
  },
  {
    id: 'meta',
    title: 'Meta',
    items: [
      {
        slug: 'approval-queue',
        title: 'Approval Queue',
        path: '/styleguide/approval-queue',
      },
      {
        slug: 'search',
        title: 'Search',
        path: '/styleguide/search',
      },
      {
        slug: 'audit-report',
        title: 'Audit Report',
        path: '/styleguide/audit',
      },
      {
        slug: 'changelog',
        title: 'Changelog',
        path: '/styleguide/changelog',
      },
    ],
  },
]
