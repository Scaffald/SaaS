// src/pages/docs/Changelog.tsx
import React from 'react';
import { YStack, View, Text, H1, H2 } from '@unicornlove/ui';

function ChangelogDoc() {
  return (
    <View padding="$6">
      <H1 fontSize="$9" fontWeight="bold" marginBottom="$4" color="$color12">Changelog</H1>
      <Text fontSize="$5" color="$color11" marginBottom="$6">
        Keep track of all major changes and updates to the ForSured Design System.
      </Text>

      <View marginBottom="$8">
        <H2 fontSize="$7" fontWeight="600" marginBottom="$3" color="$color12">Version 1.0.0 - November 28, 2025</H2>
        <YStack gap="$2" paddingLeft="$4">
          <Text color="$color11">• Initial release of the ForSured Design System.</Text>
          <Text color="$color11">• Introduced core components: Button, Input as TextInput, Modal.</Text>
          <Text color="$color11">• Defined foundational design tokens: Colors, Typography, Spacing.</Text>
          <Text color="$color11">• Established UI patterns for Form Validation and Empty States.</Text>
        </YStack>
      </View>

      <View marginBottom="$8">
        <H2 fontSize="$7" fontWeight="600" marginBottom="$3" color="$color12">Version 0.9.0 - October 15, 2025</H2>
        <YStack gap="$2" paddingLeft="$4">
          <Text color="$color11">• Pre-release version with foundational styles and a limited component set.</Text>
          <Text color="$color11">• Internal testing and feedback integration.</Text>
        </YStack>
      </View>
    </View>
  );
}

export default ChangelogDoc;
