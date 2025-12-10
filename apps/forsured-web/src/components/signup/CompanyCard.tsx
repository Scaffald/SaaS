/**
 * CompanyCard - Company card component using Tamagui
 */
import React from 'react';
import { YStack, XStack, Text } from '@unicornlove/ui';
import { Card } from '@unicornlove/ui';

interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
}

interface Company {
  id: string;
  name: string;
  address: Address;
}

interface CompanyCardProps {
  company: Company;
  children?: React.ReactNode;
}

function CompanyCard({ company, children }: CompanyCardProps) {
  return (
    <Card padding="$4" gap="$2">
      <XStack alignItems="center" gap="$2" marginBottom="$2">
        <Text role="img" aria-label="company" fontSize="$6">🏢</Text>
        <Text fontSize="$5" fontWeight="600">
          {company.name}
        </Text>
      </XStack>
      <Text fontSize="$2" color="$color10">
        {company.address.street}, {company.address.city}, {company.address.state} {company.address.zip}
      </Text>
      {children && <YStack marginTop="$3">{children}</YStack>}
    </Card>
  );
}

export default CompanyCard;
