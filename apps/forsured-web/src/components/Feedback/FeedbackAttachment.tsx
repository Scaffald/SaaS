/**
 * FeedbackAttachment - File attachment display with download link
 */

import React, { useState } from 'react';
import { Download, FileText, Image, File } from 'lucide-react';
import { Row, Text, Button } from '@scaffald/ui';
import { trpc } from '../../lib/trpc';

interface FeedbackAttachmentProps {
  fileName: string;
  filePath: string;
  fileSize?: number | null;
  mimeType?: string | null;
  compact?: boolean;
}

export function FeedbackAttachment({
  fileName,
  filePath,
  fileSize,
  mimeType,
  compact = false,
}: FeedbackAttachmentProps) {
  const [downloading, setDownloading] = useState(false);

  // Get download URL query
  const downloadUrlQuery = trpc.feedback.getDownloadUrl.useQuery(
    { filePath },
    { enabled: false } // Only fetch on demand
  );

  // Get appropriate icon based on mime type
  const getIcon = () => {
    if (mimeType?.startsWith('image/')) {
      return <Image size={compact ? 14 : 16} color="var(--color-blue-10)" />;
    }
    if (mimeType?.includes('pdf')) {
      return <FileText size={compact ? 14 : 16} color="var(--color-red-9)" />;
    }
    return <File size={compact ? 14 : 16} color="var(--color-gray-10)" />;
  };

  // Format file size
  const formatSize = (bytes?: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Handle download
  const handleDownload = async () => {
    setDownloading(true);
    try {
      const result = await downloadUrlQuery.refetch();
      if (result.data?.signedUrl) {
        // Open in new tab or download
        window.open(result.data.signedUrl, '_blank');
      }
    } catch (error) {
      console.error('Failed to download:', error);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Button
      onPress={handleDownload}
      variant="ghost"
      disabled={downloading}
      style={{
        padding: compact ? 4 : 8,
        borderRadius: 6,
        backgroundColor: 'var(--color-gray-2)',
        border: '1px solid var(--color-gray-4)',
        justifyContent: 'flex-start',
        opacity: downloading ? 0.6 : 1,
      }}
    >
      <Row style={{ alignItems: 'center', gap: compact ? 6 : 8 }}>
        {getIcon()}
        <Text
          style={{
            fontSize: compact ? 11 : 12,
            color: 'var(--color-gray-11)',
            maxWidth: 150,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {fileName}
        </Text>
        {fileSize && !compact && (
          <Text
            style={{
              fontSize: 10,
              color: 'var(--color-gray-9)',
            }}
          >
            ({formatSize(fileSize)})
          </Text>
        )}
        <Download size={compact ? 12 : 14} color="var(--color-gray-9)" />
      </Row>
    </Button>
  );
}

export default FeedbackAttachment;
