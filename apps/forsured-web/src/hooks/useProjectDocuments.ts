/**
 * Project Documents Hook
 *
 * Manages document data for a specific project from forsured.documents table.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase, forsured } from '../lib/supabase';

export interface ProjectDocument {
  id: string;
  project_id: string;
  organization_id: string;
  subcontractor_id: string;
  uploader_id: string | null;
  file_name: string;
  file_url: string;
  file_size: number | null;
  file_type: string | null;
  upload_date: string;
  status: string;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

interface UseProjectDocumentsOptions {
  projectId?: string;
}

export function useProjectDocuments({ projectId }: UseProjectDocumentsOptions) {
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    if (!projectId) {
      setDocuments([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await forsured('documents')
        .select('*')
        .eq('project_id', projectId)
        .order('upload_date', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setDocuments(data || []);
    } catch (err) {
      console.error('[useProjectDocuments] Error fetching documents:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const uploadDocument = useCallback(
    async (file: File, organizationId: string, uploaderId: string, subcontractorId?: string) => {
      if (!projectId) {
        throw new Error('Project ID is required');
      }

      try {
        // Generate a unique file path
        const timestamp = Date.now();
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const filePath = `projects/${projectId}/${timestamp}_${sanitizedName}`;

        // Upload file to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          throw uploadError;
        }

        // Get the public URL
        const { data: urlData } = supabase.storage
          .from('documents')
          .getPublicUrl(filePath);

        // Insert document record into the database
        const { data: docData, error: insertError } = await forsured('documents')
          .insert({
            project_id: projectId,
            organization_id: organizationId,
            subcontractor_id: subcontractorId || organizationId, // Default to org if no sub
            uploader_id: uploaderId,
            file_name: file.name,
            file_url: urlData.publicUrl,
            file_size: file.size,
            file_type: file.type,
            upload_date: new Date().toISOString(),
            status: 'pending',
          })
          .select()
          .single();

        if (insertError) {
          throw insertError;
        }

        // Add the new document to the list
        setDocuments((prev) => [docData, ...prev]);
        return docData;
      } catch (err) {
        console.error('[useProjectDocuments] Error uploading document:', err);
        throw err;
      }
    },
    [projectId]
  );

  const deleteDocument = useCallback(
    async (documentId: string) => {
      try {
        // Find the document to get the file URL for storage deletion
        const doc = documents.find((d) => d.id === documentId);

        // Delete from database
        const { error: deleteError } = await forsured('documents')
          .delete()
          .eq('id', documentId);

        if (deleteError) {
          throw deleteError;
        }

        // Try to delete from storage (extract path from URL)
        if (doc?.file_url) {
          try {
            const url = new URL(doc.file_url);
            const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/documents\/(.+)/);
            if (pathMatch) {
              await supabase.storage.from('documents').remove([pathMatch[1]]);
            }
          } catch {
            // Storage deletion is best-effort
            console.warn('[useProjectDocuments] Could not delete file from storage');
          }
        }

        // Remove from local state
        setDocuments((prev) => prev.filter((d) => d.id !== documentId));
      } catch (err) {
        console.error('[useProjectDocuments] Error deleting document:', err);
        throw err;
      }
    },
    [documents]
  );

  return {
    documents,
    loading,
    error,
    fetchDocuments,
    uploadDocument,
    deleteDocument,
  };
}
