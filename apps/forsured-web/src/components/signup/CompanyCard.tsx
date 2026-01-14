/**
 * CompanyCard - Company card component using Beyond UI
 */
import React from 'react';
import { Stack, Row, Text, Card, CardContent } from '@unicornlove/beyond-ui';

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
    <Card padding="md">
      <CardContent style={{ gap: 8 }}>
        <Row style={{ alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Text role="img" aria-label="company" size="xl">🏢</Text>
          <Text size="lg" weight="semibold">
            {company.name}
          </Text>
        </Row>
        <Text size="sm" color="secondary">
          {company.address.street}, {company.address.city}, {company.address.state} {company.address.zip}
        </Text>
        {children && <Stack style={{ marginTop: 12 }}>{children}</Stack>}
      </CardContent>
    </Card>
  );
}

export default CompanyCard;
