/**
 * DocumentPreview Component (REQ-167)
 * Side-by-side document viewer for OCR review
 */

import React from 'react';
import { FileText } from 'lucide-react';

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
    <div className="h-full flex flex-col bg-gray-50 rounded-lg border border-gray-300">
      <div className="p-4 border-b border-gray-300 bg-white rounded-t-lg">
        <div className="flex items-center">
          <FileText className="h-5 w-5 text-gray-500 mr-2" />
          <h3 className="text-sm font-medium text-gray-900 truncate">{fileName}</h3>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {documentUrl ? (
          <>
            {isPDF && (
              <iframe
                src={documentUrl}
                title={fileName}
                className="w-full h-full min-h-[600px] rounded border border-gray-200"
                aria-label={`Preview of ${fileName}`}
              />
            )}
            {isImage && (
              <img
                src={documentUrl}
                alt={fileName}
                className="w-full h-auto rounded border border-gray-200"
              />
            )}
            {!isPDF && !isImage && (
              <div className="flex items-center justify-center h-full text-gray-500">
                <p>Preview not available for this file type</p>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p>Document preview not available</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
