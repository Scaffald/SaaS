/**
 * ProjectDocumentsTab - Document management for a specific project
 *
 * Allows users to upload, view, and manage documents associated with a project.
 */

'use client';

import { useState, useCallback, useRef } from 'react';
import {
  FileText,
  Upload,
  Trash2,
  Download,
  AlertTriangle,
  CheckCircle,
  Clock,
  X,
  Loader2,
  Plus,
  File,
} from 'lucide-react';
import { Stack, Row, Text, Card } from '@scaffald/ui';
import Button from '../Common/Button';
import { useProjectDocuments, type ProjectDocument } from '../../hooks/useProjectDocuments';

interface ProjectDocumentsTabProps {
  projectId: string;
  organizationId?: string;
  currentUserId?: string;
}

interface UploadQueueItem {
  id: string;
  file: File;
  progress: number;
  status: 'queued' | 'uploading' | 'complete' | 'error';
  error?: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.png', '.jpg', '.jpeg'];

export function ProjectDocumentsTab({
  projectId,
  organizationId,
  currentUserId,
}: ProjectDocumentsTabProps) {
  const { documents, loading, error, uploadDocument, deleteDocument, fetchDocuments } =
    useProjectDocuments({ projectId });

  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
      case 'approved':
        return <CheckCircle size={16} color="var(--color-green10)" />;
      case 'pending':
        return <Clock size={16} color="var(--color-yellow10)" />;
      case 'rejected':
      case 'failed':
        return <AlertTriangle size={16} color="var(--color-red10)" />;
      default:
        return <Clock size={16} color="var(--color-10)" />;
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'verified':
      case 'approved':
        return { backgroundColor: 'var(--color-green2)', color: 'var(--color-green11)' };
      case 'pending':
        return { backgroundColor: 'var(--color-yellow2)', color: 'var(--color-yellow11)' };
      case 'rejected':
      case 'failed':
        return { backgroundColor: 'var(--color-red2)', color: 'var(--color-red11)' };
      default:
        return { backgroundColor: 'var(--color-2)', color: 'var(--color-11)' };
    }
  };

  const getFileIcon = (fileType: string | null) => {
    if (!fileType) return <File size={20} color="var(--color-10)" />;
    if (fileType.includes('pdf')) return <FileText size={20} color="var(--color-red10)" />;
    if (fileType.includes('image')) return <FileText size={20} color="var(--color-blue10)" />;
    if (fileType.includes('word') || fileType.includes('document'))
      return <FileText size={20} color="var(--color-blue10)" />;
    if (fileType.includes('sheet') || fileType.includes('excel'))
      return <FileText size={20} color="var(--color-green10)" />;
    return <File size={20} color="var(--color-10)" />;
  };

  const validateFile = useCallback((file: File): { valid: boolean; error?: string } => {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return { valid: false, error: 'File size exceeds 10MB limit' };
    }

    // Check file extension
    const ext = `.${file.name.split('.').pop()?.toLowerCase()}`;
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return {
        valid: false,
        error: `File type not supported. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`,
      };
    }

    return { valid: true };
  }, []);

  const processUpload = useCallback(
    async (item: UploadQueueItem) => {
      if (!organizationId || !currentUserId) {
        setUploadQueue((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? { ...i, status: 'error' as const, error: 'Missing organization or user ID' }
              : i
          )
        );
        return;
      }

      try {
        // Update status to uploading
        setUploadQueue((prev) =>
          prev.map((i) =>
            i.id === item.id ? { ...i, status: 'uploading' as const, progress: 10 } : i
          )
        );

        // Simulate progress
        const progressInterval = setInterval(() => {
          setUploadQueue((prev) =>
            prev.map((i) =>
              i.id === item.id && i.progress < 90 ? { ...i, progress: i.progress + 10 } : i
            )
          );
        }, 200);

        await uploadDocument(item.file, organizationId, currentUserId);

        clearInterval(progressInterval);

        // Mark as complete
        setUploadQueue((prev) =>
          prev.map((i) =>
            i.id === item.id ? { ...i, status: 'complete' as const, progress: 100 } : i
          )
        );

        // Remove from queue after 2 seconds
        setTimeout(() => {
          setUploadQueue((prev) => prev.filter((i) => i.id !== item.id));
        }, 2000);
      } catch (err) {
        setUploadQueue((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? {
                  ...i,
                  status: 'error' as const,
                  error: err instanceof Error ? err.message : 'Upload failed',
                }
              : i
          )
        );
      }
    },
    [organizationId, currentUserId, uploadDocument]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      const newItems: UploadQueueItem[] = [];

      Array.from(files).forEach((file) => {
        const validation = validateFile(file);
        if (!validation.valid) {
          newItems.push({
            id: `upload-${Date.now()}-${Math.random()}`,
            file,
            progress: 0,
            status: 'error',
            error: validation.error,
          });
        } else {
          newItems.push({
            id: `upload-${Date.now()}-${Math.random()}`,
            file,
            progress: 0,
            status: 'queued',
          });
        }
      });

      setUploadQueue((prev) => [...prev, ...newItems]);

      // Start uploading valid files
      newItems
        .filter((item) => item.status === 'queued')
        .forEach((item) => {
          processUpload(item);
        });

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [validateFile, processUpload]
  );

  const handleDelete = async (documentId: string) => {
    setDeleting(true);
    try {
      await deleteDocument(documentId);
      setDeleteConfirmId(null);
    } catch (err) {
      console.error('[ProjectDocumentsTab] Error deleting document:', err);
    } finally {
      setDeleting(false);
    }
  };

  const handleDownload = (doc: ProjectDocument) => {
    window.open(doc.file_url, '_blank');
  };

  const removeFromQueue = (itemId: string) => {
    setUploadQueue((prev) => prev.filter((i) => i.id !== itemId));
  };

  const canUpload = Boolean(organizationId && currentUserId);

  if (loading) {
    return (
      <Stack style={{ alignItems: 'center', paddingTop: 48, paddingBottom: 48 }}>
        <Loader2 size={32} color="var(--color-10)" style={{ animation: 'spin 1s linear infinite' }} />
        <Text style={{ color: 'var(--color-10)', marginTop: 8 }}>Loading documents...</Text>
      </Stack>
    );
  }

  if (error) {
    return (
      <Stack style={{ alignItems: 'center', paddingTop: 48, paddingBottom: 48 }}>
        <AlertTriangle size={32} color="var(--color-red10)" style={{ marginBottom: 8 }} />
        <Text style={{ color: 'var(--color-red11)' }}>{error}</Text>
        <Button color="gray" size="sm" onPress={fetchDocuments} style={{ marginTop: 16 }}>
          Retry
        </Button>
      </Stack>
    );
  }

  return (
    <Stack style={{ gap: 16 }}>
      {/* Header with Upload Button */}
      <Row style={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-12)' }}>
          Project Documents ({documents.length})
        </Text>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ALLOWED_EXTENSIONS.join(',')}
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          <Button
            color="primary"
            size="sm"
            iconStart={Upload}
            onPress={() => fileInputRef.current?.click()}
            disabled={!canUpload}
          >
            Upload Document
          </Button>
        </div>
      </Row>

      {/* Upload Queue */}
      {uploadQueue.length > 0 && (
        <Stack style={{ gap: 8 }}>
          {uploadQueue.map((item) => (
            <Card
              key={item.id}
              style={{
                padding: 12,
                backgroundColor:
                  item.status === 'error'
                    ? 'var(--color-red2)'
                    : item.status === 'complete'
                      ? 'var(--color-green2)'
                      : 'var(--color-2)',
              }}
            >
              <Row style={{ alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <Stack style={{ flex: 1, minWidth: 0 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: 500,
                      color: 'var(--color-12)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.file.name}
                  </Text>
                  <Text style={{ fontSize: 12, color: 'var(--color-10)' }}>
                    {formatFileSize(item.file.size)}
                  </Text>
                </Stack>

                {item.status === 'queued' && (
                  <button
                    type="button"
                    onClick={() => removeFromQueue(item.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 4,
                    }}
                  >
                    <X size={16} color="var(--color-10)" />
                  </button>
                )}

                {item.status === 'complete' && <CheckCircle size={16} color="var(--color-green10)" />}

                {item.status === 'error' && <AlertTriangle size={16} color="var(--color-red10)" />}
              </Row>

              {(item.status === 'uploading' || item.status === 'queued') && (
                <div
                  style={{
                    width: '100%',
                    height: 6,
                    backgroundColor: 'var(--color-4)',
                    borderRadius: 3,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${item.progress}%`,
                      backgroundColor: 'var(--color-blue9)',
                      transition: 'width 0.2s ease',
                    }}
                  />
                </div>
              )}

              {item.status === 'error' && item.error && (
                <Text style={{ fontSize: 12, color: 'var(--color-red11)', marginTop: 4 }}>
                  {item.error}
                </Text>
              )}
            </Card>
          ))}
        </Stack>
      )}

      {/* Documents List */}
      {documents.length > 0 ? (
        <Stack style={{ gap: 8 }}>
          {documents.map((doc) => (
            <Card
              key={doc.id}
              style={{
                padding: 16,
                backgroundColor: 'var(--color-backgroundHover)',
              }}
            >
              <Row style={{ alignItems: 'center', gap: 12 }}>
                {/* File Icon */}
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 8,
                    backgroundColor: 'var(--color-3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {getFileIcon(doc.file_type)}
                </div>

                {/* File Info */}
                <Stack style={{ flex: 1, minWidth: 0 }}>
                  <Row style={{ alignItems: 'center', gap: 8 }}>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: 500,
                        color: 'var(--color-12)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {doc.file_name}
                    </Text>
                    <Row
                      style={{
                        alignItems: 'center',
                        gap: 4,
                        paddingLeft: 8,
                        paddingRight: 8,
                        paddingTop: 2,
                        paddingBottom: 2,
                        borderRadius: 4,
                        ...getStatusStyle(doc.status),
                      }}
                    >
                      {getStatusIcon(doc.status)}
                      <Text style={{ fontSize: 12, fontWeight: 500 }}>{doc.status}</Text>
                    </Row>
                  </Row>
                  <Row style={{ gap: 16, marginTop: 4 }}>
                    <Text style={{ fontSize: 12, color: 'var(--color-10)' }}>
                      {formatFileSize(doc.file_size)}
                    </Text>
                    <Text style={{ fontSize: 12, color: 'var(--color-10)' }}>
                      Uploaded {formatDate(doc.upload_date)}
                    </Text>
                  </Row>
                </Stack>

                {/* Actions */}
                <Row style={{ gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => handleDownload(doc)}
                    title="Download"
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 8,
                      borderRadius: 4,
                    }}
                  >
                    <Download size={18} color="var(--color-10)" />
                  </button>

                  {deleteConfirmId === doc.id ? (
                    <Row style={{ gap: 4 }}>
                      <Button
                        color="error"
                        size="sm"
                        onPress={() => handleDelete(doc.id)}
                        disabled={deleting}
                      >
                        {deleting ? 'Deleting...' : 'Confirm'}
                      </Button>
                      <Button
                        color="gray"
                        size="sm"
                        onPress={() => setDeleteConfirmId(null)}
                        disabled={deleting}
                      >
                        Cancel
                      </Button>
                    </Row>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmId(doc.id)}
                      title="Delete"
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 8,
                        borderRadius: 4,
                      }}
                    >
                      <Trash2 size={18} color="var(--color-red10)" />
                    </button>
                  )}
                </Row>
              </Row>

              {doc.error_message && (
                <Row
                  style={{
                    marginTop: 8,
                    padding: 8,
                    backgroundColor: 'var(--color-red2)',
                    borderRadius: 4,
                    gap: 8,
                    alignItems: 'center',
                  }}
                >
                  <AlertTriangle size={14} color="var(--color-red10)" />
                  <Text style={{ fontSize: 12, color: 'var(--color-red11)' }}>
                    {doc.error_message}
                  </Text>
                </Row>
              )}
            </Card>
          ))}
        </Stack>
      ) : (
        <Stack
          style={{
            alignItems: 'center',
            paddingTop: 48,
            paddingBottom: 48,
            color: 'var(--color-10)',
          }}
        >
          <FileText size={48} color="var(--color-10)" style={{ marginBottom: 8 }} />
          <Text style={{ fontWeight: 500 }}>No documents yet</Text>
          <Text style={{ fontSize: 12, marginTop: 4, textAlign: 'center' }}>
            Upload project documents such as COIs, contracts, endorsements, and other compliance files.
          </Text>
          {canUpload && (
            <Button
              color="primary"
              size="sm"
              iconStart={Plus}
              onPress={() => fileInputRef.current?.click()}
              style={{ marginTop: 16 }}
            >
              Upload First Document
            </Button>
          )}
        </Stack>
      )}
    </Stack>
  );
}

export default ProjectDocumentsTab;
