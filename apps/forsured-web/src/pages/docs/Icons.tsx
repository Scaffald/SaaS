// src/pages/docs/Icons.tsx
import React from 'react';
import { YStack, XStack, View, Text, H1, H2 } from '@unicornlove/ui';
import * as LucideIcons from 'lucide-react';

function IconsDoc() {
  const icons = Object.keys(LucideIcons).filter(name => typeof (LucideIcons as Record<string, unknown>)[name] === 'function');

  return (
    <View padding="$6">
      <H1 fontSize="$9" fontWeight="bold" marginBottom="$4" color="$color12">Icon Library</H1>
      <Text fontSize="$5" color="$color11" marginBottom="$6">
        We use the Lucide icon set for a consistent and modern look across our application.
      </Text>

      <H2 fontSize="$7" fontWeight="600" marginBottom="$3" color="$color12">Available Icons ({icons.length})</H2>
      <XStack flexWrap="wrap" gap="$4">
        {icons.map((iconName) => {
          const IconComponent = (LucideIcons as Record<string, React.ComponentType<{ size?: number }>>)[iconName];
          return (
            <YStack
              key={iconName}
              alignItems="center"
              justifyContent="center"
              padding="$4"
              borderWidth={1}
              borderColor="$borderColor"
              borderRadius="$4"
              shadowRadius={2}
              shadowColor="$shadowColor"
              shadowOffset={{ width: 0, height: 1 }}
              backgroundColor="$background"
              minWidth={120}
            >
              <IconComponent size={32} />
              <Text fontSize="$2" textAlign="center" marginTop="$2" color="$color11">{iconName}</Text>
            </YStack>
          );
        })}
      </XStack>
    </View>
  );
}

export default IconsDoc;
