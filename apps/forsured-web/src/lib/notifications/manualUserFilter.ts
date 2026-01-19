/**
 * Manual User Notification Filter
 * REQ-12: Add Manual Broker and Contractor Registration
 * TASK-5: Update notification system to exclude manually-created users
 *
 * Provides utilities for filtering out manually-created users from
 * notification recipients. Manual users don't have real accounts and
 * cannot receive notifications until they register.
 */

import { forsured } from '../supabase'

/**
 * Cache for manual user status to avoid repeated DB queries
 * Key: user profile ID, Value: is_manually_created flag
 */
const manualUserCache = new Map<string, { isManual: boolean; cachedAt: number }>()

/**
 * Cache TTL in milliseconds (5 minutes)
 */
const CACHE_TTL_MS = 5 * 60 * 1000

/**
 * Check if a user can receive notifications
 * Manual users cannot receive notifications since they don't have real accounts.
 *
 * @param userProfileId - The forsured.user_profiles.id to check
 * @returns True if user can receive notifications, false if manual user
 */
export async function canReceiveNotifications(userProfileId: string): Promise<boolean> {
  // Check cache first
  const cached = manualUserCache.get(userProfileId)
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return !cached.isManual
  }

  try {
    const { data, error } = await forsured('user_profiles')
      .select('is_manually_created')
      .eq('id', userProfileId)
      .single()

    if (error || !data) {
      // If we can't find the user, assume they can't receive notifications
      console.warn(`[ManualUserFilter] Could not find user profile ${userProfileId}`)
      return false
    }

    const isManual = data.is_manually_created === true

    // Cache the result
    manualUserCache.set(userProfileId, {
      isManual,
      cachedAt: Date.now(),
    })

    return !isManual
  } catch (error) {
    console.error('[ManualUserFilter] Error checking user:', error)
    // On error, assume user can receive notifications to avoid blocking
    return true
  }
}

/**
 * Filter a list of recipient IDs to exclude manual users
 *
 * @param recipientIds - Array of user profile IDs to filter
 * @returns Filtered array with only non-manual users
 */
export async function filterManualUsers(recipientIds: string[]): Promise<string[]> {
  if (recipientIds.length === 0) {
    return []
  }

  // Check which IDs are cached
  const needsQuery: string[] = []
  const results: string[] = []

  for (const id of recipientIds) {
    const cached = manualUserCache.get(id)
    if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
      if (!cached.isManual) {
        results.push(id)
      }
    } else {
      needsQuery.push(id)
    }
  }

  if (needsQuery.length === 0) {
    return results
  }

  try {
    // Query all uncached IDs at once
    const { data, error } = await forsured('user_profiles')
      .select('id, is_manually_created')
      .in('id', needsQuery)

    if (error) {
      console.error('[ManualUserFilter] Error querying users:', error)
      // On error, include all queried users to avoid blocking
      return [...results, ...needsQuery]
    }

    const now = Date.now()

    for (const user of data || []) {
      const isManual = user.is_manually_created === true

      // Cache the result
      manualUserCache.set(user.id, {
        isManual,
        cachedAt: now,
      })

      if (!isManual) {
        results.push(user.id)
      } else {
        console.log(`[ManualUserFilter] Excluding manual user ${user.id} from notifications`)
      }
    }

    // Handle any IDs that weren't found in the query
    const foundIds = new Set((data || []).map(u => u.id))
    for (const id of needsQuery) {
      if (!foundIds.has(id)) {
        console.warn(`[ManualUserFilter] User ${id} not found in database`)
        // Cache as manual to prevent repeated queries for non-existent users
        manualUserCache.set(id, { isManual: true, cachedAt: now })
      }
    }

    return results
  } catch (error) {
    console.error('[ManualUserFilter] Error filtering users:', error)
    // On error, include all queried users to avoid blocking
    return [...results, ...needsQuery]
  }
}

/**
 * Log a warning when attempting to notify a manual user
 * This is non-blocking and just for observability.
 *
 * @param userProfileId - The manual user's profile ID
 * @param notificationType - Type of notification that was skipped
 * @param context - Additional context for logging
 */
export function logSkippedManualUserNotification(
  userProfileId: string,
  notificationType: string,
  context?: Record<string, unknown>
): void {
  console.warn('[ManualUserFilter] Skipped notification for manual user:', {
    userProfileId,
    notificationType,
    ...context,
  })
}

/**
 * Clear the cache (useful for testing)
 */
export function clearCache(): void {
  manualUserCache.clear()
}

/**
 * Get cache stats (useful for monitoring)
 */
export function getCacheStats(): { size: number; hitRate: number } {
  return {
    size: manualUserCache.size,
    hitRate: 0, // Would need to track hits/misses for real implementation
  }
}
