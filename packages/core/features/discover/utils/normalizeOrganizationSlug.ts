/**
 * Normalize user-provided organization names into a URL-friendly slug.
 * Converts to lowercase, replaces non-alphanumeric characters with hyphens,
 * collapses consecutive separators, and trims leading/trailing hyphens.
 */
export function normalizeOrganizationSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
