// src/pages/docs/Components.tsx
import React from 'react';
import { YStack, XStack, View, Text, H1, H2, H3 } from '@unicornlove/ui';

interface ComponentDocProps {
  name: string;
  description: string;
  props: { name: string; type: string; description: string; default?: string }[];
  examples: { title: string; code: string; render: React.ReactNode }[];
}

function ComponentDocumentationTemplate({ name, description, props, examples }: ComponentDocProps) {
  return (
    <View padding="$6">
      <H1 fontSize="$9" fontWeight="bold" marginBottom="$4" color="$color12">{name}</H1>
      <Text fontSize="$5" color="$color11" marginBottom="$6">{description}</Text>

      <H2 fontSize="$7" fontWeight="600" marginBottom="$3" color="$color12">Props</H2>
      <View
        backgroundColor="$background"
        borderWidth={1}
        borderColor="$borderColor"
        borderRadius="$4"
        marginBottom="$6"
        overflow="hidden"
      >
        <XStack
          backgroundColor="$backgroundSecondary"
          borderBottomWidth={1}
          borderBottomColor="$borderColor"
        >
          <Text flex={1} paddingVertical="$2" paddingHorizontal="$4" fontWeight="600" color="$color12">Name</Text>
          <Text flex={1} paddingVertical="$2" paddingHorizontal="$4" fontWeight="600" color="$color12">Type</Text>
          <Text flex={2} paddingVertical="$2" paddingHorizontal="$4" fontWeight="600" color="$color12">Description</Text>
          <Text flex={1} paddingVertical="$2" paddingHorizontal="$4" fontWeight="600" color="$color12">Default</Text>
        </XStack>
        {props.map((prop, index) => (
          <XStack
            key={index}
            borderBottomWidth={index < props.length - 1 ? 1 : 0}
            borderBottomColor="$borderColor"
          >
            <Text flex={1} paddingVertical="$2" paddingHorizontal="$4" color="$color12">{prop.name}</Text>
            <Text flex={1} paddingVertical="$2" paddingHorizontal="$4" color="$color11" fontFamily="$mono" fontSize="$2">{prop.type}</Text>
            <Text flex={2} paddingVertical="$2" paddingHorizontal="$4" color="$color11">{prop.description}</Text>
            <Text flex={1} paddingVertical="$2" paddingHorizontal="$4" color="$color10">{prop.default || '-'}</Text>
          </XStack>
        ))}
      </View>

      <H2 fontSize="$7" fontWeight="600" marginBottom="$3" color="$color12">Examples</H2>
      {examples.map((example, index) => (
        <View
          key={index}
          marginBottom="$6"
          borderWidth={1}
          borderColor="$borderColor"
          borderRadius="$4"
          padding="$4"
          backgroundColor="$background"
        >
          <H3 fontSize="$6" fontWeight="500" marginBottom="$3" color="$color12">{example.title}</H3>
          <View
            backgroundColor="$backgroundSecondary"
            padding="$3"
            borderRadius="$3"
            marginBottom="$3"
          >
            <Text fontFamily="$mono" fontSize="$2" color="$color11" style={{ whiteSpace: 'pre-wrap' }}>
              {example.code}
            </Text>
          </View>
          <View
            borderWidth={1}
            borderColor="$borderColor"
            padding="$4"
            borderRadius="$3"
          >
            {example.render}
          </View>
        </View>
      ))}
    </View>
  );
}

export default ComponentDocumentationTemplate;
