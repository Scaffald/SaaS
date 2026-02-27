/**
 * Task Document Service Layer
 * API functions for managing task documents (uploads and linked references)
 */

import { forsured } from '../supabase';
import type {
  TaskDocument,
  UploadTaskDocumentRequest,
  LinkTaskDocumentRequest,
  UpdateTaskDocumentRequest,
  TaskDocumentType,
} from '../../types';

/**
 * Get all documents for a task (current versions only)
 * @param taskId - Task UUID
 * @param organizationId - Organization UUID
 * @returns Array of current task documents
 */
export async function getTaskDocuments(
  taskId: string,
  organizationId: string
): Promise<TaskDocument[]> {
  if (!taskId || !organizationId) {
    throw new Error('Task ID and Organization ID are required');
  }

  const { data, error } = await forsured('task_documents')
    .select('*')
    .eq('task_id', taskId)
    .eq('organization_id', organizationId)
    .eq('is_current_version', true)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch task documents: ${error.message}`);
  }

  return data || [];
}

/**
 * Get all versions of a specific document
 * @param documentId - Document UUID
 * @param organizationId - Organization UUID
 * @returns Array of all document versions (sorted by version desc)
 */
export async function getDocumentVersionHistory(
  documentId: string,
  organizationId: string
): Promise<TaskDocument[]> {
  if (!documentId || !organizationId) {
    throw new Error('Document ID and Organization ID are required');
  }

  // Get the document to find its task_id
  const { data: doc, error: docError } = await forsured('task_documents')
    .select('task_id')
    .eq('id', documentId)
    .eq('organization_id', organizationId)
    .single();

  if (docError || !doc) {
    throw new Error('Document not found');
  }

  // Get all versions for this task that are part of the version chain
  const { data, error } = await forsured('task_documents')
    .select('*')
    .eq('task_id', doc.task_id)
    .eq('organization_id', organizationId)
    .or(`id.eq.${documentId},replaces_document_id.eq.${documentId}`)
    .order('version', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch document version history: ${error.message}`);
  }

  return data || [];
}

/**
 * Get a single task document by ID
 * @param id - Document UUID
 * @param organizationId - Organization UUID
 * @returns Task document or null if not found
 */
export async function getTaskDocumentById(
  id: string,
  organizationId: string
): Promise<TaskDocument | null> {
  if (!id || !organizationId) {
    throw new Error('Document ID and Organization ID are required');
  }

  const { data, error } = await forsured('task_documents')
    .select('*')
    .eq('id', id)
    .eq('organization_id', organizationId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    throw new Error(`Failed to fetch task document: ${error.message}`);
  }

  return data;
}

/**
 * Upload a document to a task
 * @param request - Upload document request
 * @param userId - Uploading user UUID
 * @returns Created task document
 */
export async function uploadTaskDocument(
  request: UploadTaskDocumentRequest,
  userId: string
): Promise<TaskDocument> {
  if (!userId) {
    throw new Error('User ID is required');
  }

  if (!request.task_id || !request.organization_id) {
    throw new Error('Task ID and Organization ID are required');
  }

  if (!request.document_url || !request.document_name) {
    throw new Error('Document URL and name are required');
  }

  // Validate file size if provided
  if (request.file_size_bytes !== undefined && request.file_size_bytes <= 0) {
    throw new Error('File size must be positive');
  }

  const { data, error } = await forsured('task_documents')
    .insert({
      task_id: request.task_id,
      organization_id: request.organization_id,
      document_type: 'uploaded',
      document_url: request.document_url,
      document_name: request.document_name,
      file_size_bytes: request.file_size_bytes,
      mime_type: request.mime_type,
      description: request.description,
      notes: request.notes,
      uploaded_by: userId,
      replaces_document_id: request.replaces_document_id,
      is_current_version: true,
      version: 1, // Will be incremented by trigger if replacing
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to upload task document: ${error.message}`);
  }

  return data;
}

/**
 * Link a policy or certificate to a task
 * @param request - Link document request
 * @param userId - Linking user UUID
 * @returns Created task document reference
 */
export async function linkTaskDocument(
  request: LinkTaskDocumentRequest,
  userId: string
): Promise<TaskDocument> {
  if (!userId) {
    throw new Error('User ID is required');
  }

  if (!request.task_id || !request.organization_id) {
    throw new Error('Task ID and Organization ID are required');
  }

  // Validate linked reference is provided
  if (request.document_type === 'linked_policy' && !request.linked_policy_id) {
    throw new Error('Policy ID is required for linked_policy document type');
  }

  if (
    (request.document_type === 'linked_certificate' ||
      request.document_type === 'linked_endorsement') &&
    !request.linked_certificate_id
  ) {
    throw new Error(
      'Certificate ID is required for linked_certificate/linked_endorsement document type'
    );
  }

  const { data, error } = await forsured('task_documents')
    .insert({
      task_id: request.task_id,
      organization_id: request.organization_id,
      document_type: request.document_type,
      linked_policy_id: request.linked_policy_id,
      linked_certificate_id: request.linked_certificate_id,
      description: request.description,
      notes: request.notes,
      uploaded_by: userId,
      is_current_version: true,
      version: 1,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to link task document: ${error.message}`);
  }

  return data;
}

/**
 * Update a task document (description/notes only)
 * @param id - Document UUID
 * @param organizationId - Organization UUID
 * @param updates - Document updates
 * @returns Updated task document
 */
export async function updateTaskDocument(
  id: string,
  organizationId: string,
  updates: UpdateTaskDocumentRequest
): Promise<TaskDocument> {
  if (!id || !organizationId) {
    throw new Error('Document ID and Organization ID are required');
  }

  const { data, error } = await forsured('task_documents')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('organization_id', organizationId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update task document: ${error.message}`);
  }

  return data;
}

/**
 * Delete a task document
 * @param id - Document UUID
 * @param organizationId - Organization UUID
 */
export async function deleteTaskDocument(
  id: string,
  organizationId: string
): Promise<void> {
  if (!id || !organizationId) {
    throw new Error('Document ID and Organization ID are required');
  }

  const { error } = await forsured('task_documents')
    .delete()
    .eq('id', id)
    .eq('organization_id', organizationId);

  if (error) {
    throw new Error(`Failed to delete task document: ${error.message}`);
  }
}

/**
 * Get documents by type for a task
 * @param taskId - Task UUID
 * @param organizationId - Organization UUID
 * @param documentType - Document type to filter by
 * @returns Array of task documents of specified type
 */
export async function getTaskDocumentsByType(
  taskId: string,
  organizationId: string,
  documentType: TaskDocumentType
): Promise<TaskDocument[]> {
  if (!taskId || !organizationId) {
    throw new Error('Task ID and Organization ID are required');
  }

  const { data, error } = await forsured('task_documents')
    .select('*')
    .eq('task_id', taskId)
    .eq('organization_id', organizationId)
    .eq('document_type', documentType)
    .eq('is_current_version', true)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch task documents by type: ${error.message}`);
  }

  return data || [];
}

/**
 * Get all uploaded documents for a task
 * @param taskId - Task UUID
 * @param organizationId - Organization UUID
 * @returns Array of uploaded task documents
 */
export async function getUploadedDocuments(
  taskId: string,
  organizationId: string
): Promise<TaskDocument[]> {
  return getTaskDocumentsByType(taskId, organizationId, 'uploaded');
}

/**
 * Get all linked policies for a task
 * @param taskId - Task UUID
 * @param organizationId - Organization UUID
 * @returns Array of linked policy documents
 */
export async function getLinkedPolicies(
  taskId: string,
  organizationId: string
): Promise<TaskDocument[]> {
  return getTaskDocumentsByType(taskId, organizationId, 'linked_policy');
}

/**
 * Check if a task has any documents
 * @param taskId - Task UUID
 * @param organizationId - Organization UUID
 * @returns Boolean indicating if task has documents
 */
export async function taskHasDocuments(
  taskId: string,
  organizationId: string
): Promise<boolean> {
  if (!taskId || !organizationId) {
    throw new Error('Task ID and Organization ID are required');
  }

  const { count, error } = await forsured('task_documents')
    .select('id', { count: 'exact', head: true })
    .eq('task_id', taskId)
    .eq('organization_id', organizationId)
    .eq('is_current_version', true);

  if (error) {
    throw new Error(`Failed to check task documents: ${error.message}`);
  }

  return (count ?? 0) > 0;
}
