export type TodoItem = {
  id: string
  title: string
  summary: string
  suggestion: string
  href: string
}

export const TODO_ITEMS: TodoItem[] = [
  {
    id: 'docgen-props',
    title: 'Automate component prop tables',
    summary:
      'Prop documentation is currently curated by hand. Integrate react-docgen-typescript across @unicornlove/ui to surface live prop tables.',
    suggestion:
      "Install react-docgen-typescript in the workspace, add a turbo task that emits JSON for each component, and hydrate the Styleguide's <PropTable> component from that output.",
    href: '/styleguide/components/buttons#todo-docgen-props',
  },
  {
    id: 'search-index',
    title: 'Ship production search indexer',
    summary:
      'Search is powered by an in-memory index seeded at runtime. We need a build-time pipeline that crawls MDX/TSX docs so search results stay fast and accurate.',
    suggestion:
      'Create a turbo task that emits a JSON manifest of headings, anchors, and tags during build, and load it via static import in the StyleguideProvider.',
    href: '/styleguide/utilities/search#todo-search-index',
  },
  {
    id: 'auth-gate',
    title: 'Confirm production auth gate',
    summary:
      'The showcase mounts publicly inside the Expo web bundle. Confirm whether a role-based guard or feature flag is required before exposing /styleguide in production.',
    suggestion:
      'Coordinate with platform leads to reuse existing auth wrappers from packages/core/provider and gate the route via middleware.',
    href: '/styleguide#a11y-and-security#todo-auth-gate',
  },
]

export const APPROVAL_COUNT = TODO_ITEMS.length
