import { MinusCircle } from "lucide-react-native";
import { memo } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { Platform } from "react-native";
import { Button, Input, Text, Row, Stack } from "@scaffald/ui";

import type { CreateWorkLogInput } from "@scf/schemas";

export interface TimeEntryInputProps {
  index: number;
  onRemove?: () => void;
  disableRemove?: boolean;
}

const getInputPropsForPlatform = (): Record<string, unknown> => {
  if (Platform.OS === "web") {
    return {
      type: "time",
      step: 300,
    };
  }

  return {
    inputMode: "numeric" as const,
    keyboardType: "numbers-and-punctuation" as const,
  };
};

export const TimeEntryInput = memo(function TimeEntryInput({
  index,
  onRemove,
  disableRemove = false,
}: TimeEntryInputProps) {
  const {
    control,
    formState: { errors },
  } = useFormContext<CreateWorkLogInput>();

  const rowError = errors.timeEntries?.[index];

  return (
    <Stack
      borderWidth={1}
      style={{ borderColor: "#e2e8f0", borderRadius: 16, padding: 8 }}
      gap={8}
    >
      <Row gap={12} align="center">
        <Stack flex={1} gap={4}>
          <Text>Start Time</Text>
          <Controller
            control={control}
            name={`timeEntries.${index}.start`}
            render={({ field }) => (
              <Input
                {...field}
                placeholder="08:00"
                autoCapitalize="none"
                autoCorrect={false}
                {...getInputPropsForPlatform()}
              />
            )}
          />
          {rowError?.start?.message && (
            <Text style={{ color: "#ef4444" }}>{rowError.start.message}</Text>
          )}
        </Stack>

        <Stack flex={1} gap={4}>
          <Text>End Time</Text>
          <Controller
            control={control}
            name={`timeEntries.${index}.end`}
            render={({ field }) => (
              <Input
                {...field}
                placeholder="16:30"
                autoCapitalize="none"
                autoCorrect={false}
                {...getInputPropsForPlatform()}
              />
            )}
          />
          {rowError?.end?.message && (
            <Text style={{ color: "#ef4444" }}>{rowError.end.message}</Text>
          )}
        </Stack>

        <Button
          size="sm"
          variant="outline"
          onPress={onRemove}
          disabled={disableRemove}
          iconStart={MinusCircle}
          accessibilityLabel="Remove time entry"
          style={{ alignSelf: "flex-end" }}
        />
      </Row>

      {typeof rowError?.message === "string" && (
        <Text style={{ color: "#ef4444" }}>{rowError.message}</Text>
      )}
    </Stack>
  );
});
