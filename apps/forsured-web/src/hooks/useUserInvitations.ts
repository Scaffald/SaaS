/**
 * User Invitations Hook
 * REQ-212: Code Updates for Shared Database Architecture
 *
 * Uses `user_invitations` table in forsured schema
 */

import { useState, useEffect } from 'react';
import { UserInvitation } from '../types';
import { useDatabase } from '../contexts/DatabaseContext';
import { formatSupabaseError } from '../lib/database/formatSupabaseError';
import { sendBrokerInvitation } from '../services/emailService';

/**
 * Generate an invitation code (8 characters, alphanumeric uppercase)
 */
function generateInvitationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars like 0/O, 1/I
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

interface UseUserInvitationsOptions {
  status?: UserInvitation['status'];
  invitedBy?: string;
  organizationId?: string | null;
}

export function useUserInvitations(options: UseUserInvitationsOptions = {}) {
  const [invitations, setInvitations] = useState<UserInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { supabase } = useDatabase();

  useEffect(() => {
    fetchInvitations();
  }, [options.status, options.invitedBy, options.organizationId]);

  const fetchInvitations = async () => {
    try {
      setLoading(true);

      let query = supabase
        .schema('forsured')
        .from('user_invitations')
        .select('*');

      if (options.status) {
        query = query.eq('status', options.status);
      }

      if (options.invitedBy) {
        query = query.eq('invited_by', options.invitedBy);
      }

      // Also filter by organization_id if provided and not empty
      // This ensures we only see invitations for the same broker organization/team
      // Invited users join the same organization as the inviter
      if (options.organizationId && options.organizationId.trim() !== '') {
        query = query.eq('organization_id', options.organizationId);
      }

      query = query.order('created_at', { ascending: false });

      console.log('[useUserInvitations] Fetching invitations with options:', options);
      const { data, error: supabaseError } = await query;

      if (supabaseError) {
        console.error('[useUserInvitations] Error fetching invitations:', supabaseError);
        throw formatSupabaseError(supabaseError, 'fetching invitations');
      }

      console.log('[useUserInvitations] Raw invitation data:', data);

      // Transform database records to match UserInvitation interface
      // Handle missing fields and ensure compatibility
      const transformedInvitations = (data || []).map((inv) => ({
        ...inv,
        name: (inv as unknown as { name?: string })?.name,
        invited_at: inv.created_at, // Use created_at as invited_at if not present
      })) as UserInvitation[];

      console.log('[useUserInvitations] Transformed invitations:', transformedInvitations);
      setInvitations(transformedInvitations);
    } catch (err) {
      console.error('[useUserInvitations] Error in fetchInvitations:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  const createInvitation = async (
    invitation: Omit<UserInvitation, 'id' | 'created_at' | 'updated_at' | 'token' | 'expires_at'>
  ) => {
    // Generate invitation code/token
    const invitationCode = generateInvitationCode();
    
    // Calculate expiration (30 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Prepare insert data matching database schema
    // Note: Database schema has: id, email, token, invited_by, organization_id, role, status, expires_at, created_at, updated_at, accepted_at
    // The 'name' field may not exist in DB, so we only include fields that definitely exist
    const insertData: Record<string, unknown> = {
      email: invitation.email,
      role: invitation.role,
      invited_by: invitation.invited_by,
      status: invitation.status || 'pending',
      token: invitationCode,
      expires_at: expiresAt.toISOString(),
      organization_id: invitation.organization_id || '',
    };

    // Try to include name if it exists (Supabase will ignore if column doesn't exist)
    if (invitation.name) {
      insertData.name = invitation.name;
    }

    const { data, error: supabaseError } = await supabase
      .schema('forsured')
      .from('user_invitations')
      .insert(insertData)
      .select()
      .single();

    if (supabaseError) {
      throw formatSupabaseError(supabaseError, 'creating invitation');
    }

    await fetchInvitations();
    return data;
  };

  const updateInvitation = async (
    id: string,
    updates: Partial<UserInvitation>
  ) => {
    const { data, error: supabaseError } = await supabase
      .schema('forsured')
      .from('user_invitations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (supabaseError) {
      throw formatSupabaseError(supabaseError, 'updating invitation');
    }

    await fetchInvitations();
    return data;
  };

  const deleteInvitation = async (id: string) => {
    const { error: supabaseError } = await supabase
      .schema('forsured')
      .from('user_invitations')
      .delete()
      .eq('id', id);

    if (supabaseError) {
      throw formatSupabaseError(supabaseError, 'deleting invitation');
    }

    await fetchInvitations();
  };

  const resendInvitation = async (id: string) => {
    // Fetch the invitation to get email and other details
    const { data: invitation, error: fetchError } = await supabase
      .schema('forsured')
      .from('user_invitations')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !invitation) {
      throw formatSupabaseError(fetchError || new Error('Invitation not found'), 'fetching invitation');
    }

    // Generate new invitation code
    const invitationCode = generateInvitationCode();
    
    // Calculate expiration (30 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Update invitation with new token and expiration
    const { data: updatedInvitation, error: updateError } = await supabase
      .schema('forsured')
      .from('user_invitations')
      .update({
        token: invitationCode, // Store code as token
        expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      throw formatSupabaseError(updateError, 'updating invitation');
    }

    // Send invitation email
    try {
      // Try to get name from invitation (may not exist in DB)
      // The database schema doesn't have name, but the TypeScript interface does
      // So we check both the typed field and the raw data
      const invitationName = invitation.name || (invitation as unknown as { name?: string })?.name;
      
      await sendBrokerInvitation({
        email: invitation.email,
        name: invitationName || undefined,
        invitationCode,
        expiresAt,
      });
    } catch (emailError) {
      // Log but don't fail - invitation was updated
      console.error('[useUserInvitations] Failed to send resend email:', emailError);
      throw emailError;
    }

    await fetchInvitations();
    return updatedInvitation;
  };

  return {
    invitations,
    loading,
    error,
    fetchInvitations,
    createInvitation,
    updateInvitation,
    deleteInvitation,
    resendInvitation,
  };
}
