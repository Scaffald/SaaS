// src/components/onboarding/steps/gc/SuccessStep.tsx
// REQ-126: GC Onboarding - Success/Completion Step
import { CheckCircle } from 'lucide-react';
import { Stack, Text, H2, Button } from '@unicornlove/beyond-ui';

interface SuccessStepProps {
  onComplete: () => Promise<void>;
  isLoading?: boolean;
}

function SuccessStep({ onComplete, isLoading = false }: SuccessStepProps) {
  return (
    <Stack style={{ alignItems: 'center', paddingTop: 32, paddingBottom: 32 }}>
      <Stack style={{ alignItems: 'center', marginBottom: 24 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 64,
            height: 64,
            borderRadius: '50%',
            backgroundColor: 'var(--color-green-2)',
            marginBottom: 16,
          }}
        >
          <CheckCircle size={32} color="var(--color-green-10)" />
        </div>
        <H2 style={{ marginBottom: 8, textAlign: 'center' }}>
          Onboarding Complete!
        </H2>
        <Text style={{ color: 'var(--color-text-secondary)', textAlign: 'center' }}>
          You're all set to manage subcontractor compliance and track insurance requirements.
        </Text>
      </Stack>
      <Button
        onPress={onComplete}
        variant="primary"
        disabled={isLoading}
        size="lg"
      >
        {isLoading ? 'Loading...' : 'Go to Dashboard'}
      </Button>
    </Stack>
  );
}

export default SuccessStep;
