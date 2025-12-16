// src/pages/docs/Patterns.tsx
import React from 'react';
import { YStack, XStack, View, Text, H1, H2, H3 } from '@unicornlove/ui';
import Button from '../../components/Common/Button';
import Input from '../../components/Common/Input';

function PatternsDoc() {
  return (
    <View padding="$6">
      <H1 fontSize="$9" fontWeight="bold" marginBottom="$4" color="$color12">UI Patterns</H1>
      <Text fontSize="$5" color="$color11" marginBottom="$6">
        UI patterns are reusable solutions to common design problems. They provide a standardized way to build consistent and effective user interfaces.
      </Text>

      <H2 fontSize="$7" fontWeight="600" marginBottom="$3" color="$color12">Form Validation</H2>
      <Text marginBottom="$4" color="$color11">
        Ensure user input is correct and provide clear feedback.
      </Text>
      <View
        borderWidth={1}
        borderColor="$borderColor"
        borderRadius="$4"
        padding="$4"
        marginBottom="$6"
        backgroundColor="$background"
      >
        <Input
          label="Email Address"
          type="email"
          error="Please enter a valid email address."
          fullWidth
        />
      </View>

      <H2 fontSize="$7" fontWeight="600" marginBottom="$3" color="$color12">Empty States</H2>
      <Text marginBottom="$4" color="$color11">
        Provide guidance and calls to action when there is no data to display.
      </Text>
      <View
        borderWidth={1}
        borderColor="$borderColor"
        borderRadius="$4"
        padding="$4"
        marginBottom="$6"
        backgroundColor="$background"
        alignItems="center"
      >
        <View
          width={48}
          height={48}
          borderRadius={24}
          backgroundColor="$backgroundSecondary"
          alignItems="center"
          justifyContent="center"
          marginBottom="$2"
        >
          <Text fontSize="$6" color="$color10">📦</Text>
        </View>
        <H3 fontSize="$3" fontWeight="500" marginTop="$2" color="$color12">No items</H3>
        <Text fontSize="$3" color="$color11" marginTop="$1">Get started by creating a new item.</Text>
        <View marginTop="$6">
          <Button variant="primary">
            Create New Item
          </Button>
        </View>
      </View>
    </View>
  );
}

export default PatternsDoc;
