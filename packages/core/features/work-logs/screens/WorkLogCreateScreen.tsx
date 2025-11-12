import { useRouter } from "expo-router";
import { ScrollView } from "react-native";
import { Button, Separator, Text, YStack } from "tamagui";

import { RouteBuilder } from "@app/core/constants/routes";
import { useToastController } from "@tamagui/toast";

import { WorkLogForm } from "../components/WorkLogForm";

export function WorkLogCreateScreen() {
  const router = useRouter();
  const toast = useToastController();

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic">
      <YStack p="$4" gap="$4">
        <YStack gap="$1">
          <Text fontSize="$7" fontWeight="700">
            Record work log
          </Text>
          <Text color="$color10">
            Document the work performed today, capture time entries, tasks, and skills used.
          </Text>
        </YStack>

        <Separator />

        <WorkLogForm
          submitLabel="Save Work Log"
          onSubmitSuccess={(workLogId) => {
            toast.show("Work log saved", {
              message: "You can review or edit this entry at any time.",
            });
            router.replace(RouteBuilder.dashboardWorkLogDetail(workLogId));
          }}
        />

        <Button
          size="$3"
          variant="outlined"
          onPress={() => router.back()}
        >
          Cancel
        </Button>
      </YStack>
    </ScrollView>
  );
}

