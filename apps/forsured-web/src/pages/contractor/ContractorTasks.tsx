// src/pages/contractor/ContractorTasks.tsx
import { CheckCircle } from 'lucide-react';
import { Stack, H1 } from '@scaffald/ui';
import { EmptyState } from '../../ui/EmptyState';

function ContractorTasks() {
  const handleRefreshTasks = () => {
    console.log('Refreshing tasks');
  };

  // Simulate no pending tasks available
  const hasPendingTasks = false;

  return (
    <Stack style={{ gap: 'var(--space-6)' }}>
      <H1>My Tasks</H1>
      {!hasPendingTasks ? (
        <EmptyState
          icon={CheckCircle}
          title="No Pending Tasks"
          description="You're all caught up! Check back later for new assignments."
          action={{ label: 'Refresh Tasks', onClick: handleRefreshTasks }}
        />
      ) : (
        // Render tasks list here
        <Stack>Contractor Tasks List</Stack>
      )}
    </Stack>
  );
}

export default ContractorTasks;
