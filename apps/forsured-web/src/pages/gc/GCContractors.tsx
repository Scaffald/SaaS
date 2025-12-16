// src/pages/gc/GCContractors.tsx
import { Users } from 'lucide-react';
import { YStack, H1, EmptyState } from '@unicornlove/ui';
import { useLexicon } from '../../contexts/LexiconContext';

function GCContractors() {
  // REQ-4: Use lexicon for dynamic labels
  const { t, getContractorLabel } = useLexicon();

  const handleInviteContractor = () => {
    console.log('Navigate to invite contractor flow');
  };

  // Simulate no contractors available
  const hasContractors = false;

  return (
    <YStack gap="$6">
      <H1>{getContractorLabel(true)}</H1>
      {!hasContractors ? (
        <EmptyState
          icon={<Users size={48} />}
          title={`No ${getContractorLabel(true)} Yet`}
          description={`Invite ${getContractorLabel(true).toLowerCase()} to your projects to track their compliance.`}
          primaryAction={{ label: `Invite ${getContractorLabel()}`, onClick: handleInviteContractor }}
          helpLinks={[
            { label: 'How to Invite', href: '#' },
          ]}
        />
      ) : (
        // Render contractors list here
        <YStack>{getContractorLabel(true)} List</YStack>
      )}
    </YStack>
  );
}

export default GCContractors;
