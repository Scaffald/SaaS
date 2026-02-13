// src/pages/contractor/ContractorDocuments.tsx
import { FileText } from 'lucide-react';
import { Stack, H1 } from '@scaffald/ui';
import { EmptyState } from '../../ui/EmptyState';

function ContractorDocuments() {
  const handleUploadCOI = () => {
    console.log('Navigate to COI upload form');
  };

  // Simulate no documents uploaded
  const hasDocuments = false;

  return (
    <Stack style={{ gap: 'var(--space-6)' }}>
      <H1>My Documents</H1>
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
        <Stack>Contractor Documents List</Stack>
      )}
    </Stack>
  );
}

export default ContractorDocuments;
