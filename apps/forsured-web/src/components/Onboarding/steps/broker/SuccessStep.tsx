// src/components/onboarding/steps/broker/SuccessStep.tsx
// REQ-126: Broker Onboarding - Success/Completion Step
import { Button, Heading2, BodyText } from '@unicornlove/ui';
import { YStack, XStack } from 'tamagui';
import { Check } from '@tamagui/lucide-icons';

interface SuccessStepProps {
  onComplete: () => Promise<void>;
  isLoading?: boolean;
}

function SuccessStep({ onComplete, isLoading = false }: SuccessStepProps) {
  return (
    <YStack alignItems="center" paddingVertical="$8">
      <YStack marginBottom="$6" alignItems="center">
        <XStack
          alignItems="center"
          justifyContent="center"
          width={64}
          height={64}
          borderRadius={9999}
          backgroundColor="$green3"
          marginBottom="$4"
        >
          <Check size={32} color="$green10" />
        </XStack>
        <Heading2 marginBottom="$2">Onboarding Complete!</Heading2>
        <BodyText color="$color10">
          You're all set to manage your clients' insurance needs and track compliance.
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
