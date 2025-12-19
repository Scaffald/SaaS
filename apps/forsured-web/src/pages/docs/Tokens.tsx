// src/pages/docs/Tokens.tsx
import React from 'react';
import { YStack, XStack, View, Text, H1, H2 } from '@unicornlove/ui';

function TokensDoc() {
  return (
    <View padding="$6">
      <H1 fontSize="$9" fontWeight="bold" marginBottom="$4" color="$color12">Design Tokens</H1>
      <Text fontSize="$5" color="$color11" marginBottom="$6">
        Our design tokens are the visual atoms of our design system. They represent the smallest, indivisible pieces of design information that are used to build our UI.
      </Text>

      <H2 fontSize="$7" fontWeight="600" marginBottom="$3" color="$color12">Colors</H2>
      <Text marginBottom="$4" color="$color11">
        We use a semantic color palette to ensure consistent meaning and usage across the application.
      </Text>
      <XStack flexWrap="wrap" gap="$4" marginBottom="$6">
        <View padding="$4" borderWidth={1} borderColor="$borderColor" borderRadius="$4" shadowRadius={2} shadowColor="$shadowColor" shadowOffset={{ width: 0, height: 1 }} backgroundColor="$background">
          <View width={96} height={96} backgroundColor="$blue9" borderRadius="$3" marginBottom="$2" />
          <Text fontWeight="500" color="$color12">Primary 500</Text>
          <Text fontSize="$2" color="$color11">#4F46E5</Text>
        </View>
        <View padding="$4" borderWidth={1} borderColor="$borderColor" borderRadius="$4" shadowRadius={2} shadowColor="$shadowColor" shadowOffset={{ width: 0, height: 1 }} backgroundColor="$background">
          <View width={96} height={96} backgroundColor="$green9" borderRadius="$3" marginBottom="$2" />
          <Text fontWeight="500" color="$color12">Success 500</Text>
          <Text fontSize="$2" color="$color11">#22C55E</Text>
        </View>
      </XStack>

      <H2 fontSize="$7" fontWeight="600" marginBottom="$3" color="$color12">Typography</H2>
      <Text marginBottom="$4" color="$color11">
        Our typography scale defines consistent font sizes, weights, and line heights.
      </Text>
      <YStack marginBottom="$6" gap="$2">
        <Text fontSize="$9" fontWeight="bold" marginBottom="$2" color="$color12">Heading 1 (text-4xl font-bold)</Text>
        <Text fontSize="$8" fontWeight="600" marginBottom="$2" color="$color12">Heading 2 (text-3xl font-semibold)</Text>
        <Text fontSize="$4" marginBottom="$2" color="$color12">Body (text-base)</Text>
        <Text fontSize="$2" color="$color11">Small text (text-sm)</Text>
      </YStack>

      <H2 fontSize="$7" fontWeight="600" marginBottom="$3" color="$color12">Spacing</H2>
      <Text marginBottom="$4" color="$color11">
        Our spacing scale ensures consistent visual rhythm and hierarchy.
      </Text>
      <XStack alignItems="flex-end" marginBottom="$6" gap="$2">
        <View backgroundColor="$blue4" padding="$2">
          <Text fontSize="$2" color="$color11">Small (p-2)</Text>
        </View>
        <View backgroundColor="$blue4" padding="$4">
          <Text fontSize="$2" color="$color11">Medium (p-4)</Text>
        </View>
        <View backgroundColor="$blue4" padding="$8">
          <Text fontSize="$2" color="$color11">Large (p-8)</Text>
        </View>
      </XStack>
    </View>
  );
}

export default TokensDoc;
