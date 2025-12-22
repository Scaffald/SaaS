/**
 * REQ-124: Document Upload & Storage - FileUploadZone Component
 * Drag-and-drop file upload zone with validation and progress tracking
 */

import { useState, useRef, useCallback } from 'react';
import { Upload, X, CheckCircle, XCircle } from 'lucide-react';
import { YStack, XStack, Text, Card } from '@unicornlove/ui';
import { DocumentService } from '../../lib/documents/documentService';
import type { Document } from '../../types/document';

interface FileUploadZoneProps {
  projectId: string;
  uploaderId: string;
  organizationId: string;
  subcontractorId?: string;
  maxFiles?: number;
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
  onUpload,
  onError
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [fileQueue, setFileQueue] = useState<FileQueueItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const documentService = new DocumentService();

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxFiles, onError]);

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

      // Upload the document
      const document = await documentService.uploadDocument({
        projectId,
        uploadedBy: uploaderId,
        organizationId,
        file: queueItem.file
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
    <YStack width="100%">
      <Card
        data-testid="drop-zone"
        borderWidth={2}
        borderStyle="dashed"
        borderRadius="$4"
        padding="$8"
        alignItems="center"
        cursor="pointer"
        borderColor={isDragging ? '$teal9' : '$gray6'}
        backgroundColor={isDragging ? '$teal2' : 'transparent'}
        hoverStyle={{
          borderColor: isDragging ? '$teal9' : '$gray7',
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

        <YStack alignItems="center" gap="$2">
          <Upload size={48} color="$color10" />
          <XStack fontSize="$3" color="$color11" gap="$1">
            <Text fontWeight="500" color="$teal9" hoverStyle={{ color: '$teal10' }}>
              Browse files
            </Text>
            <Text>or drag and drop PDF files here</Text>
          </XStack>
          <Text fontSize="$1" color="$color10">
            PDF files only, up to 10MB each
          </Text>
        </YStack>
      </Card>

      {fileQueue.length > 0 && (
        <YStack mt="$4" gap="$2">
          {fileQueue.map((item) => (
            <Card
              key={item.id}
              backgroundColor="$background"
              borderWidth={1}
              borderColor="$borderColor"
              borderRadius="$4"
              padding="$4"
              elevation={1}
            >
              <XStack alignItems="center" justifyContent="space-between" mb="$2">
                <YStack flex={1} minWidth={0}>
                  <Text fontSize="$3" fontWeight="500" color="$color12" numberOfLines={1}>
                    {item.file.name}
                  </Text>
                  <Text fontSize="$1" color="$color10">
                    {(item.file.size / 1024).toFixed(1)} KB
                  </Text>
                </YStack>

                {item.status === 'queued' && (
                  <XStack
                    as="button"
                    ml="$4"
                    color="$color9"
                    hoverStyle={{ color: '$color10' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(item.id);
                    }}
                    aria-label={`Remove ${item.file.name}`}
                    cursor="pointer"
                  >
                    <X size={20} />
                  </XStack>
                )}

                {item.status === 'complete' && (
                  <CheckCircle size={20} color="$green10" />
                )}

                {item.status === 'error' && (
                  <XCircle size={20} color="$red10" />
                )}
              </XStack>

              {(item.status === 'uploading' || item.status === 'queued') && (
                <YStack
                  width="100%"
                  backgroundColor="$gray4"
                  borderRadius={9999}
                  height={8}
                  role="progressbar"
                >
                  <YStack
                    backgroundColor="$teal9"
                    height={8}
                    borderRadius={9999}
                    width={`${item.progress}%`}
                  />
                </YStack>
              )}

              {item.status === 'error' && item.error && (
                <Text fontSize="$1" color="$red10" mt="$1">
                  {item.error}
                </Text>
              )}
            </Card>
          ))}
        </YStack>
      )}
    </YStack>
  );
};
