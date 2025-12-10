/**
 * FileUpload - File upload component using Tamagui
 * REQ-166: Task Management Workflow & UI
 */
import React, { useState, useRef } from 'react';
import { YStack, XStack, Text, styled } from '@unicornlove/ui';
import { Upload, CloudUpload } from 'lucide-react';

interface FileUploadProps {
  taskId: string;
  onUpload: (file: File) => Promise<void>;
  maxSizeMB?: number;
  acceptedTypes?: string[];
  className?: string;
}

const UploadZone = styled(YStack, {
  name: 'UploadZone',
  borderWidth: 2,
  borderStyle: 'dashed',
  borderRadius: '$md',
  padding: '$8',
  textAlign: 'center',
  cursor: 'pointer',
  borderColor: '$borderColor',
  hoverStyle: {
    borderColor: '$borderColorHover',
  },
  
  variants: {
    dragging: {
      true: {
        borderColor: '$blue9',
        backgroundColor: '$blue2',
      },
    },
    uploading: {
      true: {
        pointerEvents: 'none',
        opacity: 0.5,
      },
    },
  } as const,
});

const ProgressBar = styled(YStack, {
  name: 'ProgressBar',
  width: '100%',
  backgroundColor: '$color4',
  borderRadius: '$10',
  height: 8,
  overflow: 'hidden',
});

const ProgressFill = styled(YStack, {
  name: 'ProgressFill',
  height: 8,
  backgroundColor: '$blue9',
  borderRadius: '$10',
  transition: 'width 300ms',
});

export const FileUpload: React.FC<FileUploadProps> = ({
  taskId,
  onUpload,
  maxSizeMB = 10,
  acceptedTypes = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.jpg', '.jpeg', '.png', '.gif'],
  className = '',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return `File size exceeds ${maxSizeMB}MB limit`;
    }

    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!acceptedTypes.includes(extension)) {
      return `File type not supported. Accepted types: ${acceptedTypes.join(', ')}`;
    }

    return null;
  };

  const handleFile = async (file: File) => {
    setError(null);

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setUploading(true);
      setProgress(0);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 100);

      await onUpload(file);

      clearInterval(progressInterval);
      setProgress(100);

      setTimeout(() => {
        setUploading(false);
        setProgress(0);
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setUploading(false);
      setProgress(0);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  return (
    <YStack gap="$2">
      <UploadZone
        dragging={isDragging}
        uploading={uploading}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onPress={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          accept={acceptedTypes.join(',')}
          style={{ display: 'none' }}
        />

        {uploading ? (
          <YStack gap="$4" alignItems="center">
            <CloudUpload size={48} className="animate-pulse" color="currentColor" />
            <YStack gap="$2" width="100%">
              <Text fontSize="$2" fontWeight="500" color="$color11">
                Uploading...
              </Text>
              <ProgressBar>
                <ProgressFill width={`${progress}%`} />
              </ProgressBar>
              <Text fontSize="$1" color="$color9" marginTop="$1">
                {progress}%
              </Text>
            </YStack>
          </YStack>
        ) : (
          <YStack gap="$2" alignItems="center">
            <Upload size={48} color="currentColor" />
            <Text fontSize="$2" fontWeight="500" color="$color11" marginTop="$2">
              Drag and drop your file here, or click to browse
            </Text>
            <Text fontSize="$1" color="$color9" marginTop="$1">
              Max file size: {maxSizeMB}MB. Accepted types: {acceptedTypes.join(', ')}
            </Text>
          </YStack>
        )}
      </UploadZone>

      {error && (
        <YStack
          marginTop="$2"
          padding="$3"
          backgroundColor="$red2"
          borderWidth={1}
          borderColor="$red6"
          borderRadius="$md"
        >
          <Text fontSize="$2" color="$red11">
            {error}
          </Text>
        </YStack>
      )}
    </YStack>
  );
};
