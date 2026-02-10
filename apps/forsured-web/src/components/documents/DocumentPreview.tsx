/**
 * DocumentPreview Component
 * Side-by-side document viewer for OCR review
 */

import React from 'react';
import { FileText } from 'lucide-react';
import { Stack, Row, Text, H3 } from '@unicornlove/beyond-ui';

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
    <Stack
      style={{
        height: '100%',
        flexDirection: 'column',
        backgroundColor: 'var(--color-gray-2)',
        borderRadius: '8px',
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: 'var(--color-gray-6)',
      }}
    >
      <Stack
        style={{
          padding: '16px',
          borderBottomWidth: 1,
          borderBottomStyle: 'solid',
          borderBottomColor: 'var(--color-gray-6)',
          backgroundColor: 'var(--color-background)',
          borderTopLeftRadius: '8px',
          borderTopRightRadius: '8px',
        }}
      >
        <Row style={{ alignItems: 'center' }}>
          <FileText size={20} color="var(--color-gray-10)" style={{ marginRight: '8px' }} />
          <H3
            style={{
              fontSize: '14px',
              fontWeight: 500,
              color: 'var(--color-gray-12)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {fileName}
          </H3>
        </Row>
      </Stack>

      <Stack style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
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
              <Stack
                style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: 'var(--color-gray-10)',
                }}
              >
                <Text>Preview not available for this file type</Text>
              </Stack>
            )}
          </>
        ) : (
          <Stack
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: 'var(--color-gray-10)',
            }}
          >
            <Stack style={{ alignItems: 'center', gap: '16px' }}>
              <FileText size={64} color="var(--color-gray-9)" />
              <Text>Document preview not available</Text>
            </Stack>
          </Stack>
        )}
      </Stack>
    </Stack>
  );
};
