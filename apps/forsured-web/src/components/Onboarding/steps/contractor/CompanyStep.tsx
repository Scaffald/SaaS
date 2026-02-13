// src/components/onboarding/steps/contractor/CompanyStep.tsx
// Contractor Onboarding - Company Information Step
import { useState } from 'react';
import { Stack, Text, H2, Input, Button } from '@scaffald/ui';

interface CompanyStepProps {
  onComplete: (data: any) => Promise<void>;
  initialData?: any;
  isLoading?: boolean;
}

function CompanyStep({ onComplete, initialData = {}, isLoading = false }: CompanyStepProps) {
  const company = initialData.company || {};
  const [companyName, setCompanyName] = useState(company.name || '');
  const [trade, setTrade] = useState(company.trade || '');
  const [address, setAddress] = useState(company.address || '');
  const [phone, setPhone] = useState(company.phone || '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!companyName.trim()) newErrors.companyName = 'Company name is required';
    if (!trade.trim()) newErrors.trade = 'Trade/specialty is required';
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
        trade,
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
            <Text style={{ fontWeight: 600, color: 'var(--color-text)' }}>Trade/Specialty</Text>
            <Input
              value={trade}
              onChange={(e) => setTrade(e.target.value)}
              placeholder="e.g., Electrical, Plumbing, HVAC"
            />
            {errors.trade && <Text style={{ color: 'var(--color-red-10)', fontSize: 12 }}>{errors.trade}</Text>}
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

export default CompanyStep;
