import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import path from 'path';

const config: Config = {
  title: 'Scaffald UI',
  tagline: 'Best-in-class UI framework for Expo (React Native + Web)',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: 'https://ui.scaffald.com',
  baseUrl: '/',

  organizationName: 'Scaffald',
  projectName: 'ui',

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/Scaffald/ui/tree/main/docs-site/',
          routeBasePath: 'docs',
        },
        blog: false, // Disable blog for component library docs
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  plugins: [
    function reactNativeWebPlugin() {
      return {
        name: 'react-native-web-docusaurus-plugin',
        configureWebpack() {
          return {
            resolve: {
              extensions: [
                '.web.tsx', '.web.ts', '.web.jsx', '.web.js',
                '.tsx', '.ts', '.jsx', '.js', '.json',
              ],
              alias: {
                'react-native$': 'react-native-web',
                'react-native-svg': path.resolve(__dirname, '../.storybook/mocks/react-native-svg.jsx'),
                'lucide-react-native': 'lucide-react',
                'react-native/Libraries/ReactNative/requireNativeComponent': path.resolve(__dirname, '../.storybook/mocks/requireNativeComponent.js'),
                'react-native/Libraries/Alert/RCTAlertManager': path.resolve(__dirname, '../.storybook/mocks/RCTAlertManager.js'),
                'react-native/Libraries/TurboModule/TurboModuleRegistry': path.resolve(__dirname, '../.storybook/mocks/TurboModuleRegistry.js'),
              },
            },
            module: {
              rules: [
                {
                  test: /\.(js|jsx|ts|tsx)$/,
                  include: /node_modules\/(react-native-web|@scaffald\/ui)/,
                  use: {
                    loader: 'babel-loader',
                    options: {
                      presets: ['@babel/preset-env', '@babel/preset-react', '@babel/preset-typescript'],
                    },
                  },
                },
              ],
            },
          };
        },
      };
    },
  ],

  themeConfig: {
    image: 'img/scaffald-ui-social-card.png',
    colorMode: {
      defaultMode: 'light',
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'Scaffald UI',
      logo: {
        alt: 'Scaffald UI Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Docs',
        },
        {
          type: 'docSidebar',
          sidebarId: 'componentsSidebar',
          position: 'left',
          label: 'Components',
        },
        {
          href: 'https://github.com/Scaffald/ui',
          label: 'GitHub',
          position: 'right',
        },
        {
          href: 'https://www.npmjs.com/package/@scaffald/ui',
          label: 'npm',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Getting Started',
              to: '/docs/intro',
            },
            {
              label: 'Installation',
              to: '/docs/guide/installation',
            },
            {
              label: 'Components',
              to: '/docs/components/overview',
            },
          ],
        },
        {
          title: 'Resources',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/Scaffald/ui',
            },
            {
              label: 'npm Package',
              href: 'https://www.npmjs.com/package/@scaffald/ui',
            },
            {
              label: 'Scaffald SDK',
              href: 'https://scaffald.github.io/sdk/',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'Report an Issue',
              href: 'https://github.com/Scaffald/ui/issues',
            },
            {
              label: 'Contribute',
              href: 'https://github.com/Scaffald/ui/blob/main/CONTRIBUTING.md',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Scaffald. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'typescript', 'tsx', 'jsx'],
    },
    algolia: undefined, // Can be added later for search
  } satisfies Preset.ThemeConfig,
};

export default config;
