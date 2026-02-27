/**
 * Attachments Hook
 * Code Updates for Shared Database Architecture
 *
 * Uses `attachments` table in forsured schema:
 * - id (uuid, primary key)
 * - entity_type (text) - task, project, document, etc.
 * - entity_id (uuid) - foreign key to entity
 * - file_name (text)
 * - file_size (integer)
 * - file_type (text)
 * - file_url (text, nullable) - mock URL
 * - uploaded_by (uuid) - foreign key to scaffald.users
 * - organization_id (uuid) - foreign key to scaffald.organizations
 * - created_at (timestamptz)
 * - updated_at (timestamptz)
 */

import { useState, useEffect } from 'react';
import { Attachment, EntityType } from '../types';
import { useDatabase } from '../contexts/DatabaseContext';
import { formatSupabaseError } from '../lib/database/formatSupabaseError';

interface UseAttachmentsOptions {
  entityType?: EntityType;
  entityId?: string;
  uploadedBy?: string;
}

export function useAttachments(options: UseAttachmentsOptions = {}) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { supabase } = useDatabase();

  useEffect(() => {
    fetchAttachments();
  }, [options.entityType, options.entityId, options.uploadedBy]);

  const fetchAttachments = async () => {
    try {
      setLoading(true);

      let query = supabase.schema('forsured').from('attachments').select('*');

      if (options.entityType && options.entityId) {
        query = query.eq('entity_type', options.entityType).eq('entity_id', options.entityId);
      }

      if (options.uploadedBy) {
        query = query.eq('uploaded_by', options.uploadedBy);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error: supabaseError } = await query;

      if (supabaseError) {
        throw formatSupabaseError(supabaseError, 'fetching attachments');
      }

      setAttachments(data || []);
    } catch (err) {
      console.error('[useAttachments] Error fetching attachments:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  const createAttachment = async (
    attachment: Omit<Attachment, 'id' | 'created_at' | 'updated_at'>
  ) => {
    try {
      const { data, error: supabaseError } = await supabase
        .schema('forsured')
        .from('attachments')
        .insert(attachment)
        .select()
        .single();

      if (supabaseError) {
        throw formatSupabaseError(supabaseError, 'creating attachment');
      }

      await fetchAttachments();
      return data;
    } catch (err) {
      console.error('[useAttachments] Error creating attachment:', err);
      throw err;
    }
  };

  const deleteAttachment = async (id: string) => {
    try {
      const { error: supabaseError } = await supabase
        .schema('forsured')
        .from('attachments')
        .delete()
        .eq('id', id);

      if (supabaseError) {
        throw formatSupabaseError(supabaseError, 'deleting attachment');
      }

      await fetchAttachments();
    } catch (err) {
      console.error('[useAttachments] Error deleting attachment:', err);
      throw err;
    }
  };

  return {
    attachments,
    loading,
    error,
    fetchAttachments,
    createAttachment,
    deleteAttachment,
  };
}
