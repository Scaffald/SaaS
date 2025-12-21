// src/components/onboarding/steps/gc/ProjectStep.tsx
// REQ-126: GC Onboarding - First Project Step (Optional)
import { useState } from 'react';
import { YStack, Text, H2, Input, Button } from '@unicornlove/ui';

interface ProjectStepProps {
  onComplete: (data: any) => Promise<void>;
  initialData?: any;
  isLoading?: boolean;
}

function ProjectStep({ onComplete, initialData = {}, isLoading = false }: ProjectStepProps) {
  const firstProject = initialData.firstProject || {};
  const [projectName, setProjectName] = useState(firstProject.name || '');
  const [address, setAddress] = useState(firstProject.address || '');
  const [startDate, setStartDate] = useState(firstProject.startDate || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onComplete({
      firstProject: {
        name: projectName,
        address,
        startDate,
      },
    });
  };

  return (
    <YStack>
      <H2 marginBottom="$2">Create Your First Project (Optional)</H2>
      <Text marginBottom="$6" color="$color10">
        You can skip this step and create a project later
      </Text>
      <YStack tag="form" onSubmit={handleSubmit} gap="$4">
        <YStack gap="$2">
          <Text fontWeight="600" color="$color12">Project Name</Text>
          <Input
            value={projectName}
            onChangeText={setProjectName}
            placeholder="Enter project name"
          />
        </YStack>
        <YStack gap="$2">
          <Text fontWeight="600" color="$color12">Project Address</Text>
          <Input
            value={address}
            onChangeText={setAddress}
            placeholder="Enter project address"
          />
        </YStack>
        <YStack gap="$2">
          <Text fontWeight="600" color="$color12">Start Date</Text>
          <Input
            value={startDate}
            onChangeText={setStartDate}
            placeholder="YYYY-MM-DD"
          />
          <Text fontSize="$2" color="$color10">Optional: You can set this later</Text>
        </YStack>
        <YStack marginTop="$6">
          <Button
            onPress={handleSubmit}
            variant="primary"
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Continue'}
          </Button>
        </YStack>
      </YStack>
    </YStack>
  );
}

export default ProjectStep;
