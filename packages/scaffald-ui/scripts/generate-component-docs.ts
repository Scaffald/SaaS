#!/usr/bin/env tsx
/**
 * Generate component documentation files
 *
 * This script scans the components directory and generates markdown documentation
 * for each component with a consistent structure.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COMPONENTS_DIR = path.join(__dirname, '../src/components');
const DOCS_OUTPUT_DIR = path.join(__dirname, '../docs-site/docs/components');

// Component categories for organization
const CATEGORIES = {
  form: ['Button', 'TextInput', 'Textarea', 'Select', 'Checkbox', 'Radio', 'Toggle', 'Slider', 'DatePicker', 'SearchBar'],
  layout: ['Stack', 'Row', 'Container', 'Divider', 'Spacer', 'Grid'],
  navigation: ['Tabs', 'Breadcrumbs', 'Pagination', 'Menu', 'Drawer'],
  feedback: ['Alert', 'Toast', 'Modal', 'Dialog', 'Progress', 'Spinner', 'Skeleton', 'Badge', 'Tooltip'],
  dataDisplay: ['Card', 'Table', 'List', 'Avatar', 'Chip', 'Icon', 'Image'],
  typography: ['Text', 'Heading', 'Link'],
  overlays: ['Popover', 'Dropdown', 'Sheet'],
};

function getAllComponents(): string[] {
  const components: string[] = [];

  function scanDirectory(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory() && !entry.name.startsWith('.')) {
        const componentPath = path.join(dir, entry.name);
        const componentFile = path.join(componentPath, `${entry.name}.tsx`);

        if (fs.existsSync(componentFile)) {
          components.push(entry.name);
        }

        // Recursively scan subdirectories
        scanDirectory(componentPath);
      }
    }
  }

  scanDirectory(COMPONENTS_DIR);
  return components.sort();
}

function getCategoryForComponent(componentName: string): string {
  for (const [category, components] of Object.entries(CATEGORIES)) {
    if (components.includes(componentName)) {
      return category;
    }
  }
  return 'other';
}

function generateComponentDoc(componentName: string): string {
  const category = getCategoryForComponent(componentName);
  const kebabName = componentName
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .toLowerCase();

  return `---
sidebar_position: ${Object.values(CATEGORIES).flat().indexOf(componentName) + 1}
---

# ${componentName}

${getComponentDescription(componentName)}

## Import

\`\`\`tsx
import { ${componentName} } from '@scaffald/ui';
\`\`\`

## Basic Usage

\`\`\`tsx
import { ${componentName} } from '@scaffald/ui';

export default function Example() {
  return (
    <${componentName}>
      ${getBasicExample(componentName)}
    </${componentName}>
  );
}
\`\`\`

## Props

See the [TypeScript definitions](https://github.com/Scaffald/ui/blob/main/src/components/${componentName}/${componentName}.tsx) for the complete props API.

### Common Props

All ${componentName} components accept standard React Native [\`View\` props](https://reactnative.dev/docs/view#props).

## Variants

${getVariantsSection(componentName)}

## Examples

### ${getExampleTitle(componentName)}

\`\`\`tsx
${getExampleCode(componentName)}
\`\`\`

## Accessibility

- ✅ Keyboard navigation support
- ✅ Screen reader compatible
- ✅ ARIA attributes included
- ✅ Focus management

## Design Tokens

This component uses the following design tokens:

- Colors: \`colors.{semantic}.{theme}.{variant}\`
- Spacing: \`spacing.*\`
- Typography: \`typography.*\`

See [Design Tokens](../tokens/overview) for more information.

## Related Components

${getRelatedComponents(componentName)}

## Changelog

See [GitHub Releases](https://github.com/Scaffald/ui/releases) for version history.
`;
}

function getComponentDescription(name: string): string {
  const descriptions: Record<string, string> = {
    Button: 'Interactive button component with multiple variants and sizes. Supports icons, loading states, and accessibility features.',
    TextInput: 'Single-line text input with label, validation, and error states. Fully accessible and customizable.',
    Stack: 'Vertical layout component with automatic spacing between children. Essential for building consistent UIs.',
    Row: 'Horizontal layout component with automatic spacing between children. Flexbox-based for responsive layouts.',
    Card: 'Container component for grouping related content. Supports headers, footers, and various visual styles.',
    Text: 'Base text component with typography variants and theming support. Foundation for all text content.',
    Tabs: 'Tabbed navigation component with multiple visual variants. Supports horizontal and vertical orientations.',
    Modal: 'Overlay dialog component for focused interactions. Includes backdrop, animations, and focus management.',
    Alert: 'Inline notification component for contextual messages. Supports different severity levels and actions.',
    Avatar: 'User profile image component with fallback initials. Supports different sizes and shapes.',
    Badge: 'Small status indicator for counts and labels. Useful for notifications and metadata.',
    Checkbox: 'Boolean selection control for forms. Supports intermediate state and custom styling.',
    Radio: 'Mutually exclusive selection control. Group multiple radios for single-choice scenarios.',
    Toggle: 'On/off switch component. Alternative to checkbox for boolean states.',
    Select: 'Dropdown selection component with search and multi-select support.',
    Slider: 'Range input component for numeric values. Supports steps and custom formatting.',
    Progress: 'Visual indicator of task completion. Supports determinate and indeterminate modes.',
    Spinner: 'Loading indicator for async operations. Multiple sizes and colors available.',
    Tooltip: 'Contextual help text that appears on hover or focus. Accessible and customizable.',
    Icon: 'Vector icon component with 1000+ icons from Lucide. Themeable and accessible.',
  };

  return descriptions[name] || `${name} component from Scaffald UI component library.`;
}

function getBasicExample(name: string): string {
  const examples: Record<string, string> = {
    Button: 'Click Me',
    Text: 'Hello World',
    TextInput: '',
    Stack: '<Text>Item 1</Text>\n      <Text>Item 2</Text>',
    Row: '<Text>Left</Text>\n      <Text>Right</Text>',
    Card: '<Text>Card Content</Text>',
    Badge: '5',
  };

  return examples[name] || 'Content';
}

function getVariantsSection(name: string): string {
  if (name === 'Button') {
    return `### Visual Variants

- \`filled\` (default) - Solid background button
- \`outline\` - Outlined button with transparent background
- \`ghost\` - Minimal button with no background
- \`text\` - Text-only button

### Sizes

- \`sm\` - Small button
- \`md\` (default) - Medium button
- \`lg\` - Large button`;
  }

  if (name === 'Alert') {
    return `### Severity Levels

- \`info\` - Informational messages
- \`success\` - Success confirmations
- \`warning\` - Warning notices
- \`error\` - Error messages`;
  }

  return 'See component props for available variants.';
}

function getExampleTitle(name: string): string {
  const titles: Record<string, string> = {
    Button: 'With Icon',
    Stack: 'Nested Layout',
    Tabs: 'With Content',
    Modal: 'Confirmation Dialog',
  };

  return titles[name] || 'Advanced Usage';
}

function getExampleCode(name: string): string {
  return `// Example implementation
<${name} variant="default">
  Example content
</${name}>`;
}

function getRelatedComponents(name: string): string {
  const related: Record<string, string[]> = {
    Button: ['Link', 'IconButton', 'ButtonGroup'],
    TextInput: ['Textarea', 'Select', 'SearchBar'],
    Stack: ['Row', 'Container', 'Spacer'],
    Card: ['Container', 'Divider'],
    Tabs: ['Breadcrumbs', 'Pagination'],
  };

  const components = related[name] || [];
  return components.length > 0
    ? components.map(c => `- [${c}](./${c.toLowerCase()})`).join('\n')
    : 'No related components.';
}

function main() {
  console.log('🚀 Generating component documentation...\n');

  // Ensure docs output directory exists
  if (!fs.existsSync(DOCS_OUTPUT_DIR)) {
    fs.mkdirSync(DOCS_OUTPUT_DIR, { recursive: true });
  }

  const components = getAllComponents();
  console.log(`📦 Found ${components.length} components\n`);

  let generated = 0;
  let skipped = 0;

  for (const component of components) {
    const kebabName = component
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .toLowerCase();
    const outputPath = path.join(DOCS_OUTPUT_DIR, `${kebabName}.md`);

    // Skip if docs already exist (don't overwrite manual edits)
    if (fs.existsSync(outputPath)) {
      console.log(`⏭️  Skipping ${component} (docs already exist)`);
      skipped++;
      continue;
    }

    const content = generateComponentDoc(component);
    fs.writeFileSync(outputPath, content, 'utf-8');
    console.log(`✅ Generated docs for ${component}`);
    generated++;
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Generated: ${generated}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Total: ${components.length}`);
  console.log(`\n✨ Documentation generation complete!`);
}

main();
