/**
 * Document Upload & Storage - FileUploadZone Component
 * Drag-and-drop file upload zone with validation and progress tracking
 */

import { useState, useRef, useCallback, useMemo } from 'react';
import { Upload, X, CheckCircle, XCircle } from 'lucide-react';
import { Stack, Row, Text, Card } from '@unicornlove/beyond-ui';
import { DocumentService } from '../../lib/documents/documentService';
import type { Document } from '../../types/document';

interface FileUploadZoneProps {
  projectId: string;
  uploaderId: string;
  organizationId: string;
  subcontractorId?: string;
  maxFiles?: number;
  category?: 'compliance' | 'insurance' | 'contract' | 'general';
  description?: string;
  tags?: string[];
  onUpload?: (document: Document) => void;
  onError?: (error: string) => void;
}

interface FileQueueItem {
  file: File;
  id: string;
  progress: number;
  status: 'queued' | 'uploading' | 'complete' | 'error';
  error?: string;
}

export const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  projectId,
  uploaderId,
  organizationId,
  subcontractorId,
  maxFiles = 10,
  category = 'compliance',
  description,
  tags = [],
  onUpload,
  onError
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [fileQueue, setFileQueue] = useState<FileQueueItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use useRef to maintain a stable DocumentService instance
  const documentServiceRef = useRef<DocumentService | null>(null);
  if (!documentServiceRef.current) {
    documentServiceRef.current = new DocumentService();
  }
  const documentService = documentServiceRef.current;

  const generateFileId = () => `file-${Date.now()}-${Math.random()}`;

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const validateAndQueueFiles = useCallback((files: FileList | File[]) => {
    const filesArray = Array.from(files);

    // Check max files limit
    if (filesArray.length > maxFiles) {
      onError?.(`You can only upload a maximum of ${maxFiles} files at a time.`);
      return;
    }

    const newQueueItems: FileQueueItem[] = [];

    filesArray.forEach(file => {
      const validation = documentService.validateFile(file);

      if (!validation.valid) {
        onError?.(validation.errors.join(', '));
        return;
      }

      newQueueItems.push({
        file,
        id: generateFileId(),
        progress: 0,
        status: 'queued'
      });
    });

    setFileQueue(prev => [...prev, ...newQueueItems]);

    // Start uploading the files
    newQueueItems.forEach(item => {
      uploadFile(item);
    });
  }, [maxFiles, onError, documentService]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      validateAndQueueFiles(files);
    }
  }, [validateAndQueueFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      validateAndQueueFiles(files);
    }

    // Reset input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [validateAndQueueFiles]);

  const uploadFile = async (queueItem: FileQueueItem) => {
    try {
      // Update status to uploading
      setFileQueue(prev =>
        prev.map(item =>
          item.id === queueItem.id
            ? { ...item, status: 'uploading' as const, progress: 10 }
            : item
        )
      );

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setFileQueue(prev =>
          prev.map(item =>
            item.id === queueItem.id && item.progress < 90
              ? { ...item, progress: item.progress + 10 }
              : item
          )
        );
      }, 200);

      // Upload the document with proper categorization
      console.log('[FileUploadZone] Uploading document with category:', category);
      const document = await documentService.uploadDocument({
        projectId,
        uploadedBy: uploaderId,
        organizationId,
        file: queueItem.file,
        category,
        description,
        tags: [...tags, 'forsured', category],
      });

      clearInterval(progressInterval);

      // Update status to complete
      setFileQueue(prev =>
        prev.map(item =>
          item.id === queueItem.id
            ? { ...item, status: 'complete' as const, progress: 100 }
            : item
        )
      );

      onUpload?.(document);

      // Remove from queue after 2 seconds
      setTimeout(() => {
        setFileQueue(prev => prev.filter(item => item.id !== queueItem.id));
      }, 2000);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';

      setFileQueue(prev =>
        prev.map(item =>
          item.id === queueItem.id
            ? { ...item, status: 'error' as const, error: errorMessage }
            : item
        )
      );

      onError?.(errorMessage);
    }
  };

  const removeFile = useCallback((fileId: string) => {
    setFileQueue(prev => prev.filter(item => item.id !== fileId));
  }, []);

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Stack style={{ width: '100%' }}>
      <Card
        data-testid="drop-zone"
        style={{
          borderWidth: 2,
          borderStyle: 'dashed',
          borderRadius: '8px',
          padding: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          borderColor: isDragging ? 'var(--color-teal-9)' : 'var(--color-gray-6)',
          backgroundColor: isDragging ? 'var(--color-teal-2)' : 'transparent',
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleBrowseClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          multiple
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          aria-label="Browse files"
        />

        <Stack style={{ alignItems: 'center', gap: '8px' }}>
          <Upload size={48} color="var(--color-gray-10)" />
          <Row style={{ fontSize: '14px', color: 'var(--color-gray-11)', gap: '4px' }}>
            <Text style={{ fontWeight: 500, color: 'var(--color-teal-9)' }}>
              Browse files
            </Text>
            <Text>or drag and drop PDF files here</Text>
          </Row>
          <Text style={{ fontSize: '11px', color: 'var(--color-gray-10)' }}>
            PDF files only, up to 10MB each
          </Text>
        </Stack>
      </Card>

      {fileQueue.length > 0 && (
        <Stack style={{ marginTop: '16px', gap: '8px' }}>
          {fileQueue.map((item) => (
            <Card
              key={item.id}
              style={{
                backgroundColor: 'var(--color-background)',
                borderWidth: 1,
                borderStyle: 'solid',
                borderColor: 'var(--color-border)',
                borderRadius: '8px',
                padding: '16px',
              }}
            >
              <Row style={{ alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <Stack style={{ flex: 1, minWidth: 0 }}>
                  <Text
                    style={{
                      fontSize: '14px',
                      fontWeight: 500,
                      color: 'var(--color-gray-12)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.file.name}
                  </Text>
                  <Text style={{ fontSize: '11px', color: 'var(--color-gray-10)' }}>
                    {(item.file.size / 1024).toFixed(1)} KB
                  </Text>
                </Stack>

                {item.status === 'queued' && (
                  <button
                    style={{
                      marginLeft: '16px',
                      color: 'var(--color-gray-9)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(item.id);
                    }}
                    aria-label={`Remove ${item.file.name}`}
                  >
                    <X size={20} />
                  </button>
                )}

                {item.status === 'complete' && (
                  <CheckCircle size={20} color="var(--color-green-10)" />
                )}

                {item.status === 'error' && (
                  <XCircle size={20} color="var(--color-red-10)" />
                )}
              </Row>

              {(item.status === 'uploading' || item.status === 'queued') && (
                <div
                  style={{
                    width: '100%',
                    backgroundColor: 'var(--color-gray-4)',
                    borderRadius: '9999px',
                    height: '8px',
                  }}
                  role="progressbar"
                >
                  <div
                    style={{
                      backgroundColor: 'var(--color-teal-9)',
                      height: '8px',
                      borderRadius: '9999px',
                      width: `${item.progress}%`,
                      transition: 'width 0.2s ease',
                    }}
                  />
                </div>
              )}

              {item.status === 'error' && item.error && (
                <Text style={{ fontSize: '11px', color: 'var(--color-red-10)', marginTop: '4px' }}>
                  {item.error}
                </Text>
              )}
            </Card>
          ))}
        </Stack>
      )}
    </Stack>
  );
};
