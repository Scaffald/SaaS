// src/components/onboarding/steps/broker/AgencyStep.tsx
// REQ-126: Broker Onboarding - Agency Setup Step
import { useState } from 'react';
import { YStack, Text, H2, Input, Button } from '@unicornlove/ui';

interface AgencyStepProps {
  onComplete: (data: any) => Promise<void>;
  initialData?: any;
  isLoading?: boolean;
}

function AgencyStep({ onComplete, initialData = {}, isLoading = false }: AgencyStepProps) {
  const agency = initialData.agency || {};
  const [agencyName, setAgencyName] = useState(agency.name || '');
  const [address, setAddress] = useState(agency.address || '');
  const [phone, setPhone] = useState(agency.phone || '');
  const [website, setWebsite] = useState(agency.website || '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!agencyName.trim()) newErrors.agencyName = 'Agency name is required';
    if (!address.trim()) newErrors.address = 'Address is required';
    if (!phone.trim()) newErrors.phone = 'Phone is required';
    if (website && !website.match(/^https?:\/\/.+/)) {
      newErrors.website = 'Please enter a valid URL (e.g., https://example.com)';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    await onComplete({
      agency: {
        name: agencyName,
        address,
        phone,
        website: website || undefined,
      },
    });
  };

  return (
    <YStack>
      <H2 marginBottom="$2">Agency Information</H2>
      <Text marginBottom="$6" color="$color10">
        Tell us about your insurance agency
      </Text>
      <YStack tag="form" onSubmit={handleSubmit} gap="$4">
        <YStack gap="$2">
          <Text fontWeight="600" color="$color12">Agency Name</Text>
          <Input
            value={agencyName}
            onChangeText={setAgencyName}
            placeholder="Enter your agency name"
          />
          {errors.agencyName && <Text color="$red10" fontSize="$2">{errors.agencyName}</Text>}
        </YStack>
        <YStack gap="$2">
          <Text fontWeight="600" color="$color12">Address</Text>
          <Input
            value={address}
            onChangeText={setAddress}
            placeholder="Enter your agency address"
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
        <YStack gap="$2">
          <Text fontWeight="600" color="$color12">Website (Optional)</Text>
          <Input
            value={website}
            onChangeText={setWebsite}
            placeholder="https://example.com"
          />
          {errors.website && <Text color="$red10" fontSize="$2">{errors.website}</Text>}
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

export default AgencyStep;
