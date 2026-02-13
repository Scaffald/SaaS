/**
 * Comments Hook
 * Shared database architecture
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

<<<<<<< HEAD
import { useEffect, useState } from "react";
import { Comment, EntityType } from "../types";
import { useDatabase } from "../contexts/DatabaseContext";
import { formatSupabaseError } from "../lib/database/formatSupabaseError";
import { core } from "../lib/supabase";
=======
import { useState, useEffect } from 'react';
import { Comment, EntityType } from '../types';
import { useDatabase } from '../contexts/DatabaseContext';
import { formatSupabaseError } from '../lib/database/formatSupabaseError';
import { forsured } from '../lib/supabase';
>>>>>>> 264530c73bf14a52195cd0553c9391f21eeccac1

interface UseCommentsOptions {
  entityType?: EntityType;
  entityId?: string;
  userId?: string;
}

export function useComments(options: UseCommentsOptions = {}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { supabase } = useDatabase();

  useEffect(() => {
    fetchComments();
  }, [options.entityType, options.entityId, options.userId]);

  const fetchComments = async () => {
    try {
      setLoading(true);

      // Validate UUID format before querying
      if (
        options.entityId &&
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          options.entityId,
        )
      ) {
        console.warn(
          "[useComments] Invalid entityId format (expected UUID):",
          options.entityId,
        );
        setComments([]);
        setLoading(false);
        return;
      }

      let query = supabase.schema("forsured").from("comments").select("*");

      if (options.entityType && options.entityId) {
        query = query.eq("entity_type", options.entityType).eq(
          "entity_id",
          options.entityId,
        );
      }

      if (options.userId) {
        query = query.eq("user_id", options.userId);
      }

      query = query.order("created_at", { ascending: true });

      const { data, error: supabaseError } = await query;

      if (supabaseError) {
        throw formatSupabaseError(supabaseError, "fetching comments");
      }

      const commentsData = data || [];

      // Fetch user information for all unique user_ids
      const uniqueUserIds = [...new Set(commentsData.map((c) => c.user_id))];
      const userMap = new Map<
        string,
        { display_name?: string; username?: string }
      >();

      if (uniqueUserIds.length > 0) {
        try {
<<<<<<< HEAD
          const { data: usersData, error: usersError } = await core("users")
            .select("id, display_name, username")
            .in("id", uniqueUserIds);
=======
          const { data: usersData, error: usersError } = await forsured('users')
            .select('id, display_name, username')
            .in('id', uniqueUserIds);
>>>>>>> 264530c73bf14a52195cd0553c9391f21eeccac1

          if (!usersError && usersData) {
            usersData.forEach((user) => {
              userMap.set(user.id, {
                display_name: user.display_name || undefined,
                username: user.username || undefined,
              });
            });
          }
        } catch (err) {
          console.warn("[useComments] Error fetching user information:", err);
          // Continue without user information if fetch fails
        }
      }

      // Merge user information with comments
      const commentsWithUsers: Comment[] = commentsData.map((comment) => {
        const user = userMap.get(comment.user_id);
        const userDisplayName = user?.display_name?.trim();
        const userName = userDisplayName || user?.username?.trim() || undefined;

        return {
          ...comment,
          user_name: userName,
          user_display_name: userDisplayName,
        };
      });

      setComments(commentsWithUsers);
    } catch (err) {
      console.error("[useComments] Error fetching comments:", err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  const createComment = async (
    comment: Omit<Comment, "id" | "created_at" | "updated_at">,
  ) => {
    try {
      const { data, error: supabaseError } = await supabase
        .schema("forsured")
        .from("comments")
        .insert(comment)
        .select()
        .single();

      if (supabaseError) {
        throw formatSupabaseError(supabaseError, "creating comment");
      }

      await fetchComments();
      return data;
    } catch (err) {
      console.error("[useComments] Error creating comment:", err);
      throw err;
    }
  };

  const updateComment = async (id: string, updates: Partial<Comment>) => {
    try {
      const now = new Date().toISOString();
      const { data, error: supabaseError } = await supabase
        .schema("forsured")
        .from("comments")
        .update({ ...updates, edited_at: now })
        .eq("id", id)
        .select()
        .single();

      if (supabaseError) {
        throw formatSupabaseError(supabaseError, "updating comment");
      }

      await fetchComments();
      return data;
    } catch (err) {
      console.error("[useComments] Error updating comment:", err);
      throw err;
    }
  };

  const deleteComment = async (id: string) => {
    try {
      const { error: supabaseError } = await supabase
        .schema("forsured")
        .from("comments")
        .delete()
        .eq("id", id);

      if (supabaseError) {
        throw formatSupabaseError(supabaseError, "deleting comment");
      }

      await fetchComments();
    } catch (err) {
      console.error("[useComments] Error deleting comment:", err);
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
