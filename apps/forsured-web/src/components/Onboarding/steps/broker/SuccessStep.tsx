// src/components/onboarding/steps/broker/SuccessStep.tsx
// REQ-126: Broker Onboarding - Success/Completion Step
import { CheckCircle } from 'lucide-react';
import { YStack, Text, H2, Button } from '@unicornlove/ui';

interface SuccessStepProps {
  onComplete: () => Promise<void>;
  isLoading?: boolean;
}

function SuccessStep({ onComplete, isLoading = false }: SuccessStepProps) {
  return (
    <YStack alignItems="center" paddingVertical="$8">
      <YStack mb="$6" alignItems="center">
        <YStack
          alignItems="center"
          justifyContent="center"
          width={64}
          height={64}
          borderRadius={9999}
          backgroundColor="$green2"
          mb="$4"
        >
          <CheckCircle size={32} color="var(--green10)" />
        </YStack>
        <H2 mb="$2">Onboarding Complete!</H2>
        <Text color="$color10">
          You're all set to manage your clients' insurance needs and track compliance.
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
