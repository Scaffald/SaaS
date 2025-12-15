/**
 * REQ-124: Document Upload & Storage - FileUploadZone Component
 * Drag-and-drop file upload zone with validation and progress tracking
 */

import React, { useState, useRef, useCallback } from 'react';
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
    <div className="w-full">
      <div
        data-testid="drop-zone"
        className={`
          border-2 border-dashed rounded-lg p-8 text-center
          transition-colors duration-200 cursor-pointer
          ${isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
          }
        `}
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
          className="hidden"
          aria-label="Browse files"
        />

        <div className="space-y-2">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
            aria-hidden="true"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          <div className="text-sm text-gray-600">
            <span className="font-medium text-blue-600 hover:text-blue-500">
              Browse files
            </span>
            {' '}or drag and drop PDF files here
          </div>

          <p className="text-xs text-gray-500">
            PDF files only, up to 10MB each
          </p>
        </div>
      </div>

      {fileQueue.length > 0 && (
        <div className="mt-4 space-y-2">
          {fileQueue.map(item => (
            <div
              key={item.id}
              className="bg-white border rounded-lg p-4 shadow-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {item.file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(item.file.size / 1024).toFixed(1)} KB
                  </p>
                </div>

                {item.status === 'queued' && (
                  <button
                    onClick={() => removeFile(item.id)}
                    className="ml-4 text-gray-400 hover:text-gray-500"
                    aria-label={`Remove ${item.file.name}`}
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                )}

                {item.status === 'complete' && (
                  <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}

                {item.status === 'error' && (
                  <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>

              {(item.status === 'uploading' || item.status === 'queued') && (
                <div className="w-full bg-gray-200 rounded-full h-2" role="progressbar">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              )}

              {item.status === 'error' && item.error && (
                <p className="text-xs text-red-600 mt-1">{item.error}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
