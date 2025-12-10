/**
 * NotFound Page - 404 page using Tamagui
 */
import React from "react";
import { Link } from "react-router-dom";
import { YStack, Text } from '@unicornlove/ui';
import { Button as CoreButton } from '@unicornlove/ui';

const NotFound: React.FC = () => {
  return (
    <YStack
      minHeight="100vh"
      alignItems="center"
      justifyContent="center"
      backgroundColor="$backgroundHover"
    >
      <YStack alignItems="center" gap="$4">
        <Text fontSize="$12" fontWeight="700" color="$color11">
          404
        </Text>
        <Text fontSize="$6" color="$color10" marginBottom="$8">
          Page not found
        </Text>
        <CoreButton asChild variant="primary">
          <Link to="/">Go Home</Link>
        </CoreButton>
      </YStack>
    </YStack>
  );
};

export default NotFound;
