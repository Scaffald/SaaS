#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '../../..')

function readJSON(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

const rootPackage = readJSON(path.join(repoRoot, 'package.json'))
const expoPackage = readJSON(path.join(repoRoot, 'apps/expo/package.json'))

const audit = {
  generatedAt: new Date().toISOString(),
  techStack: {
    workspaceManager: rootPackage.packageManager || 'pnpm',
    framework: 'Expo Router + React Native Web',
    runtime: 'React 18 (Expo SDK)',
    uiSystem: 'Tamagui v4 with custom themes',
    ssr: false,
  },
  languages: ['TypeScript', 'TSX', 'React Native styling'],
  buildTooling: {
    bundler: 'Expo CLI (Metro)',
    tasks: Object.keys(rootPackage.scripts || {}),
    workspaceScripts: Object.keys(expoPackage.scripts || {}),
    turbo: fs.existsSync(path.join(repoRoot, 'turbo.json')),
  },
  entryPoints: {
    expoLayout: 'apps/expo/app/_layout.tsx',
    router: 'apps/expo/app',
    styleguideBasePath: '/styleguide',
  },
  routing: {
    approach: 'file-system routes via expo-router',
    authGuard: 'Provider wrapper in _layout.tsx with Supabase session',
  },
  designSystem: {
    tamaguiConfig: 'packages/ui/src/tamagui.config.ts',
    themes: ['packages/ui/src/themes/earth-theme.ts'],
    fonts: ['packages/ui/src/config/fonts.ts'],
    componentsDir: 'packages/ui/src/components',
    iconSet: '@tamagui/lucide-icons',
    tokensSource: 'packages/ui/src/tamagui.config.ts tokens + packages/core/assets/brand-colors.ts',
  },
  brand: {
    name: 'Scaffald',
    logoComponent: '@app/core/assets/ScaffaldLogo.tsx',
    tagline: 'Career collaboration platform',
    colorsFile: 'packages/core/assets/brand-colors.ts',
  },
  docsSources: {
    existingStyleguide: 'apps/expo/app/styleguide',
    componentExports: '@app/ui',
    stories: null,
    mdDocs: 'docs/',
  },
  security: {
    auth: 'Supabase session gating in root layout',
    deployment: 'Netlify scripts + Expo web export',
  },
  testing: {
    lint: !!expoPackage.scripts?.lint,
    typecheck: !!expoPackage.scripts?.typecheck,
    e2e: false,
    visual: false,
  },
  ci: {
    netlify: fs.existsSync(path.join(repoRoot, 'netlify.toml')),
    github: fs.existsSync(path.join(repoRoot, '.github/workflows')),
    turboPipelines: fs.existsSync(path.join(repoRoot, 'turbo.json')),
  },
  hosting: {
    target: 'Expo web export served via Netlify',
    basePath: '/styleguide',
    robots: false,
  },
  search: {
    existingLibrary: null,
    recommendation: 'Implement lightweight local search index (e.g., FlexSearch)',
  },
  risks: [
    'Need to ensure styleguide respects authentication requirements when mounted in production.',
    'Automated prop table extraction not yet wired to build pipeline.',
    'Search index must stay in sync with rapidly evolving UI package.',
  ],
}

const approvalQueue = [
  {
    id: 'todo-prop-docs',
    title: 'Automate prop tables for UI components',
    context:
      'Component API tables currently rely on placeholder metadata. We need build-time extraction to stay accurate.',
    suggestion:
      'Add a prebuild script using `react-docgen-typescript` to generate JSON for @app/ui components and hydrate tables in the styleguide.',
    links: ['/styleguide/components/button#api'],
    status: 'pending',
  },
  {
    id: 'todo-search',
    title: 'Finalize full-text search indexing',
    context:
      'Search currently uses in-memory nav data only. It should index headings and tokens with weighting and highlight support.',
    suggestion: 'Introduce FlexSearch or MiniSearch and generate an index from MDX content during build.',
    links: ['/styleguide/search'],
    status: 'pending',
  },
  {
    id: 'todo-robots',
    title: 'Decide on robots.txt policy for styleguide',
    context:
      'Styleguide may be internal-only. Confirm whether to block indexing and add robots rules if needed.',
    suggestion: 'Add a /styleguide/robots.txt served when APP_ENV !== production or behind auth.',
    links: ['/styleguide/approval-queue'],
    status: 'pending',
  },
]

const unknowns = [
  {
    item: 'Dedicated illustration assets for docs examples',
    suggestion: 'Commission or adapt existing marketing illustrations for empty states.',
  },
  {
    item: 'Accessibility testing tooling integration',
    suggestion: 'Adopt @testing-library/react-native with axe or integrate Playwright + axe-core for smoke checks.',
  },
  {
    item: 'Internationalization strategy for web-only content',
    suggestion: 'Confirm whether the existing i18n provider should wrap the styleguide and expose locale switcher.',
  },
]

const outputDir = path.join(repoRoot, 'apps/expo/app/styleguide/_data')
fs.mkdirSync(outputDir, { recursive: true })

const payload = { audit, approvalQueue, unknowns }

fs.writeFileSync(path.join(outputDir, 'audit-report.json'), JSON.stringify(payload, null, 2))

console.log('Styleguide audit metadata generated at', new Date().toISOString())
