// src/pages/contractor/ContractorDocuments.tsx
import React from 'react';
import { FileText } from 'lucide-react';
import EmptyState from '../../components/common/EmptyState';

function ContractorDocuments() {
  const handleUploadCOI = () => {
    console.log('Navigate to COI upload form');
  };

  // Simulate no documents uploaded
  const hasDocuments = false;

  return (
    <div className="contractor-documents-page">
      <h1 className="text-2xl font-bold mb-6">My Documents</h1>
      {!hasDocuments ? (
        <EmptyState
          icon={<FileText size={48} />}
          title="No Documents Uploaded"
          description="Upload your Certificates of Insurance (COIs) and other compliance documents."
          primaryAction={{ label: 'Upload COI', onClick: handleUploadCOI }}
          helpLinks={[
            { label: 'How to Upload Documents', href: '#' },
          ]}
        />
      ) : (
        // Render documents list here
        <div>Contractor Documents List</div>
      )}
    </div>
  );
}

export default ContractorDocuments;
