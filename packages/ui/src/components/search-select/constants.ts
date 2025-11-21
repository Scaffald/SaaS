import type { SearchSelectStrings } from './types'

export const DEFAULT_STRINGS: Required<SearchSelectStrings> = {
  clear: 'Clear',
  selectAll: 'Select All',
  clearAll: 'Clear All',
  searching: 'Searching…',
  searchFailed: 'Unable to load results. Please try again.',
  noResults: 'No matches found',
  minCharacters: (count: number) => `Type at least ${count} characters to search`,
}
