// src/components/onboarding/steps/gc/CompanyStep.tsx
// REQ-126: GC Onboarding - Company Information Step
import { useState } from 'react';
import { YStack, Text, H2, Input, Button } from '@unicornlove/ui';

interface CompanyStepProps {
  onComplete: (data: any) => Promise<void>;
  initialData?: any;
  isLoading?: boolean;
}

function CompanyStep({ onComplete, initialData = {}, isLoading = false }: CompanyStepProps) {
  const [companyName, setCompanyName] = useState(initialData.companyName || '');
  const [address, setAddress] = useState(initialData.address || '');
  const [phone, setPhone] = useState(initialData.phone || '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!companyName.trim()) newErrors.companyName = 'Company name is required';
    if (!address.trim()) newErrors.address = 'Address is required';
    if (!phone.trim()) newErrors.phone = 'Phone is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    await onComplete({
      company: {
        name: companyName,
        address,
        phone,
      },
    });
  };

  return (
    <YStack>
      <H2 mb="$6">Company Information</H2>
      <YStack tag="form" onSubmit={handleSubmit} gap="$4">
        <YStack gap="$2">
          <Text fontWeight="600" color="$color12">Company Name</Text>
          <Input
            value={companyName}
            onChangeText={setCompanyName}
            placeholder="Enter your company name"
          />
          {errors.companyName && <Text color="$red10" fontSize="$2">{errors.companyName}</Text>}
        </YStack>
        <YStack gap="$2">
          <Text fontWeight="600" color="$color12">Address</Text>
          <Input
            value={address}
            onChangeText={setAddress}
            placeholder="Enter your company address"
          />
          {errors.address && <Text color="$red10" fontSize="$2">{errors.address}</Text>}
        </YStack>
        <YStack gap="$2">
          <Text fontWeight="600" color="$color12">Phone</Text>
          <Input
            value={phone}
            onChangeText={setPhone}
            placeholder="Enter your phone number"
          />
          {errors.phone && <Text color="$red10" fontSize="$2">{errors.phone}</Text>}
        </YStack>
        <YStack mt="$6">
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

export default CompanyStep;
