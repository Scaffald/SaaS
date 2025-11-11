import { Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { YStack } from "tamagui";

import { BackgroundCheckWizard } from "@app/core/features/background-check";

export default function BackgroundCheckInitiateScreen() {
  const insets = useSafeAreaInsets();

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <SafeAreaView style={{ flex: 1, paddingTop: insets.top }}>
        <YStack flex={1}>
          <BackgroundCheckWizard />
        </YStack>
      </SafeAreaView>
    </>
  );
}


