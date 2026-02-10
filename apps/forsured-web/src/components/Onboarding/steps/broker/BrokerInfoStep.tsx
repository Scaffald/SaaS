// src/components/onboarding/steps/broker/BrokerInfoStep.tsx
// Broker Onboarding - Broker Information Step
import { useState } from 'react';
import { Stack, Text, H2, Input, Button } from '@unicornlove/beyond-ui';

interface BrokerInfoStepProps {
  onComplete: (data: any) => Promise<void>;
  initialData?: any;
  isLoading?: boolean;
}

function BrokerInfoStep({ onComplete, initialData = {}, isLoading = false }: BrokerInfoStepProps) {
  const brokerInfo = initialData.brokerInfo || {};
  const [name, setName] = useState(brokerInfo.name || '');
  const [licenseNumber, setLicenseNumber] = useState(brokerInfo.licenseNumber || '');
  const [statesLicensed, setStatesLicensed] = useState(brokerInfo.statesLicensed || '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Name is required';
    if (!licenseNumber.trim()) newErrors.licenseNumber = 'License number is required';
    if (!statesLicensed.trim()) newErrors.statesLicensed = 'States licensed is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    await onComplete({
      brokerInfo: {
        name,
        licenseNumber,
        statesLicensed: statesLicensed.split(',').map(s => s.trim()).filter(Boolean),
      },
    });
  };

  return (
    <Stack>
      <H2 style={{ marginBottom: 8 }}>Your Information</H2>
      <Text style={{ marginBottom: 24, color: 'var(--color-text-secondary)' }}>
        Tell us about your insurance broker credentials
      </Text>
      <form onSubmit={handleSubmit}>
        <Stack style={{ gap: 16 }}>
          <Stack style={{ gap: 8 }}>
            <Text style={{ fontWeight: 600, color: 'var(--color-text)' }}>Your Name</Text>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
            />
            {errors.name && <Text style={{ color: 'var(--color-red-10)', fontSize: 12 }}>{errors.name}</Text>}
          </Stack>
          <Stack style={{ gap: 8 }}>
            <Text style={{ fontWeight: 600, color: 'var(--color-text)' }}>License Number</Text>
            <Input
              value={licenseNumber}
              onChange={(e) => setLicenseNumber(e.target.value)}
              placeholder="Enter your insurance license number"
            />
            {errors.licenseNumber && <Text style={{ color: 'var(--color-red-10)', fontSize: 12 }}>{errors.licenseNumber}</Text>}
          </Stack>
          <Stack style={{ gap: 8 }}>
            <Text style={{ fontWeight: 600, color: 'var(--color-text)' }}>States Licensed</Text>
            <Input
              value={statesLicensed}
              onChange={(e) => setStatesLicensed(e.target.value)}
              placeholder="e.g., TX, CA, NY (comma-separated)"
            />
            <Text style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Enter states where you're licensed, separated by commas</Text>
            {errors.statesLicensed && <Text style={{ color: 'var(--color-red-10)', fontSize: 12 }}>{errors.statesLicensed}</Text>}
          </Stack>
          <Stack style={{ marginTop: 24 }}>
            <Button
              onPress={handleSubmit}
              variant="primary"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Continue'}
            </Button>
          </Stack>
        </Stack>
      </form>
    </Stack>
  );
}

export default BrokerInfoStep;
