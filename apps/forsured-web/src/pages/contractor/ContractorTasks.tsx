// src/pages/contractor/ContractorTasks.tsx
import { CheckCircle } from 'lucide-react';
import { YStack, H1, EmptyState } from '@unicornlove/ui';

function ContractorTasks() {
  const handleRefreshTasks = () => {
    console.log('Refreshing tasks');
  };

  // Simulate no pending tasks available
  const hasPendingTasks = false;

  return (
    <YStack gap="$6">
      <H1>My Tasks</H1>
      {!hasPendingTasks ? (
        <EmptyState
          icon={<CheckCircle size={48} />}
          title="No Pending Tasks"
          description="You're all caught up! Check back later for new assignments."
          primaryAction={{ label: 'Refresh Tasks', onClick: handleRefreshTasks }}
          helpLinks={[
            { label: 'How Tasks Work', href: '#' },
          ]}
        />
      ) : (
        // Render tasks list here
        <YStack>Contractor Tasks List</YStack>
      )}
    </YStack>
  );
}

export default ContractorTasks;
