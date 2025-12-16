import React, { ReactNode } from 'react';
import { YStack, XStack, View, Text, H3 } from '@unicornlove/ui';

export interface ComponentShowcaseProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export default function ComponentShowcase({
  title,
  description,
  children,
}: ComponentShowcaseProps) {
  return (
    <View
      backgroundColor="$background"
      borderRadius="$6"
      borderWidth={1}
      borderColor="$borderColor"
      shadowRadius={2}
      shadowColor="$shadowColor"
      shadowOffset={{ width: 0, height: 1 }}
      id={title.toLowerCase().replace(/\s+/g, '-')}
    >
      <View paddingHorizontal="$6" paddingVertical="$4" borderBottomWidth={1} borderBottomColor="$borderColor">
        <H3 fontSize="$5" fontWeight="600" color="$color12">{title}</H3>
        {description && (
          <Text fontSize="$3" color="$color11" marginTop="$1">{description}</Text>
        )}
      </View>
      <View padding="$6">
        <XStack
          alignItems="center"
          justifyContent="center"
          flexWrap="wrap"
          gap="$4"
          padding="$8"
          backgroundColor="$backgroundSecondary"
          borderRadius="$4"
          borderWidth={1}
          borderColor="$borderColor"
          minHeight={120}
        >
          {children}
        </XStack>
      </View>
    </View>
  );
}
