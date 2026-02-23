import { NotificationTag, useThemeContext } from "@scaffald/ui";
import {
  useNotificationDeliveries,
  useNotificationDigestQueue,
} from "@scf/core/utils/notifications-admin-sdk-hooks";
import { AlertCircle, RefreshCw } from "lucide-react-native";
import { useState } from "react";
import {
  Button,
  ScrollView,
  Separator,
  Spinner,
  Text,
  Row,
  Stack,
} from "@scaffald/ui";
import { colors } from "@scaffald/ui/tokens";

interface NotificationDelivery {
  id: string;
  channel: string;
  status: string;
  attempts: number;
  last_error?: string | null;
  updated_at?: string | null;
  notification?: {
    severity?: "info" | "important" | "critical";
    title?: string | null;
    preview?: string | null;
    message?: string | null;
  } | null;
}

interface DigestQueueItem {
  id: string;
  user_id: string;
  type: string;
  bucket: string;
  count: number;
  channels?: string[] | null;
  last_event_at?: string | null;
}

const DELIVERY_STATUSES = [
  "all",
  "queued",
  "sending",
  "sent",
  "delivered",
  "failed",
  "bounce",
  "blocked",
] as const;

type DeliveryStatus = (typeof DELIVERY_STATUSES)[number];

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

function formatChannel(channel: string) {
  switch (channel) {
    case "email":
      return "Email";
    case "sms":
      return "SMS";
    case "push":
      return "Push";
    default:
      return channel;
  }
}

export function OfficeNotificationsConsole() {
  const { theme } = useThemeContext();
  const [status, setStatus] = useState<DeliveryStatus>("queued");

  const deliveriesQuery = useNotificationDeliveries({ status, limit: 50 });
  const digestQuery = useNotificationDigestQueue({ limit: 50 });

  const deliveries = (deliveriesQuery.data ?? []) as NotificationDelivery[];
  const digestItems = (digestQuery.data ?? []) as DigestQueueItem[];

  return (
    <Stack gap={24}>
      <Stack gap={8}>
        <Text>Notification Operations</Text>
        <Text style={{ color: colors.text[theme].secondary }}>
          Monitor delivery workers, inspect failures, and triage digest
          backlogs.
        </Text>
      </Stack>

      <Stack gap={12}>
        <Row justify="space-between" align="center">
          <Text>Delivery Queue</Text>
          <Button
            size="sm"
            variant="outline"
            color="primary"
            iconStart={RefreshCw}
            onPress={() => deliveriesQuery.refetch()}
            disabled={deliveriesQuery.isRefetching}
          >
            Refresh
          </Button>
        </Row>

        <Row gap={8} wrap>
          {DELIVERY_STATUSES.map((value) => {
            const isActive = status === value;

            return (
              <Button
                key={value}
                size="sm"
                variant={isActive ? "filled" : "outline"}
                color={isActive ? "primary" : "gray"}
                onPress={() => {
                  setStatus(value);
                  deliveriesQuery.refetch();
                }}
              >
                {value.charAt(0).toUpperCase() + value.slice(1)}
              </Button>
            );
          })}
        </Row>

        {deliveriesQuery.isLoading ? (
          <Stack align="center" gap={12} marginTop={16}>
            <Spinner size="lg" color="gray" />
            <Text style={{ color: colors.text[theme].secondary }}>
              Loading deliveries…
            </Text>
          </Stack>
        ) : deliveries.length === 0 ? (
          <Stack gap={12} align="center" marginTop={16}>
            <AlertCircle size={32} color={colors.text[theme].secondary} />
            <Text style={{ color: colors.text[theme].secondary }}>
              No deliveries match this filter.
            </Text>
          </Stack>
        ) : (
          <Stack
            borderWidth={1}
            borderColor={colors.border[theme].default}
            borderRadius={16}
            style={{ overflow: "hidden" }}
          >
            <Row
              style={{ backgroundColor: colors.bg[theme].subtle }}
              padding="sm"
              gap={12}
            >
              <Text style={{ flex: 2 }}>Notification</Text>
              <Text style={{ flex: 1 }}>Channel</Text>
              <Text style={{ flex: 1 }}>Status</Text>
              <Text style={{ flex: 1 }}>Attempts</Text>
              <Text style={{ flex: 2 }}>Last error</Text>
              <Text style={{ flex: 1 }}>Updated</Text>
            </Row>

            {deliveries.map((delivery, index) => {
              const notification = delivery.notification;
              const severity = notification?.severity ?? "info";

              return (
                <Stack
                  key={delivery.id}
                  style={{
                    backgroundColor:
                      index % 2 === 0
                        ? colors.bg[theme].default
                        : colors.bg[theme].subtle,
                  }}
                  padding="sm"
                >
                  <Row gap={12} align="center">
                    <Stack flex={2} gap={4}>
                      <Row gap={8} align="center">
                        <Text style={{ color: colors.text[theme].secondary }}>
                          {notification?.title ?? "Untitled notification"}
                        </Text>
                        <NotificationTag size="sm">
                          {severity.toUpperCase()}
                        </NotificationTag>
                      </Row>
                      <Text style={{ color: colors.text[theme].secondary }}>
                        {notification?.preview ?? notification?.message ?? "—"}
                      </Text>
                    </Stack>
                    <Text
                      style={{ flex: 1, color: colors.text[theme].secondary }}
                    >
                      {formatChannel(delivery.channel)}
                    </Text>
                    <Stack style={{ flex: 1 }}>
                      <NotificationTag size="md">
                        {delivery.status}
                      </NotificationTag>
                    </Stack>
                    <Text
                      style={{ flex: 1, color: colors.text[theme].secondary }}
                    >
                      {delivery.attempts}
                    </Text>
                    <Text
                      style={{ flex: 2, color: colors.text[theme].secondary }}
                    >
                      {delivery.last_error ?? "—"}
                    </Text>
                    <Text
                      style={{ flex: 1, color: colors.text[theme].secondary }}
                    >
                      {formatDate(delivery.updated_at)}
                    </Text>
                  </Row>
                </Stack>
              );
            })}
          </Stack>
        )}
      </Stack>

      <Separator style={{ backgroundColor: colors.bg[theme].muted }} />

      <Stack gap={12}>
        <Row justify="space-between" align="center">
          <Text>Digest Backlog</Text>
          <Button
            size="sm"
            variant="outline"
            color="primary"
            iconStart={RefreshCw}
            onPress={() => digestQuery.refetch()}
            disabled={digestQuery.isRefetching}
          >
            Refresh
          </Button>
        </Row>

        {digestQuery.isLoading ? (
          <Stack align="center" gap={12} marginTop={16}>
            <Spinner size="lg" color="gray" />
            <Text style={{ color: colors.text[theme].secondary }}>
              Loading digest queue…
            </Text>
          </Stack>
        ) : digestItems.length === 0 ? (
          <Stack gap={12} align="center" marginTop={16}>
            <AlertCircle size={32} color={colors.text[theme].secondary} />
            <Text style={{ color: colors.text[theme].secondary }}>
              Digest queue is empty.
            </Text>
          </Stack>
        ) : (
          <Stack
            borderWidth={1}
            borderColor={colors.border[theme].default}
            borderRadius={16}
            style={{ overflow: "hidden" }}
          >
            <Row
              style={{ backgroundColor: colors.bg[theme].subtle }}
              padding="sm"
              gap={12}
            >
              <Text style={{ flex: 1 }}>User ID</Text>
              <Text style={{ flex: 1 }}>Type</Text>
              <Text style={{ flex: 1 }}>Bucket</Text>
              <Text style={{ flex: 1 }}>Count</Text>
              <Text style={{ flex: 2 }}>Channels</Text>
              <Text style={{ flex: 1 }}>Last event</Text>
            </Row>

            {digestItems.map((item, index) => (
              <Row
                key={item.id}
                gap={12}
                padding="sm"
                style={{
                  backgroundColor:
                    index % 2 === 0
                      ? colors.bg[theme].default
                      : colors.bg[theme].subtle,
                }}
                align="flex-start"
              >
                <Text style={{ flex: 1, color: colors.text[theme].secondary }}>
                  {item.user_id}
                </Text>
                <Text style={{ flex: 1, color: colors.text[theme].secondary }}>
                  {item.type}
                </Text>
                <Text style={{ flex: 1, color: colors.text[theme].secondary }}>
                  {item.bucket}
                </Text>
                <Text style={{ flex: 1, color: colors.text[theme].secondary }}>
                  {item.count}
                </Text>
                <Text style={{ flex: 2, color: colors.text[theme].secondary }}>
                  {Array.isArray(item.channels) && item.channels.length > 0
                    ? item.channels.join(", ")
                    : "—"}
                </Text>
                <Text style={{ flex: 1, color: colors.text[theme].secondary }}>
                  {formatDate(item.last_event_at)}
                </Text>
              </Row>
            ))}
          </Stack>
        )}
      </Stack>
    </Stack>
  );
}

export function OfficeNotificationsConsoleScrollWrapper() {
  return (
    <ScrollView style={{ paddingHorizontal: 24, paddingVertical: 24 }}>
      <OfficeNotificationsConsole />
    </ScrollView>
  );
}
