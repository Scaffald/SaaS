// src/components/onboarding/steps/gc/SuccessStep.tsx
// REQ-126: GC Onboarding - Success/Completion Step
import { CheckCircle } from 'lucide-react';
import { YStack, XStack } from '@unicornlove/ui';
import { Button, Heading2, BodyText } from '@unicornlove/ui';

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
        <Heading2 marginBottom="$2" textAlign="center">
          Onboarding Complete!
        </Heading2>
        <BodyText color="$color10" textAlign="center">
          You're all set to manage subcontractor compliance and track insurance requirements.
        </BodyText>
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
