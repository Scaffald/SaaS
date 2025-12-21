// src/components/onboarding/steps/broker/BrokerInfoStep.tsx
// REQ-126: Broker Onboarding - Broker Information Step
import { useState } from 'react';
import { YStack, Text, H2, Input, Button } from '@unicornlove/ui';

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
    <YStack>
      <H2 marginBottom="$2">Your Information</H2>
      <Text marginBottom="$6" color="$color10">
        Tell us about your insurance broker credentials
      </Text>
      <YStack tag="form" onSubmit={handleSubmit} gap="$4">
        <YStack gap="$2">
          <Text fontWeight="600" color="$color12">Your Name</Text>
          <Input
            value={name}
            onChangeText={setName}
            placeholder="Enter your full name"
          />
          {errors.name && <Text color="$red10" fontSize="$2">{errors.name}</Text>}
        </YStack>
        <YStack gap="$2">
          <Text fontWeight="600" color="$color12">License Number</Text>
          <Input
            value={licenseNumber}
            onChangeText={setLicenseNumber}
            placeholder="Enter your insurance license number"
          />
          {errors.licenseNumber && <Text color="$red10" fontSize="$2">{errors.licenseNumber}</Text>}
        </YStack>
        <YStack gap="$2">
          <Text fontWeight="600" color="$color12">States Licensed</Text>
          <Input
            value={statesLicensed}
            onChangeText={setStatesLicensed}
            placeholder="e.g., TX, CA, NY (comma-separated)"
          />
          <Text fontSize="$2" color="$color10">Enter states where you're licensed, separated by commas</Text>
          {errors.statesLicensed && <Text color="$red10" fontSize="$2">{errors.statesLicensed}</Text>}
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

export default BrokerInfoStep;
