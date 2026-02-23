/**
 * Create Webhook Page
 * Form for creating a new webhook endpoint
 */

import * as Clipboard from "expo-clipboard";
import { Alert, Pressable, ScrollView } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  useWebhookEventTypes,
  useCreateWebhookMutation,
} from "@scf/core/utils/webhooks-sdk-hooks";
import { OfficeLayout } from "@scf/core/components/layouts/OfficeLayout";
import { Button, Card, Checkbox, Row, Stack, Text, Input } from "@scaffald/ui";
import { ROUTES } from "@scf/core/constants/routes";
import type { WebhookEventType } from "@scf/schemas";

export default function CreateWebhookPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<Set<WebhookEventType>>(
    new Set()
  );
  const [secret, setSecret] = useState("");

  // Fetch available event types
  const { data: eventTypesData } = useWebhookEventTypes();
  const eventTypes = eventTypesData?.data ?? [];

  // Create webhook mutation
  const createWebhook = useCreateWebhookMutation({
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["webhooks", "list"] });
      // Show secret once
      setSecret(data.data.secret);
      Alert.alert(
        "Webhook Created",
        "Your webhook has been created successfully. Make sure to save your secret key - it will not be shown again!",
        [
          {
            text: "Copy Secret & Continue",
            onPress: async () => {
              await Clipboard.setStringAsync(data.data.secret);
              router.push(ROUTES.OFFICE.WEBHOOKS.path);
            },
          },
        ]
      );
    },
    onError: (error) => {
      Alert.alert("Error", error.message);
    },
  });

  const handleToggleEvent = (eventType: WebhookEventType) => {
    const newSelected = new Set(selectedEvents);
    if (newSelected.has(eventType)) {
      newSelected.delete(eventType);
    } else {
      newSelected.add(eventType);
    }
    setSelectedEvents(newSelected);
  };

  const handleSubmit = () => {
    if (!url || !url.startsWith("https://")) {
      Alert.alert("Invalid URL", "Webhook URL must start with https://");
      return;
    }

    if (selectedEvents.size === 0) {
      Alert.alert(
        "No Events Selected",
        "Please select at least one event type"
      );
      return;
    }

    createWebhook.mutate({
      url,
      description,
      events: Array.from(selectedEvents),
    });
  };

  // Group events by category
  const eventsByCategory = eventTypes.reduce((acc, event) => {
    if (!acc[event.category]) {
      acc[event.category] = [];
    }
    acc[event.category].push(event);
    return acc;
  }, {} as Record<string, typeof eventTypes>);

  if (secret) {
    // Show secret after creation
    return (
      <OfficeLayout
        showBreadcrumb
        breadcrumbItems={[
          { label: "Office", href: ROUTES.OFFICE.path },
          { label: "Webhooks", href: ROUTES.OFFICE.WEBHOOKS.path },
          { label: "Created", href: ROUTES.OFFICE.WEBHOOKS.CREATE.path },
        ]}
        leftContent={
          <ScrollView contentContainerStyle={{ padding: 16 }}>
            <Stack align="center">
              <Card padding="lg">
                <Stack gap={20} align="center">
                  <Text>⚠️ Save Your Webhook Secret</Text>
                  <Text color="$gray11" style={{ maxWidth: 400 }}>
                    This is the only time you will see this secret. Store it
                    securely.
                  </Text>

                  <Stack width="100%" padding="sm">
                    <Text style={{ fontFamily: "monospace" }} selectable>
                      {secret}
                    </Text>
                  </Stack>

                  <Button
                    variant="filled"
                    size="md"
                    onPress={() => router.push(ROUTES.OFFICE.WEBHOOKS.path)}
                  >
                    I've Saved My Secret
                  </Button>
                </Stack>
              </Card>
            </Stack>
          </ScrollView>
        }
      />
    );
  }

  return (
    <OfficeLayout
      showBreadcrumb
      breadcrumbItems={[
        { label: "Office", href: ROUTES.OFFICE.path },
        { label: "Webhooks", href: ROUTES.OFFICE.WEBHOOKS.path },
        { label: "Create", href: ROUTES.OFFICE.WEBHOOKS.CREATE.path },
      ]}
      leftContent={
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <Stack gap={16}>
            <Row gap={12} justify="space-between" align="center">
              <Text>Create Webhook</Text>
              <Row gap={12}>
                <Button
                  variant="text"
                  size="md"
                  onPress={() => router.back()}
                  disabled={createWebhook.isPending}
                >
                  Cancel
                </Button>
                <Button
                  variant="filled"
                  size="md"
                  onPress={handleSubmit}
                  disabled={createWebhook.isPending}
                >
                  {createWebhook.isPending ? "Creating..." : "Create Webhook"}
                </Button>
              </Row>
            </Row>

            {/* Endpoint Configuration */}
            <Card padding="lg">
              <Stack gap={20}>
                <Text>Endpoint Configuration</Text>

                <Stack gap={8}>
                  <Text>Endpoint URL *</Text>
                  <Input
                    value={url}
                    onChangeText={setUrl}
                    placeholder="https://api.example.com/webhooks"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <Text color="$gray10">
                    Must be a valid HTTPS URL. Your endpoint will receive POST
                    requests.
                  </Text>
                </Stack>

                <Stack gap={8}>
                  <Text>Description (Optional)</Text>
                  <Input
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Production webhook for order notifications"
                    multiline
                    numberOfLines={3}
                  />
                </Stack>
              </Stack>
            </Card>

            {/* Event Selection */}
            <Card padding="lg">
              <Stack gap={20}>
                <Text>Event Subscriptions *</Text>
                <Text color="$gray11">
                  Select the events you want to receive notifications for
                </Text>

                <Stack gap={24}>
                  {Object.entries(eventsByCategory).map(
                    ([category, events]) => (
                      <Stack key={category} gap={12}>
                        <Text color="$gray11" style={{ letterSpacing: 0.5 }}>
                          {category}
                        </Text>
                        <Stack gap={8}>
                          {events.map((event) => (
                            <Pressable
                              key={event.value}
                              onPress={() =>
                                handleToggleEvent(
                                  event.value as WebhookEventType
                                )
                              }
                            >
                              <Row gap={12} align="center" padding="sm">
                                <Checkbox
                                  checked={selectedEvents.has(
                                    event.value as WebhookEventType
                                  )}
                                  onChange={() =>
                                    handleToggleEvent(
                                      event.value as WebhookEventType
                                    )
                                  }
                                />
                                <Stack gap={4}>
                                  <Text style={{ fontFamily: "monospace" }}>
                                    {event.value}
                                  </Text>
                                  <Text color="$gray11">{event.label}</Text>
                                </Stack>
                              </Row>
                            </Pressable>
                          ))}
                        </Stack>
                      </Stack>
                    )
                  )}
                </Stack>

                <Text color="$gray10">
                  {selectedEvents.size} event
                  {selectedEvents.size !== 1 ? "s" : ""} selected
                </Text>
              </Stack>
            </Card>

            {/* Configuration Info */}
            <Card padding="lg">
              <Stack gap={8}>
                <Text>Configuration Details</Text>
                <Row justify="space-between">
                  <Text color="$gray11">Max Retries:</Text>
                  <Text>3 attempts</Text>
                </Row>
                <Row justify="space-between">
                  <Text color="$gray11">Retry Backoff:</Text>
                  <Text>1min, 5min, 15min</Text>
                </Row>
                <Row justify="space-between">
                  <Text color="$gray11">Timeout:</Text>
                  <Text>10 seconds</Text>
                </Row>
                <Row justify="space-between">
                  <Text color="$gray11">Signature:</Text>
                  <Text>HMAC-SHA256</Text>
                </Row>
              </Stack>
            </Card>
          </Stack>
        </ScrollView>
      }
    />
  );
}
