/**
 * StoragePreferencesWidget
 * Document Storage Preferences UI.
 *
 * Allows users to select their preferred document storage backend:
 * - Local (Supabase) - Default, built-in storage
 * - Dropbox - Cloud storage via OAuth
 * - Google Drive - Cloud storage via OAuth
 */

import { Cloud, Database, HardDrive } from "lucide-react-native";
import { Button, DashboardWidget, H4, LoadingState, useThemeContext } from "@scaffald/ui";
import type { ComponentType } from "react";
import { useState, useEffect } from "react";
import { Pressable } from "react-native";
import { Skeleton, SkeletonBox, Text, Row, Stack } from "@scaffald/ui";
import { colors } from "@scaffald/ui/tokens";
import { useQueryClient } from "@tanstack/react-query";
import {
  useStoragePreference,
  useSetStoragePreferenceMutation,
  STORAGE_PREFERENCE_QUERY_KEY,
} from "@scf/core/utils/documents-storage-sdk-hooks";

type StorageBackend = "supabase" | "dropbox" | "google_drive";

interface StorageOption {
  value: StorageBackend;
  label: string;
  description: string;
  icon: ComponentType<{ size?: number; color?: string }>;
  available: boolean;
}

const STORAGE_OPTIONS: StorageOption[] = [
  {
    value: "supabase",
    label: "Local Storage",
    description:
      "Store documents on Scaffald servers. Secure, fast, always available.",
    icon: Database,
    available: true,
  },
  {
    value: "dropbox",
    label: "Dropbox",
    description:
      "Sync documents with your Dropbox account. Requires OAuth connection.",
    icon: Cloud,
    available: false, // Will be enabled later
  },
  {
    value: "google_drive",
    label: "Google Drive",
    description: "Sync documents with Google Drive. Requires OAuth connection.",
    icon: HardDrive,
    available: false, // Will be enabled later
  },
];

export function StoragePreferencesWidget() {
  const [selectedPreference, setSelectedPreference] =
    useState<StorageBackend>("supabase");
  const [hasChanges, setHasChanges] = useState(false);
  const { theme } = useThemeContext();

  const { data, isLoading, error } = useStoragePreference();
  const queryClient = useQueryClient();

  const mutation = useSetStoragePreferenceMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STORAGE_PREFERENCE_QUERY_KEY });
      setHasChanges(false);
    },
  });

  useEffect(() => {
    if (data?.storagePreference) {
      setSelectedPreference(data.storagePreference as StorageBackend);
    }
  }, [data?.storagePreference]);

  const handleSelect = (value: StorageBackend) => {
    setSelectedPreference(value);
    setHasChanges(value !== data?.storagePreference);
  };

  const handleSave = () => {
    mutation.mutate({ storagePreference: selectedPreference });
  };

  if (isLoading) {
    return (
      <DashboardWidget>
        <Stack gap={12}>
          <Skeleton width={160} height={20} shape="text" />
          {[0, 1, 2].map((i) => (
            <SkeletonBox key={i} width="100%" height={72} borderRadius={12} />
          ))}
        </Stack>
      </DashboardWidget>
    );
  }

  if (error) {
    return (
      <DashboardWidget>
        <Stack gap={16} align="center" paddingVertical={32}>
          <Text style={{ color: colors.fg[theme].error }}>
            Failed to load storage preferences
          </Text>
          <Text style={{ color: colors.text[theme].secondary }}>{error.message}</Text>
        </Stack>
      </DashboardWidget>
    );
  }

  return (
    <DashboardWidget>
      <Stack gap={12}>
        {/* Header */}
        <Row justify="space-between" align="center">
          <Stack gap={4}>
            <H4>Document Storage</H4>
            <Text style={{ color: colors.text[theme].secondary }}>
              Choose where your documents are stored
            </Text>
          </Stack>
          {hasChanges && (
            <Button
              variant="filled"
              color="primary"
              size="sm"
              disabled={mutation.isPending}
              onPress={handleSave}
            >
              {mutation.isPending ? "Saving..." : "Save"}
            </Button>
          )}
        </Row>

        {/* Storage Options */}
        <Stack gap={12}>
          {STORAGE_OPTIONS.map((option) => {
            const isSelected = selectedPreference === option.value;
            const IconComponent = option.icon;

            return (
              <Pressable
                key={option.value}
                onPress={() => option.available && handleSelect(option.value)}
              >
                <Row
                  padding="md"
                  borderRadius={16}
                  gap={12}
                  align="center"
                  style={{
                    borderWidth: 2,
                    borderColor: isSelected ? colors.blue[400] : colors.border[theme].default,
                    backgroundColor: isSelected ? colors.blue[50] : colors.bg[theme].default,
                    opacity: option.available ? 1 : 0.5,
                  }}
                >
                  <Row
                    width={48}
                    height={48}
                    borderRadius={12}
                    align="center"
                    justify="center"
                    style={{
                      backgroundColor: isSelected ? colors.blue[200] : colors.bg[theme].muted,
                    }}
                  >
                    <IconComponent
                      size={24}
                      color={isSelected ? colors.blue[600] : colors.text[theme].tertiary}
                    />
                  </Row>

                  <Stack flex={1} gap={4}>
                    <Row align="center" gap={8}>
                      <Text style={{ color: colors.text[theme].secondary }}>{option.label}</Text>
                      {!option.available && (
                        <Row
                          paddingHorizontal={8}
                          paddingVertical={4}
                          borderRadius={8}
                          style={{ backgroundColor: colors.yellow[100] }}
                        >
                          <Text style={{ color: colors.yellow[800] }}>COMING SOON</Text>
                        </Row>
                      )}
                      {isSelected && option.available && (
                        <Row
                          paddingHorizontal={8}
                          paddingVertical={4}
                          borderRadius={8}
                          style={{ backgroundColor: colors.green[100] }}
                        >
                          <Text style={{ color: colors.green[800] }}>ACTIVE</Text>
                        </Row>
                      )}
                    </Row>
                    <Text style={{ color: colors.text[theme].secondary }}>
                      {option.description}
                    </Text>
                  </Stack>
                </Row>
              </Pressable>
            );
          })}
        </Stack>

        {/* Status Messages */}
        {mutation.isSuccess && (
          <Text style={{ color: colors.fg[theme].success }}>
            Storage preference saved successfully.
          </Text>
        )}
        {mutation.isError && (
          <Text style={{ color: colors.fg[theme].error }}>
            Failed to save storage preference: {mutation.error.message}
          </Text>
        )}

        {/* Info Note */}
        <Stack
          padding="sm"
          borderRadius={12}
          style={{
            backgroundColor: colors.blue[50],
            borderWidth: 1,
            borderColor: colors.blue[300],
          }}
        >
          <Text style={{ color: colors.blue[700] }}>
            Note: Existing documents will remain in their current storage
            location. Only new documents will use your selected preference.
          </Text>
        </Stack>
      </Stack>
    </DashboardWidget>
  );
}
