// src/pages/contractor/ContractorDocuments.tsx
import { FileText } from 'lucide-react';
import { YStack, H1, EmptyState } from '@unicornlove/ui';

function ContractorDocuments() {
  const handleUploadCOI = () => {
    console.log('Navigate to COI upload form');
  };

  // Simulate no documents uploaded
  const hasDocuments = false;

  return (
    <YStack gap="$6">
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
        <YStack>Contractor Documents List</YStack>
      )}
    </YStack>
  );
}

export default ContractorDocuments;
