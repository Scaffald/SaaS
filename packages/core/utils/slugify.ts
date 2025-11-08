/**
 * Slug Utility Functions
 * 
 * Provides functions for generating, validating, and managing URL-friendly slugs
 * for vanity URLs (user profiles, jobs, organizations)
 */

/**
 * Reserved slugs that cannot be used for vanity URLs
 * These are reserved to prevent conflicts with application routes
 */
export const RESERVED_SLUGS = [
  'admin',
  'api',
  'auth',
  'dashboard',
  'office',
  'settings',
  'profile',
  'user',
  'users',
  'org',
  'organization',
  'organizations',
  'job',
  'jobs',
  'about',
  'contact',
  'help',
  'support',
  'terms',
  'privacy',
  'legal',
  'login',
  'logout',
  'signup',
  'sign-in',
  'sign-up',
  'register',
  'forgot-password',
  'reset-password',
] as const

/**
 * Generate a URL-safe slug from text
 * 
 * @param text - Input text to convert to slug
 * @returns URL-safe slug (lowercase, alphanumeric and dashes only)
 * 
 * @example
 * generateSlug("John Doe") // "john-doe"
 * generateSlug("Senior Software Engineer @ Acme") // "senior-software-engineer-acme"
 */
export function generateSlug(text: string): string {
  if (!text) return ''

  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with dashes
    .replace(/-+/g, '-') // Replace multiple dashes with single dash
    .replace(/^-+|-+$/g, '') // Remove leading/trailing dashes
    .substring(0, 50) // Max length
}

/**
 * Validate if a slug meets all requirements
 * 
 * @param slug - Slug to validate
 * @returns true if slug is valid, false otherwise
 * 
 * Validation rules:
 * - 3-50 characters
 * - Only alphanumeric and dashes
 * - Not a reserved word
 * - No consecutive dashes
 * - No leading/trailing dashes
 */
export function isSlugValid(slug: string): boolean {
  if (!slug) return false

  // Length check
  if (slug.length < 3 || slug.length > 50) return false

  // Format check (alphanumeric and dashes only)
  if (!/^[a-z0-9-]+$/.test(slug)) return false

  // Reserved word check
  if (RESERVED_SLUGS.includes(slug.toLowerCase() as typeof RESERVED_SLUGS[number])) {
    return false
  }

  // No consecutive dashes
  if (slug.includes('--')) return false

  // No leading/trailing dashes
  if (slug.startsWith('-') || slug.endsWith('-')) return false

  return true
}

/**
 * Suggest alternative slugs when the desired slug is taken
 * 
 * @param baseSlug - The original slug that was taken
 * @param existingSlugs - Array of slugs that already exist
 * @param maxSuggestions - Maximum number of suggestions to return (default: 3)
 * @returns Array of suggested alternative slugs
 * 
 * @example
 * suggestSlugVariations("john-doe", ["john-doe"]) 
 * // ["john-doe-2", "john-doe-dev", "johndoe"]
 */
export function suggestSlugVariations(
  baseSlug: string,
  existingSlugs: string[],
  maxSuggestions = 3
): string[] {
  const suggestions: string[] = []
  const existingSet = new Set(existingSlugs.map((s) => s.toLowerCase()))

  // Strategy 1: Add numeric suffix
  for (let i = 2; i <= maxSuggestions + 1; i++) {
    const candidate = `${baseSlug}-${i}`
    if (!existingSet.has(candidate.toLowerCase()) && isSlugValid(candidate)) {
      suggestions.push(candidate)
      if (suggestions.length >= maxSuggestions) break
    }
  }

  // Strategy 2: Add common suffixes
  const suffixes = ['dev', 'pro', 'official', 'real']
  for (const suffix of suffixes) {
    if (suggestions.length >= maxSuggestions) break
    const candidate = `${baseSlug}-${suffix}`
    if (!existingSet.has(candidate.toLowerCase()) && isSlugValid(candidate)) {
      suggestions.push(candidate)
    }
  }

  // Strategy 3: Remove dashes
  if (suggestions.length < maxSuggestions) {
    const candidate = baseSlug.replace(/-/g, '')
    if (
      candidate.length >= 3 &&
      !existingSet.has(candidate.toLowerCase()) &&
      isSlugValid(candidate)
    ) {
      suggestions.push(candidate)
    }
  }

  return suggestions.slice(0, maxSuggestions)
}

/**
 * Check if a slug is reserved
 * 
 * @param slug - Slug to check
 * @returns true if slug is reserved, false otherwise
 */
export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.includes(slug.toLowerCase() as typeof RESERVED_SLUGS[number])
}

/**
 * Normalize a slug (ensure it's in the correct format)
 * 
 * @param slug - Slug to normalize
 * @returns Normalized slug or empty string if invalid
 */
export function normalizeSlug(slug: string): string {
  const normalized = generateSlug(slug)
  return isSlugValid(normalized) ? normalized : ''
}



