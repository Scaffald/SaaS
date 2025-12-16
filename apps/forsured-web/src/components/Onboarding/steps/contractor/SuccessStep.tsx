// src/components/onboarding/steps/contractor/SuccessStep.tsx
// REQ-126: Contractor Onboarding - Success/Completion Step
import { YStack, XStack, Circle } from 'tamagui';
import { Button } from '@unicornlove/ui';
import { Heading2, BodyText } from '@unicornlove/ui';
import { Check } from '@unicornlove/ui';

interface SuccessStepProps {
  onComplete: () => Promise<void>;
  isLoading?: boolean;
}

function SuccessStep({ onComplete, isLoading = false }: SuccessStepProps) {
  return (
    <YStack alignItems="center" paddingVertical="$8">
      <YStack alignItems="center" marginBottom="$6">
        <Circle
          size={64}
          backgroundColor="$green3"
          marginBottom="$4"
          alignItems="center"
          justifyContent="center"
        >
          <Check size={32} color="$green10" />
        </Circle>
        <Heading2 marginBottom="$2" textAlign="center">Onboarding Complete!</Heading2>
        <BodyText color="$color10" textAlign="center">
          You're all set to work with general contractors and manage your insurance compliance.
        </BodyText>
      </YStack>
      <Button
        onClick={onComplete}
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
