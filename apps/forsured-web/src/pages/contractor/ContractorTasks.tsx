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
          icon={CheckCircle}
          title="No Pending Tasks"
          description="You're all caught up! Check back later for new assignments."
          action={{ label: 'Refresh Tasks', onClick: handleRefreshTasks }}
        />
      ) : (
        // Render tasks list here
        <YStack>Contractor Tasks List</YStack>
      )}
    </YStack>
  );
}

export default ContractorTasks;
