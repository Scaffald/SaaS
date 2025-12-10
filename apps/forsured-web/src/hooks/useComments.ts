/**
 * Comments Hook
 * REQ-212: Code Updates for Shared Database Architecture
 *
 * Uses `comments` table in forsured schema:
 * - id (uuid, primary key)
 * - entity_type (text) - task, project, document, etc.
 * - entity_id (uuid) - foreign key to entity
 * - user_id (uuid) - foreign key to scaffald.users
 * - organization_id (uuid) - foreign key to scaffald.organizations
 * - content (text)
 * - created_at (timestamptz)
 * - updated_at (timestamptz)
 * - edited_at (timestamptz, nullable)
 */

import { useState, useEffect } from 'react';
import { Comment, EntityType } from '../types';
import { useDatabase } from '../contexts/DatabaseContext';
import MockDatabase from '../utils/mockDataStore';
import { formatSupabaseError } from '../lib/database/formatSupabaseError';

interface UseCommentsOptions {
  entityType?: EntityType;
  entityId?: string;
  userId?: string;
}

export function useComments(options: UseCommentsOptions = {}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { useMockData, supabase } = useDatabase();

  useEffect(() => {
    fetchComments();
  }, [options.entityType, options.entityId, options.userId]);

  const fetchComments = async () => {
    try {
      setLoading(true);

      if (useMockData) {
        // Use mock database
        const filters: Record<string, unknown> = {};

        if (options.entityType && options.entityId) {
          filters.entity_type = options.entityType;
          filters.entity_id = options.entityId;
        }

        if (options.userId) {
          filters.user_id = options.userId;
        }

        const data = await MockDatabase.query<Comment>('comments', filters, {
          column: 'created_at',
          ascending: true,
        });
        setComments(data);
      } else {
        // Use real Supabase
        let query = supabase.schema('forsured').from('comments').select('*');

        if (options.entityType && options.entityId) {
          query = query.eq('entity_type', options.entityType).eq('entity_id', options.entityId);
        }

        if (options.userId) {
          query = query.eq('user_id', options.userId);
        }

        query = query.order('created_at', { ascending: true });

        const { data, error: supabaseError } = await query;

        if (supabaseError) {
          throw formatSupabaseError(supabaseError, 'fetching comments');
        }

        setComments(data || []);
      }
    } catch (err) {
      console.error('[useComments] Error fetching comments:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  const createComment = async (
    comment: Omit<Comment, 'id' | 'created_at' | 'updated_at'>
  ) => {
    try {
      if (useMockData) {
        const data = await MockDatabase.insert<Comment>('comments', comment);
        await fetchComments();
        return data;
      } else {
        // Use real Supabase
        const { data, error: supabaseError } = await supabase
          .schema('forsured')
          .from('comments')
          .insert(comment)
          .select()
          .single();

        if (supabaseError) {
          throw formatSupabaseError(supabaseError, 'creating comment');
        }

        await fetchComments();
        return data;
      }
    } catch (err) {
      console.error('[useComments] Error creating comment:', err);
      throw err;
    }
  };

  const updateComment = async (id: string, updates: Partial<Comment>) => {
    try {
      if (useMockData) {
        const now = new Date().toISOString();
        const data = await MockDatabase.update<Comment>('comments', id, {
          ...updates,
          edited_at: now,
        });
        await fetchComments();
        return data;
      } else {
        // Use real Supabase
        const now = new Date().toISOString();
        const { data, error: supabaseError } = await supabase
          .schema('forsured')
          .from('comments')
          .update({ ...updates, edited_at: now })
          .eq('id', id)
          .select()
          .single();

        if (supabaseError) {
          throw formatSupabaseError(supabaseError, 'updating comment');
        }

        await fetchComments();
        return data;
      }
    } catch (err) {
      console.error('[useComments] Error updating comment:', err);
      throw err;
    }
  };

  const deleteComment = async (id: string) => {
    try {
      if (useMockData) {
        await MockDatabase.delete('comments', id);
        await fetchComments();
      } else {
        // Use real Supabase
        const { error: supabaseError } = await supabase
          .schema('forsured')
          .from('comments')
          .delete()
          .eq('id', id);

        if (supabaseError) {
          throw formatSupabaseError(supabaseError, 'deleting comment');
        }

        await fetchComments();
      }
    } catch (err) {
      console.error('[useComments] Error deleting comment:', err);
      throw err;
    }
  };

  return {
    comments,
    loading,
    error,
    fetchComments,
    createComment,
    updateComment,
    deleteComment,
  };
}
