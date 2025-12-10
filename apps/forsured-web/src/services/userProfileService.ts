// src/services/userProfileService.ts
// REQ-126: OAuth 2.0 + RBAC Authentication System
//
// Service for managing ForSured user profiles in Supabase

import { forsured } from '../lib/supabase';
import { UserProfile } from '../types';

const TABLE_NAME = 'user_profiles';

/**
 * Get a user profile by Scaffald user ID
 * @param scaffaldUserId - The Scaffald user ID to look up
 * @returns The user profile or null if not found
 */
export async function getProfile(scaffaldUserId: string): Promise<UserProfile | null> {
  console.log(`[UserProfileService] Fetching profile for Scaffald user: ${scaffaldUserId}`);

  try {
    const { data, error } = await forsured(TABLE_NAME)
      .select('*')
      .eq('scaffald_user_id', scaffaldUserId)
      .single();

    if (error) {
      // PGRST116 is "not found" in PostgREST - this is expected for new users
      if (error.code === 'PGRST116' || error.message?.includes('not found') || error.message?.includes('Not Found')) {
        console.log(`[UserProfileService] No profile found for user ${scaffaldUserId}`);
        return null;
      }
      console.error('[UserProfileService] Error fetching profile:', error);
      throw error;
    }

    console.log(`[UserProfileService] Found profile:`, data?.user_type);
    return data;
  } catch (err: unknown) {
    // Handle case where no rows returned (not an error, just no profile yet)
    if (err && typeof err === 'object' && 'code' in err && (err as { code: string }).code === 'PGRST116') {
      return null;
    }
    throw err;
  }
}

/**
 * Create a new user profile
 * @param profileData - The profile data to create
 * @returns The created profile
 */
export async function createProfile(
  profileData: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>
): Promise<UserProfile> {
  console.log('[UserProfileService] Creating profile:', profileData.user_type);

  const { data, error } = await forsured(TABLE_NAME)
    .insert(profileData)
    .select()
    .single();

  if (error) {
    console.error('[UserProfileService] Error creating profile:', error);
    throw error;
  }

  console.log('[UserProfileService] Profile created successfully');
  return data;
}

/**
 * Update an existing user profile
 * @param profileId - The profile ID to update
 * @param updates - The fields to update
 * @returns The updated profile
 */
export async function updateProfile(
  profileId: string,
  updates: Partial<Omit<UserProfile, 'id' | 'scaffald_user_id' | 'created_at'>>
): Promise<UserProfile> {
  console.log('[UserProfileService] Updating profile:', profileId);

  const { data, error } = await forsured(TABLE_NAME)
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', profileId)
    .select()
    .single();

  if (error) {
    console.error('[UserProfileService] Error updating profile:', error);
    throw error;
  }

  console.log('[UserProfileService] Profile updated successfully');
  return data;
}

/**
 * Update profile by Scaffald user ID
 * Useful when you don't have the profile ID
 */
export async function updateProfileByScaffaldId(
  scaffaldUserId: string,
  updates: Partial<Omit<UserProfile, 'id' | 'scaffald_user_id' | 'created_at'>>
): Promise<UserProfile> {
  console.log('[UserProfileService] Updating profile by Scaffald ID:', scaffaldUserId);

  const { data, error } = await forsured(TABLE_NAME)
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('scaffald_user_id', scaffaldUserId)
    .select()
    .single();

  if (error) {
    console.error('[UserProfileService] Error updating profile:', error);
    throw error;
  }

  console.log('[UserProfileService] Profile updated successfully');
  return data;
}

/**
 * Mark onboarding as complete
 */
export async function completeOnboarding(profileId: string): Promise<UserProfile> {
  return updateProfile(profileId, {
    onboarding_completed: true,
  });
}

/**
 * Update onboarding progress
 */
export async function updateOnboardingStep(
  profileId: string,
  step: number,
  data?: Record<string, unknown>
): Promise<UserProfile> {
  const updates: Partial<UserProfile> = {
    onboarding_step: step,
  };

  if (data) {
    // Merge with existing onboarding data
    const profile = await getProfileById(profileId);
    updates.onboarding_data = {
      ...(profile?.onboarding_data || {}),
      ...data,
    };
  }

  return updateProfile(profileId, updates);
}

/**
 * Get profile by profile ID (not Scaffald ID)
 */
export async function getProfileById(profileId: string): Promise<UserProfile | null> {
  const { data, error } = await forsured(TABLE_NAME)
    .select('*')
    .eq('id', profileId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw error;
  }

  return data;
}
