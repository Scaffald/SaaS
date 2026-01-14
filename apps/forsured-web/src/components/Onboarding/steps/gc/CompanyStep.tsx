// src/components/onboarding/steps/gc/CompanyStep.tsx
// REQ-126: GC Onboarding - Company Information Step
import { useState } from 'react';
import { Stack, Text, H2, Input, Button } from '@unicornlove/beyond-ui';

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
    <Stack>
      <H2 style={{ marginBottom: 24 }}>Company Information</H2>
      <form onSubmit={handleSubmit}>
        <Stack style={{ gap: 16 }}>
          <Stack style={{ gap: 8 }}>
            <Text style={{ fontWeight: 600, color: 'var(--color-text)' }}>Company Name</Text>
            <Input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Enter your company name"
            />
            {errors.companyName && <Text style={{ color: 'var(--color-red-10)', fontSize: 12 }}>{errors.companyName}</Text>}
          </Stack>
          <Stack style={{ gap: 8 }}>
            <Text style={{ fontWeight: 600, color: 'var(--color-text)' }}>Address</Text>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter your company address"
            />
            {errors.address && <Text style={{ color: 'var(--color-red-10)', fontSize: 12 }}>{errors.address}</Text>}
          </Stack>
          <Stack style={{ gap: 8 }}>
            <Text style={{ fontWeight: 600, color: 'var(--color-text)' }}>Phone</Text>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter your phone number"
            />
            {errors.phone && <Text style={{ color: 'var(--color-red-10)', fontSize: 12 }}>{errors.phone}</Text>}
          </Stack>
          <Stack style={{ marginTop: 24 }}>
            <Button
              onClick={handleSubmit}
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

export default CompanyStep;
