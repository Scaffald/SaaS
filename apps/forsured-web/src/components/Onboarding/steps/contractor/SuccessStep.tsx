// src/components/onboarding/steps/contractor/SuccessStep.tsx
// REQ-126: Contractor Onboarding - Success/Completion Step
import { CheckCircle } from 'lucide-react';
import { YStack, Text, H2, Button } from '@unicornlove/ui';

interface SuccessStepProps {
  onComplete: () => Promise<void>;
  isLoading?: boolean;
}

function SuccessStep({ onComplete, isLoading = false }: SuccessStepProps) {
  return (
    <YStack alignItems="center" paddingVertical="$8">
      <YStack alignItems="center" marginBottom="$6">
        <YStack
          alignItems="center"
          justifyContent="center"
          width={64}
          height={64}
          borderRadius={9999}
          backgroundColor="$green2"
          marginBottom="$4"
        >
          <CheckCircle size={32} color="var(--green10)" />
        </YStack>
        <H2 marginBottom="$2" textAlign="center">Onboarding Complete!</H2>
        <Text color="$color10" textAlign="center">
          You're all set to work with general contractors and manage your insurance compliance.
        </Text>
      </YStack>
      <Button
        onPress={onComplete}
        variant="primary"
        disabled={isLoading}
        size="lg"
      >
        {isLoading ? 'Loading...' : 'Go to Dashboard'}
      </Button>
    </YStack>
  );
}

export default SuccessStep;
