/**
 * Extract initials from a name
 * @param name - Full name to extract initials from
 * @returns Uppercase initials (max 2 characters)
 * @example
 * getInitials('John Doe') // 'JD'
 * getInitials('Summit Electrical') // 'SE'
 * getInitials('Mary') // 'M'
 */
export function getInitials(name: string): string {
  if (!name || typeof name !== 'string') {
    return '?'
  }

  const words = name.trim().split(/\s+/)

  if (words.length === 1) {
    // Single word: use first character
    return words[0].charAt(0).toUpperCase()
  }

  // Multiple words: use first character of first two words
  return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase()
}
