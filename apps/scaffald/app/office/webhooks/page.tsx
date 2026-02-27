/**
 * Webhooks Management Page
 * Developer Portal page for managing webhook endpoints
 */

import { useState } from "react";
import { Link, useRouter } from "expo-router";
import { Pressable, ScrollView } from "react-native";
import { useWebhooks } from "@scf/core/utils/webhooks-sdk-hooks";
import { OfficeLayout } from "@scf/core/components/layouts/OfficeLayout";
import { Button, Card, Row, Stack, Text } from "@scaffald/ui";
import { ROUTES, buildPath } from "@scf/core/constants/routes";
import type { Webhook } from "@scaffald/sdk/types/webhooks-management";

export default function WebhooksPage() {
  const router = useRouter();
  const [selectedWebhook, setSelectedWebhook] = useState<string | null>(null);

  // Fetch webhooks
  const { data: webhooksData, isLoading } = useWebhooks();

  const webhooks = webhooksData?.data ?? [];

  return (
    <OfficeLayout
      showBreadcrumb
      breadcrumbItems={[
        { label: "Office", href: ROUTES.OFFICE.path },
        { label: "Webhooks", href: ROUTES.OFFICE.WEBHOOKS.path },
      ]}
      leftContent={
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <Stack gap={16}>
            <Row justify="space-between" align="center">
              <Text>Webhooks</Text>
              <Link href={ROUTES.OFFICE.WEBHOOKS.CREATE.path} asChild>
                <Button variant="filled" size="md">
                  Create Webhook
                </Button>
              </Link>
            </Row>

            {/* Documentation Banner */}
            <Card padding="lg">
              <Stack gap={12}>
                <Text>Getting Started with Webhooks</Text>
                <Text color="$gray11">
                  Webhooks allow you to receive real-time notifications when
                  events occur in your organization. Configure endpoints to
                  receive POST requests when jobs are created, applications are
                  submitted, and more.
                </Text>
                <Pressable>
                  <Row>
                    <Text color="$blue10">View Documentation →</Text>
                  </Row>
                </Pressable>
              </Stack>
            </Card>

            {/* Webhooks List */}
            {isLoading ? (
              <Stack padding="xl" align="center" justify="center">
                <Text color="$gray11">Loading webhooks...</Text>
              </Stack>
            ) : webhooks.length === 0 ? (
              <Card padding="xl">
                <Stack align="center" gap={16}>
                  <Text>No webhooks configured</Text>
                  <Text color="$gray11" style={{ maxWidth: 400 }}>
                    Create your first webhook endpoint to start receiving
                    real-time event notifications.
                  </Text>
                  <Link href={ROUTES.OFFICE.WEBHOOKS.CREATE.path} asChild>
                    <Button variant="filled" size="md">
                      Create Your First Webhook
                    </Button>
                  </Link>
                </Stack>
              </Card>
            ) : (
              <Stack gap={12}>
                {webhooks.map((webhook: Webhook) => (
                  <WebhookCard
                    key={webhook.id}
                    webhook={webhook}
                    isSelected={selectedWebhook === webhook.id}
                    onPress={() => setSelectedWebhook(webhook.id)}
                    onViewDetails={() =>
                      router.push(
                        buildPath(
                          ROUTES.OFFICE.WEBHOOKS
                            .DETAIL as unknown as Parameters<
                            typeof buildPath
                          >[0],
                          { id: webhook.id }
                        )
                      )
                    }
                  />
                ))}
              </Stack>
            )}

            {/* Event Types Reference */}
            {webhooks.length > 0 && (
              <Card padding="lg">
                <Stack gap={8}>
                  <Text>Available Event Types</Text>
                  <Text color="$gray11">
                    Subscribe to these events to receive notifications:
                  </Text>
                  <Row gap={8}>
                    <EventTypeBadge label="job.created" category="Jobs" />
                    <EventTypeBadge label="job.published" category="Jobs" />
                    <EventTypeBadge
                      label="application.submitted"
                      category="Applications"
                    />
                    <EventTypeBadge
                      label="application.accepted"
                      category="Applications"
                    />
                    <EventTypeBadge
                      label="inquiry.created"
                      category="Inquiries"
                    />
                    <EventTypeBadge
                      label="background_check.completed"
                      category="Background Checks"
                    />
                  </Row>
                  <Pressable>
                    <Row>
                      <Text color="$blue10">View All Event Types →</Text>
                    </Row>
                  </Pressable>
                </Stack>
              </Card>
            )}
          </Stack>
        </ScrollView>
      }
    />
  );
}

interface WebhookCardProps {
  webhook: Webhook & {
    total_deliveries?: number;
    successful_deliveries?: number;
    last_delivery_at?: string;
  };
  isSelected: boolean;
  onPress: () => void;
  onViewDetails: () => void;
}

function WebhookCard({
  webhook,
  isSelected: _isSelected,
  onPress,
  onViewDetails,
}: WebhookCardProps) {
  return (
    <Card padding="md" pressable onPress={onPress}>
      <Stack gap={16}>
        <Stack gap={8}>
          <Row gap={12} align="center" justify="space-between">
            <Text>{webhook.url}</Text>
            <Text
              size="sm"
              style={{
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 4,
                backgroundColor: webhook.is_active ? "#10b981" : "#6b7280",
                color: "#ffffff",
              }}
            >
              {webhook.is_active ? "Active" : "Inactive"}
            </Text>
          </Row>
          {webhook.description && (
            <Text color="$gray11">{webhook.description}</Text>
          )}
        </Stack>

        <Row gap={24}>
          <Stack gap={4}>
            <Text color="$gray11">Events</Text>
            <Text>{webhook.events.length}</Text>
          </Stack>
          <Stack gap={4}>
            <Text color="$gray11">Success Rate</Text>
            <Text>
              {(webhook.total_deliveries ?? 0) > 0
                ? `${Math.round(
                    ((webhook.successful_deliveries ?? 0) /
                      (webhook.total_deliveries ?? 1)) *
                      100
                  )}%`
                : "N/A"}
            </Text>
          </Stack>
          <Stack gap={4}>
            <Text color="$gray11">Last Delivery</Text>
            <Text>
              {webhook.last_delivery_at
                ? new Date(webhook.last_delivery_at).toLocaleDateString()
                : "Never"}
            </Text>
          </Stack>
        </Row>

        <Row>
          <Button variant="text" size="sm" onPress={onViewDetails}>
            View Details
          </Button>
        </Row>
      </Stack>
    </Card>
  );
}

interface EventTypeBadgeProps {
  label: string;
  category: string;
}

function EventTypeBadge({ label, category }: EventTypeBadgeProps) {
  return (
    <Stack padding={8} gap={4}>
      <Text style={{ fontFamily: "monospace" }} color="$gray12">
        {label}
      </Text>
      <Text color="$gray10">{category}</Text>
    </Stack>
  );
}
