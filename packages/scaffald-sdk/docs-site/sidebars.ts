import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */
const sidebars: SidebarsConfig = {
  // Main documentation sidebar
  docsSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Getting Started',
      items: [
        'guide/installation',
        'guide/quick-start',
        'guide/authentication',
      ],
    },
    {
      type: 'category',
      label: 'Guides',
      items: [
        'guide/react-integration',
        'guide/error-handling',
        'guide/pagination',
      ],
    },
    {
      type: 'category',
      label: 'Examples',
      items: [
        'examples/node-js',
        'examples/browser',
        'examples/react',
        'examples/oauth-flow',
      ],
    },
    {
      type: 'category',
      label: 'Advanced',
      items: [
        'advanced/features',
        'advanced/webhooks',
        'advanced/architecture',
        'advanced/type-generation',
      ],
    },
    'contributing',
  ],

  // API Reference sidebar
  apiSidebar: [
    'api/overview',
    {
      type: 'category',
      label: 'Resources',
      items: [
        'api/jobs',
        'api/applications',
        'api/profiles',
        'api/teams',
        'api/connections',
        'api/analytics',
      ],
    },
  ],
};

export default sidebars;
