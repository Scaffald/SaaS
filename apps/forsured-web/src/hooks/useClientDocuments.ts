/**
 * useClientDocuments - Hook for managing client-level documents
 * Used by brokers to upload and view documents for their clients
 */

import { useState, useCallback, useEffect } from 'react';
import { supabase, forsured } from '../lib/supabase';
import { toast } from 'sonner';

export interface ClientDocument {
  id: string;
  client_id: string;
  uploader_id: string;
  file_name: string;
  file_url: string;
  file_size: number;
  file_type: string;
  category: 'compliance' | 'insurance' | 'contract' | 'general';
  description?: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  uploaded_at: string;
  created_at: string;
  updated_at: string;
}

interface UseClientDocumentsOptions {
  clientId: string;
}

export function useClientDocuments({ clientId }: UseClientDocumentsOptions) {
  const [documents, setDocuments] = useState<ClientDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Fetch documents for the client
  const fetchDocuments = useCallback(async () => {
    if (!clientId) {
      setDocuments([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Query the documents table for this client
      const { data, error } = await forsured('documents')
        .select('*')
        .eq('organization_id', clientId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[useClientDocuments] Error fetching documents:', error);
        setDocuments([]);
      } else {
        // Map database fields to our interface
        const mappedDocs: ClientDocument[] = (data || []).map((doc) => ({
          id: doc.id,
          client_id: doc.organization_id,
          uploader_id: doc.uploader_id,
          file_name: doc.file_name,
          file_url: doc.file_url,
          file_size: doc.file_size || 0,
          file_type: doc.file_type || 'application/pdf',
          category: doc.category || 'general',
          description: doc.description,
          status: doc.status || 'pending',
          uploaded_at: doc.upload_date || doc.created_at,
          created_at: doc.created_at,
          updated_at: doc.updated_at,
        }));
        setDocuments(mappedDocs);
      }
    } catch (err) {
      console.error('[useClientDocuments] Error:', err);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  // Upload a document
  const uploadDocument = useCallback(
    async (
      file: File,
      uploaderId: string,
      category: 'compliance' | 'insurance' | 'contract' | 'general' = 'general',
      description?: string
    ) => {
      if (!clientId) {
        throw new Error('Client ID is required');
      }

      // Validate file
      if (file.type !== 'application/pdf') {
        throw new Error('Only PDF files are supported');
      }

      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File size must be less than 10MB');
      }

      setUploading(true);

      try {
        // Generate a unique file path
        const timestamp = Date.now();
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const filePath = `clients/${clientId}/${timestamp}_${sanitizedName}`;

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
            organization_id: clientId,
            uploader_id: uploaderId,
            file_name: file.name,
            file_url: urlData.publicUrl,
            file_size: file.size,
            file_type: file.type,
            category,
            description,
            upload_date: new Date().toISOString(),
            status: 'pending',
          })
          .select()
          .single();

        if (insertError) {
          throw insertError;
        }

        // Add the new document to the list
        const newDoc: ClientDocument = {
          id: docData.id,
          client_id: docData.organization_id,
          uploader_id: docData.uploader_id,
          file_name: docData.file_name,
          file_url: docData.file_url,
          file_size: docData.file_size || 0,
          file_type: docData.file_type || 'application/pdf',
          category: docData.category || 'general',
          description: docData.description,
          status: docData.status || 'pending',
          uploaded_at: docData.upload_date || docData.created_at,
          created_at: docData.created_at,
          updated_at: docData.updated_at,
        };

        setDocuments((prev) => [newDoc, ...prev]);
        toast.success('Document uploaded successfully');
        return newDoc;
      } catch (err) {
        console.error('[useClientDocuments] Error uploading document:', err);
        toast.error('Failed to upload document');
        throw err;
      } finally {
        setUploading(false);
      }
    },
    [clientId]
  );

  // Delete a document
  const deleteDocument = useCallback(
    async (documentId: string) => {
      try {
        const doc = documents.find((d) => d.id === documentId);
        if (!doc) {
          throw new Error('Document not found');
        }

        // Delete from database
        const { error: deleteError } = await forsured('documents')
          .delete()
          .eq('id', documentId);

        if (deleteError) {
          throw deleteError;
        }

        // Try to delete from storage (extract path from URL)
        const urlParts = doc.file_url.split('/documents/');
        if (urlParts.length > 1) {
          const filePath = urlParts[1];
          await supabase.storage.from('documents').remove([filePath]);
        }

        // Remove from local state
        setDocuments((prev) => prev.filter((d) => d.id !== documentId));
        toast.success('Document deleted');
      } catch (err) {
        console.error('[useClientDocuments] Error deleting document:', err);
        toast.error('Failed to delete document');
        throw err;
      }
    },
    [documents]
  );

  // Fetch documents on mount and when clientId changes
  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  return {
    documents,
    loading,
    uploading,
    uploadDocument,
    deleteDocument,
    refreshDocuments: fetchDocuments,
  };
}
