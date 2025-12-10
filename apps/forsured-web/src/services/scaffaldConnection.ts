// src/services/scaffaldConnection.ts
// REQ-126: Scaffald company connection service for onboarding
//
// Connects a user's Scaffald company to their ForSured profile during onboarding.

import { forsured } from '../lib/supabase';
import { scaffaldClient } from '../lib/scaffald/client';

export interface ScaffaldCompanyData {
  id: string;
  name: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
  phone?: string;
  logo_url?: string;
}

export interface ForsuredCompany {
  id: string;
  scaffald_company_id: string;
  name: string;
  address?: string;
  phone?: string;
  logo_url?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Connect a Scaffald company to a ForSured user profile
 *
 * This creates or updates a ForSured company record linked to the Scaffald company,
 * then updates the user profile to mark the company as connected.
 *
 * @param scaffaldCompanyId - The Scaffald company ID to connect
 * @param userId - The user's Scaffald user ID
 * @returns The ForSured company record
 */
export async function connectScaffaldCompany(
  scaffaldCompanyId: string,
  userId: string
): Promise<ForsuredCompany> {
  console.log(`[ScaffaldConnection] Connecting company ${scaffaldCompanyId} to user ${userId}`);

  // 1. Fetch company data from Scaffald
  const scaffaldCompany = await scaffaldClient.companies.get(scaffaldCompanyId);

  if (!scaffaldCompany) {
    throw new Error(`Scaffald company not found: ${scaffaldCompanyId}`);
  }

  // 2. Check if company already exists in ForSured
  const { data: existingCompany, error: lookupError } = await forsured('companies')
    .select('*')
    .eq('scaffald_company_id', scaffaldCompanyId)
    .maybeSingle();

  if (lookupError) {
    console.error('[ScaffaldConnection] Error looking up company:', lookupError);
    throw new Error(`Failed to lookup company: ${lookupError.message}`);
  }

  let forsuredCompany: ForsuredCompany;

  if (existingCompany) {
    // 3a. Update existing company
    console.log('[ScaffaldConnection] Updating existing company:', existingCompany.id);
    const { data: updatedCompany, error: updateError } = await forsured('companies')
      .update({
        name: scaffaldCompany.name,
        address: formatAddress(scaffaldCompany.address),
        phone: scaffaldCompany.phone,
        logo_url: scaffaldCompany.logo_url,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingCompany.id)
      .select()
      .single();

    if (updateError) {
      console.error('[ScaffaldConnection] Error updating company:', updateError);
      throw new Error(`Failed to update company: ${updateError.message}`);
    }

    forsuredCompany = updatedCompany as ForsuredCompany;
  } else {
    // 3b. Create new ForSured company
    console.log('[ScaffaldConnection] Creating new company');
    const { data: newCompany, error: insertError } = await forsured('companies')
      .insert({
        scaffald_company_id: scaffaldCompanyId,
        name: scaffaldCompany.name,
        address: formatAddress(scaffaldCompany.address),
        phone: scaffaldCompany.phone,
        logo_url: scaffaldCompany.logo_url,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[ScaffaldConnection] Error creating company:', insertError);
      throw new Error(`Failed to create company: ${insertError.message}`);
    }

    forsuredCompany = newCompany as ForsuredCompany;
  }

  // 4. Update user profile to mark company as connected
  const { error: profileError } = await forsured('user_profiles')
    .update({
      company_connected: true,
      updated_at: new Date().toISOString(),
    })
    .eq('scaffald_user_id', userId);

  if (profileError) {
    console.error('[ScaffaldConnection] Error updating user profile:', profileError);
    throw new Error(`Failed to update user profile: ${profileError.message}`);
  }

  console.log('[ScaffaldConnection] Successfully connected company:', forsuredCompany.id);
  return forsuredCompany;
}

/**
 * Disconnect a user from their Scaffald company
 *
 * @param userId - The user's Scaffald user ID
 */
export async function disconnectScaffaldCompany(userId: string): Promise<void> {
  console.log(`[ScaffaldConnection] Disconnecting company for user ${userId}`);

  const { error } = await forsured('user_profiles')
    .update({
      company_connected: false,
      updated_at: new Date().toISOString(),
    })
    .eq('scaffald_user_id', userId);

  if (error) {
    console.error('[ScaffaldConnection] Error disconnecting company:', error);
    throw new Error(`Failed to disconnect company: ${error.message}`);
  }

  console.log('[ScaffaldConnection] Successfully disconnected company');
}

/**
 * Get the ForSured company for a user
 *
 * @param scaffaldCompanyId - The Scaffald company ID
 * @returns The ForSured company record or null if not found
 */
export async function getConnectedCompany(scaffaldCompanyId: string): Promise<ForsuredCompany | null> {
  const { data, error } = await forsured('companies')
    .select('*')
    .eq('scaffald_company_id', scaffaldCompanyId)
    .maybeSingle();

  if (error) {
    console.error('[ScaffaldConnection] Error getting company:', error);
    return null;
  }

  return data as ForsuredCompany | null;
}

/**
 * Format address object to string
 */
function formatAddress(address?: ScaffaldCompanyData['address']): string | null {
  if (!address) return null;

  const parts = [
    address.street,
    address.city,
    address.state,
    address.zip,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(', ') : null;
}
