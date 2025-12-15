// src/lib/scaffald/types.ts

interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
}

export interface ScaffaldUser {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  companies: ScaffaldCompanyMembership[];
  created_at: string;
}

export interface ScaffaldCompanyMembership {
  company_id: string;
  company_name: string;
  role: 'owner' | 'admin' | 'member';
}

export interface ScaffaldCompany {
  id: string;
  name: string;
  address: Address;
  phone?: string;
  website?: string;
  logo_url?: string;
  created_at: string;
  updated_at: string;
}

export interface ScaffaldProject {
  id: string;
  company_id: string;
  name: string;
  address: Address;
  status: 'planning' | 'active' | 'completed' | 'cancelled';
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCompanyInput {
  name: string;
  address: Address;
  phone?: string;
  website?: string;
}

export interface UpdateCompanyInput extends Partial<CreateCompanyInput> {}

export interface CreateProjectInput {
  company_id: string;
  name: string;
  address: Address;
  status: 'planning' | 'active' | 'completed' | 'cancelled';
  start_date?: string;
  end_date?: string;
}

export interface UpdateProjectInput extends Partial<CreateProjectInput> {}

export interface Invitation {
  id: string;
  company_id: string;
  email: string;
}

// ============================================
// Document Types (REQ-1: Document Storage)
// ============================================

export type DocumentCategory =
  | 'contracts'
  | 'templates'
  | 'compliance'
  | 'certifications'
  | 'onboarding'
  | 'general'
  | 'other';

export type StorageBackend = 'supabase' | 'dropbox' | 'google_drive';

export interface ScaffaldDocument {
  id: string;
  name: string;
  description?: string | null;
  category: DocumentCategory;
  tags: string[];
  isTemplate: boolean;
  versionCount: number;
  latestVersionNumber: number;
  latestSizeBytes: number;
  latestMimeType?: string | null;
  oauthAppId?: string | null;
  storagePath?: string;
  storageBackend?: StorageBackend;
  downloadUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  folderId?: string | null;
  folder?: { id: string; name: string } | null;
  createdByUser?: { id: string; firstName?: string; lastName?: string } | null;
}

export interface ScaffaldDocumentVersion {
  id: string;
  versionNumber: number;
  sizeBytes: number;
  mimeType?: string | null;
  checksum?: string | null;
  notes?: string | null;
  createdAt: string;
  uploadedByUser?: { id: string; firstName?: string; lastName?: string; email?: string } | null;
}

export interface UploadDocumentInput {
  organizationId: string;
  folderId?: string | null;
  name: string;
  description?: string | null;
  category?: DocumentCategory;
  tags?: string[];
  isTemplate?: boolean;
  file: string; // base64 encoded
  fileName: string;
  contentType: string;
  fileSize: number;
}

export interface UploadDocumentResponse {
  id: string;
  name: string;
  category: DocumentCategory;
  storageBackend: StorageBackend;
  storagePath: string;
  downloadUrl?: string | null;
  oauthAppId?: string | null;
  version: number;
  fileSize: number;
  mimeType: string;
  checksum: string;
  createdAt: string;
  uploadedBy: string;
}

export interface ListDocumentsInput {
  organizationId: string;
  folderId?: string | null;
  category?: DocumentCategory;
  tags?: string[];
  oauthAppId?: string;
  isTemplate?: boolean;
  includeDeleted?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'name' | 'updatedAt' | 'latestSizeBytes';
  sortOrder?: 'asc' | 'desc';
}

export interface ListDocumentsResponse {
  documents: ScaffaldDocument[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface UpdateDocumentInput {
  name?: string;
  description?: string | null;
  category?: DocumentCategory;
  tags?: string[];
  folderId?: string | null;
  isTemplate?: boolean;
}

export interface GetDownloadUrlInput {
  documentId: string;
  versionId?: string;
  expiresIn?: number;
}

export interface GetDownloadUrlResponse {
  downloadUrl: string | null;
  expiresIn: number;
}

export interface UploadVersionInput {
  documentId: string;
  file: string; // base64 encoded
  fileName: string;
  contentType: string;
  fileSize: number;
  notes?: string;
}

export interface UploadVersionResponse {
  versionId: string;
  versionNumber: number;
  downloadUrl?: string | null;
  checksum: string;
  createdAt: string;
}
