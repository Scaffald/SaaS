/**
 * Home Page - Landing page using Tamagui
 */
import React from "react";
import { YStack, Text } from '@unicornlove/ui';

const Home: React.FC = () => {
  return (
    <YStack
      minHeight="100vh"
      alignItems="center"
      justifyContent="center"
      backgroundColor="$backgroundHover"
    >
      <YStack alignItems="center" gap="$4">
        <Text fontSize="$10" fontWeight="700" color="$color11" marginBottom="$4">
          Welcome to ForSured
        </Text>
        <Text fontSize="$5" color="$color10">
          Modern insurance management for construction projects
        </Text>
      </YStack>
    </YStack>
  );
};

export default Home;
