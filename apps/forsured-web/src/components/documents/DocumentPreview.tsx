/**
 * DocumentPreview Component (REQ-167)
 * Side-by-side document viewer for OCR review
 */

import { FileText } from 'lucide-react';
import { YStack, XStack, Text, H3, Card } from '@unicornlove/ui';

interface DocumentPreviewProps {
  documentUrl?: string;
  fileName: string;
  fileType: string;
}

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  documentUrl,
  fileName,
  fileType,
}) => {
  const isPDF = fileType === 'application/pdf' || fileName.endsWith('.pdf');
  const isImage = fileType.startsWith('image/');

  return (
    <YStack
      height="100%"
      flexDirection="column"
      backgroundColor="$gray2"
      borderRadius="$4"
      borderWidth={1}
      borderColor="$gray6"
    >
      <YStack
        padding="$4"
        borderBottomWidth={1}
        borderBottomColor="$gray6"
        backgroundColor="$background"
        borderTopLeftRadius="$4"
        borderTopRightRadius="$4"
      >
        <XStack alignItems="center">
          <FileText size={20} color="$color10" marginRight="$2" />
          <H3 fontSize="$3" fontWeight="500" color="$color12" numberOfLines={1}>
            {fileName}
          </H3>
        </XStack>
      </YStack>

      <YStack flex={1} overflow="auto" padding="$4">
        {documentUrl ? (
          <>
            {isPDF && (
              <iframe
                src={documentUrl}
                title={fileName}
                style={{
                  width: '100%',
                  height: '100%',
                  minHeight: '600px',
                  borderRadius: '8px',
                  border: '1px solid var(--color-gray-5)',
                }}
                aria-label={`Preview of ${fileName}`}
              />
            )}
            {isImage && (
              <img
                src={documentUrl}
                alt={fileName}
                style={{
                  width: '100%',
                  height: 'auto',
                  borderRadius: '8px',
                  border: '1px solid var(--color-gray-5)',
                }}
              />
            )}
            {!isPDF && !isImage && (
              <YStack alignItems="center" justifyContent="center" height="100%" color="$color10">
                <Text>Preview not available for this file type</Text>
              </YStack>
            )}
          </>
        ) : (
          <YStack alignItems="center" justifyContent="center" height="100%" color="$color10">
            <YStack alignItems="center" gap="$4">
              <FileText size={64} color="$color9" />
              <Text>Document preview not available</Text>
            </YStack>
          </YStack>
        )}
      </YStack>
    </YStack>
  );
};
