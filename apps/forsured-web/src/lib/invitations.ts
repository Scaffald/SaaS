// src/lib/invitations.ts
// REQ-126: Broker Invitation System
//
// Service for managing broker invitations in Supabase

import { forsured } from './supabase';
import { sendBrokerInvitation } from '../services/emailService';

export interface Invitation {
  id: string;
  code: string;
  email: string | null;
  expires_at: string;
  max_uses: number;
  use_count: number;
  created_by: string | null;
  created_at: string;
  used_by: string | null;
  used_at: string | null;
}

const TABLE_NAME = 'broker_invitations';

/**
 * Validate an invitation code
 * Returns the invitation if valid, null if invalid/expired/used up
 */
export async function validateInvitation(code: string): Promise<Invitation | null> {
  console.log('[Invitations] Validating code:', code);

  const { data, error } = await forsured(TABLE_NAME)
    .select('*')
    .eq('code', code.toUpperCase())
    .single();

  if (error) {
    // PGRST116 means not found, which is expected for invalid codes
    if (error.code === 'PGRST116') {
      console.log('[Invitations] Code not found');
      return null;
    }
    console.error('[Invitations] Error validating invitation:', error);
    return null;
  }

  if (!data) {
    console.log('[Invitations] No data returned');
    return null;
  }

  // Check if expired
  if (new Date(data.expires_at) < new Date()) {
    console.log('[Invitations] Code expired');
    return null;
  }

  // Check if max uses reached
  if (data.use_count >= data.max_uses) {
    console.log('[Invitations] Max uses reached');
    return null;
  }

  console.log('[Invitations] Code valid');
  return data;
}

/**
 * Mark an invitation as used and increment use count
 */
export async function markInvitationUsed(
  invitationId: string,
  profileId: string
): Promise<void> {
  console.log('[Invitations] Marking invitation as used:', invitationId);

  // First get current use_count
  const { data: current, error: fetchError } = await forsured(TABLE_NAME)
    .select('use_count')
    .eq('id', invitationId)
    .single();

  if (fetchError) {
    console.error('[Invitations] Error fetching invitation:', fetchError);
    throw fetchError;
  }

  // Update with incremented count
  const { error: updateError } = await forsured(TABLE_NAME)
    .update({
      used_by: profileId,
      used_at: new Date().toISOString(),
      use_count: (current?.use_count || 0) + 1,
    })
    .eq('id', invitationId);

  if (updateError) {
    console.error('[Invitations] Error updating invitation:', updateError);
    throw updateError;
  }

  console.log('[Invitations] Invitation marked as used');
}

/**
 * Create a new broker invitation
 * Used by admins to generate invitation codes
 */
export async function createInvitation(options: {
  email?: string;
  maxUses?: number;
  expiresInDays?: number;
  createdBy: string;
}): Promise<Invitation> {
  const { email, maxUses = 1, expiresInDays = 30, createdBy } = options;

  // Generate a unique code (8 characters, alphanumeric uppercase)
  const code = generateInvitationCode();

  // Calculate expiration date
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);

  console.log('[Invitations] Creating invitation:', { code, email, maxUses, expiresAt });

  const { data, error } = await forsured(TABLE_NAME)
    .insert({
      code,
      email: email || null,
      max_uses: maxUses,
      use_count: 0,
      expires_at: expiresAt.toISOString(),
      created_by: createdBy,
    })
    .select()
    .single();

  if (error) {
    console.error('[Invitations] Error creating invitation:', error);
    throw error;
  }

  console.log('[Invitations] Invitation created successfully');

  // Send invitation email if email address was provided
  if (email) {
    try {
      const emailResult = await sendBrokerInvitation({
        email,
        invitationCode: code,
        expiresAt,
      });
      console.log('[Invitations] Invitation email sent:', emailResult.success);
    } catch (emailError) {
      // Log but don't fail - invitation was still created
      console.error('[Invitations] Failed to send invitation email:', emailError);
    }
  }

  return data;
}

/**
 * List all invitations (for admin)
 */
export async function listInvitations(): Promise<Invitation[]> {
  const { data, error } = await forsured(TABLE_NAME)
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Invitations] Error listing invitations:', error);
    throw error;
  }

  return data || [];
}

/**
 * Revoke an invitation (set max_uses to use_count)
 */
export async function revokeInvitation(invitationId: string): Promise<void> {
  console.log('[Invitations] Revoking invitation:', invitationId);

  const { data: current, error: fetchError } = await forsured(TABLE_NAME)
    .select('use_count')
    .eq('id', invitationId)
    .single();

  if (fetchError) {
    console.error('[Invitations] Error fetching invitation:', fetchError);
    throw fetchError;
  }

  const { error: updateError } = await forsured(TABLE_NAME)
    .update({
      max_uses: current?.use_count || 0, // Set max_uses to current use_count to prevent further uses
    })
    .eq('id', invitationId);

  if (updateError) {
    console.error('[Invitations] Error revoking invitation:', updateError);
    throw updateError;
  }

  console.log('[Invitations] Invitation revoked');
}

/**
 * Generate a unique 8-character invitation code
 */
function generateInvitationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars like 0/O, 1/I
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
