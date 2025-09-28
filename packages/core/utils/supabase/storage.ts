/**
 * Utility functions for Supabase storage URL construction
 */

/**
 * Constructs a full avatar URL from a file path
 * @param avatarPath - The file path stored in the database (e.g., "user-id/avatar-timestamp.jpg")
 * @returns Full URL to the avatar image, or null if no path provided
 */
export function getAvatarUrl(avatarPath: string | null | undefined): string | null {
  if (!avatarPath || avatarPath.trim() === '') {
    return null
  }

  // If it's already a full URL, return as-is (for backwards compatibility)
  if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
    return avatarPath
  }

  // Construct the full URL using the environment variable
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL

  if (!supabaseUrl) {
    console.error('EXPO_PUBLIC_SUPABASE_URL is not set')
    return null
  }

  return `${supabaseUrl}/storage/v1/object/public/avatars/${avatarPath}`
}

/**
 * Constructs a full storage URL for any bucket and file path
 * @param bucket - The storage bucket name
 * @param filePath - The file path within the bucket
 * @returns Full URL to the file, or null if invalid parameters
 */
export function getStorageUrl(bucket: string, filePath: string | null | undefined): string | null {
  if (!bucket || !filePath || filePath.trim() === '') {
    return null
  }

  // If it's already a full URL, return as-is
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath
  }

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL

  if (!supabaseUrl) {
    console.error('EXPO_PUBLIC_SUPABASE_URL is not set')
    return null
  }

  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${filePath}`
}
