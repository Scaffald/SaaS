// src/services/documentUpload.ts
// REQ-126: Document upload service for onboarding COI uploads
//
// Handles file uploads to Supabase storage during the onboarding process.

import { supabase, forsured } from '../lib/supabase';

export type DocumentType = 'gl_coi' | 'wc_coi' | 'auto_coi' | 'umbrella_coi' | 'other';

export interface UploadedDocument {
  id: string;
  user_id: string;
  document_type: DocumentType;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  public_url: string;
  created_at: string;
}

export interface UploadOptions {
  /** Override the file name (defaults to original file name) */
  fileName?: string;
  /** Make the file publicly accessible (defaults to false) */
  isPublic?: boolean;
  /** Additional metadata to store with the document */
  metadata?: Record<string, unknown>;
}

/**
 * Upload a document to Supabase storage and create a database record
 *
 * @param userId - The user's Scaffald user ID
 * @param file - The file to upload
 * @param documentType - The type of document (e.g., 'gl_coi', 'wc_coi')
 * @param options - Optional upload configuration
 * @returns The uploaded document record
 */
export async function uploadDocument(
  userId: string,
  file: File,
  documentType: DocumentType,
  options: UploadOptions = {}
): Promise<UploadedDocument> {
  const { fileName, isPublic = false, metadata = {} } = options;

  // Generate unique file path
  const timestamp = Date.now();
  const sanitizedFileName = sanitizeFileName(fileName || file.name);
  const filePath = `${userId}/${documentType}/${timestamp}_${sanitizedFileName}`;

  console.log(`[DocumentUpload] Uploading ${documentType} for user ${userId}:`, filePath);

  // 1. Upload file to Supabase storage
  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    console.error('[DocumentUpload] Storage upload error:', uploadError);
    throw new Error(`Failed to upload document: ${uploadError.message}`);
  }

  // 2. Get the public URL (or signed URL if private)
  let publicUrl: string;
  if (isPublic) {
    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);
    publicUrl = urlData.publicUrl;
  } else {
    const { data: signedData, error: signedError } = await supabase.storage
      .from('documents')
      .createSignedUrl(filePath, 60 * 60 * 24 * 7); // 7 days

    if (signedError) {
      console.error('[DocumentUpload] Error creating signed URL:', signedError);
      // Fall back to path-based reference
      publicUrl = filePath;
    } else {
      publicUrl = signedData.signedUrl;
    }
  }

  // 3. Create database record for the document
  const { data: document, error: dbError } = await forsured('documents')
    .insert({
      user_id: userId,
      document_type: documentType,
      file_name: sanitizedFileName,
      file_path: filePath,
      file_size: file.size,
      mime_type: file.type,
      storage_bucket: 'documents',
      metadata: {
        ...metadata,
        original_name: file.name,
        uploaded_at: new Date().toISOString(),
      },
    })
    .select()
    .single();

  if (dbError) {
    console.error('[DocumentUpload] Database insert error:', dbError);
    // Try to clean up the uploaded file
    await supabase.storage.from('documents').remove([filePath]);
    throw new Error(`Failed to create document record: ${dbError.message}`);
  }

  console.log('[DocumentUpload] Successfully uploaded document:', document.id);

  return {
    id: document.id,
    user_id: document.user_id,
    document_type: documentType,
    file_name: sanitizedFileName,
    file_path: filePath,
    file_size: file.size,
    mime_type: file.type,
    public_url: publicUrl,
    created_at: document.created_at,
  };
}

/**
 * Upload multiple documents at once
 *
 * @param userId - The user's Scaffald user ID
 * @param files - Array of files with their document types
 * @returns Array of uploaded document records
 */
export async function uploadMultipleDocuments(
  userId: string,
  files: Array<{ file: File; documentType: DocumentType }>
): Promise<UploadedDocument[]> {
  console.log(`[DocumentUpload] Uploading ${files.length} documents for user ${userId}`);

  const results: UploadedDocument[] = [];

  for (const { file, documentType } of files) {
    try {
      const document = await uploadDocument(userId, file, documentType);
      results.push(document);
    } catch (error) {
      console.error(`[DocumentUpload] Failed to upload ${documentType}:`, error);
      // Continue with other files, but track the error
    }
  }

  return results;
}

/**
 * Delete a document from storage and database
 *
 * @param documentId - The document ID to delete
 * @param userId - The user's ID (for authorization check)
 */
export async function deleteDocument(documentId: string, userId: string): Promise<void> {
  console.log(`[DocumentUpload] Deleting document ${documentId} for user ${userId}`);

  // 1. Get the document record
  const { data: document, error: lookupError } = await forsured('documents')
    .select('*')
    .eq('id', documentId)
    .eq('user_id', userId)
    .single();

  if (lookupError || !document) {
    throw new Error('Document not found or access denied');
  }

  // 2. Delete from storage
  const { error: storageError } = await supabase.storage
    .from('documents')
    .remove([document.file_path]);

  if (storageError) {
    console.error('[DocumentUpload] Storage delete error:', storageError);
    // Continue to delete DB record anyway
  }

  // 3. Delete database record
  const { error: dbError } = await forsured('documents')
    .delete()
    .eq('id', documentId);

  if (dbError) {
    console.error('[DocumentUpload] Database delete error:', dbError);
    throw new Error(`Failed to delete document record: ${dbError.message}`);
  }

  console.log('[DocumentUpload] Successfully deleted document');
}

/**
 * Get documents for a user by type
 *
 * @param userId - The user's ID
 * @param documentType - Optional filter by document type
 * @returns Array of document records
 */
export async function getDocuments(
  userId: string,
  documentType?: DocumentType
): Promise<UploadedDocument[]> {
  let query = forsured('documents')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (documentType) {
    query = query.eq('document_type', documentType);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[DocumentUpload] Error fetching documents:', error);
    return [];
  }

  return (data || []).map((doc: Record<string, unknown>) => ({
    id: doc.id as string,
    user_id: doc.user_id as string,
    document_type: doc.document_type as DocumentType,
    file_name: doc.file_name as string,
    file_path: doc.file_path as string,
    file_size: doc.file_size as number,
    mime_type: doc.mime_type as string,
    public_url: doc.file_path as string, // Would need to regenerate signed URL
    created_at: doc.created_at as string,
  }));
}

/**
 * Sanitize file name for safe storage
 */
function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special chars with underscore
    .replace(/_+/g, '_') // Collapse multiple underscores
    .toLowerCase();
}
