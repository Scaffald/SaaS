// src/pages/docs/Icons.tsx
import React from 'react';
import { Stack, Row, Box, Text, H1, H2 } from '@scaffald/ui';
import * as LucideIcons from 'lucide-react';

function IconsDoc() {
  const icons = Object.keys(LucideIcons).filter(name => typeof (LucideIcons as Record<string, unknown>)[name] === 'function');

  return (
    <Box style={{ padding: 'var(--space-6)' }}>
      <H1 style={{ fontSize: 'var(--font-size-9)', fontWeight: 'bold', marginBottom: 'var(--space-4)', color: 'var(--color-12)' }}>Icon Library</H1>
      <Text style={{ fontSize: 'var(--font-size-5)', color: 'var(--color-11)', marginBottom: 'var(--space-6)' }}>
        We use the Lucide icon set for a consistent and modern look across our application.
      </Text>

      <H2 style={{ fontSize: 'var(--font-size-7)', fontWeight: 600, marginBottom: 'var(--space-3)', color: 'var(--color-12)' }}>Available Icons ({icons.length})</H2>
      <Row style={{ flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        {icons.map((iconName) => {
          const IconComponent = (LucideIcons as Record<string, React.ComponentType<{ size?: number }>>)[iconName];
          return (
            <Stack
              key={iconName}
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                padding: 'var(--space-4)',
                borderWidth: 1,
                borderStyle: 'solid',
                borderColor: 'var(--color-border)',
                borderRadius: 'var(--radius-4)',
                boxShadow: '0 1px 2px var(--color-shadow)',
                backgroundColor: 'var(--color-background)',
                minWidth: 120,
              }}
            >
              <IconComponent size={32} />
              <Text style={{ fontSize: 'var(--font-size-2)', textAlign: 'center', marginTop: 'var(--space-2)', color: 'var(--color-11)' }}>{iconName}</Text>
            </Stack>
          );
        })}
      </Row>
    </Box>
  );
}

export default IconsDoc;
