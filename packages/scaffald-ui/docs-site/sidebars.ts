import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  // Main documentation sidebar
  docsSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Getting Started',
      collapsed: false,
      items: [
        'guide/installation',
        'guide/quick-start',
        'guide/theming',
        'guide/styling',
      ],
    },
    {
      type: 'category',
      label: 'Design Tokens',
      collapsed: true,
      items: [
        'tokens/overview',
        'tokens/colors',
        'tokens/spacing',
        'tokens/typography',
        'tokens/shadows',
      ],
    },
    {
      type: 'category',
      label: 'Advanced',
      collapsed: true,
      items: [
        'advanced/architecture',
        'advanced/style-factories',
        'advanced/accessibility',
        'advanced/testing',
      ],
    },
    {
      type: 'category',
      label: 'Examples',
      collapsed: true,
      items: [
        'examples/forms',
        'examples/layouts',
        'examples/data-display',
      ],
    },
    'contributing',
  ],

  // Components sidebar - organized by category
  componentsSidebar: [
    'components/overview',
    {
      type: 'category',
      label: 'Form Components',
      collapsed: false,
      items: [
        'components/button',
        'components/input',
        'components/text-input',
        'components/textarea',
        'components/select',
        'components/checkbox',
        'components/radio',
        'components/toggle',
        'components/slider',
        'components/date-picker',
        'components/search-bar',
      ],
    },
    {
      type: 'category',
      label: 'Layout',
      collapsed: false,
      items: [
        'components/stack',
        'components/row',
        'components/container',
        'components/divider',
        'components/spacer',
        'components/grid',
      ],
    },
    {
      type: 'category',
      label: 'Navigation',
      collapsed: false,
      items: [
        'components/tabs',
        'components/breadcrumbs',
        'components/pagination',
        'components/menu',
        'components/drawer',
      ],
    },
    {
      type: 'category',
      label: 'Feedback',
      collapsed: false,
      items: [
        'components/alert',
        'components/toast',
        'components/modal',
        'components/dialog',
        'components/progress',
        'components/spinner',
        'components/skeleton',
        'components/badge',
        'components/tooltip',
      ],
    },
    {
      type: 'category',
      label: 'Data Display',
      collapsed: false,
      items: [
        'components/card',
        'components/table',
        'components/list',
        'components/avatar',
        'components/chip',
        'components/icon',
        'components/image',
      ],
    },
    {
      type: 'category',
      label: 'Typography',
      collapsed: false,
      items: [
        'components/text',
        'components/heading',
        'components/link',
      ],
    },
    {
      type: 'category',
      label: 'Overlays',
      collapsed: false,
      items: [
        'components/popover',
        'components/dropdown',
        'components/sheet',
      ],
    },
  ],
};

export default sidebars;
