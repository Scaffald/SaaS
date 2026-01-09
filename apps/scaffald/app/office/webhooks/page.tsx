/**
 * Webhooks Management Page
 * Developer Portal page for managing webhook endpoints
 */

import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native'
import { useState } from 'react'
import { Link, useRouter } from 'expo-router'
import { api } from '@scf/core/utils/api'
import { OfficePageLayout } from '@scf/core/features/office/components/OfficePageLayout'
import { Button, Card, Badge, colors, spacing, typography } from '@unicornlove/ui'
import { ROUTES, buildPath } from '@scf/core/constants/routes'
import type { WebhookConfig } from '@scf/schemas'

export default function WebhooksPage() {
  const router = useRouter()
  const [selectedWebhook, setSelectedWebhook] = useState<string | null>(null)

  // Fetch webhooks
  const { data: webhooksData, isLoading } = api.webhooks.list.useQuery()

  const webhooks = webhooksData?.data ?? []

  return (
    <OfficePageLayout
      title="Webhooks"
      description="Manage webhook endpoints for real-time event notifications"
      breadcrumbs={[
        { label: 'Office', href: ROUTES.OFFICE.path },
        { label: 'Webhooks', href: ROUTES.OFFICE.WEBHOOKS.path },
      ]}
      actions={
        <Link href={ROUTES.OFFICE.WEBHOOKS.CREATE.path} asChild>
          <Button variant="primary" size="md">
            Create Webhook
          </Button>
        </Link>
      }
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Documentation Banner */}
        <Card style={styles.docCard}>
          <View style={styles.docContent}>
            <Text style={styles.docTitle}>Getting Started with Webhooks</Text>
            <Text style={styles.docText}>
              Webhooks allow you to receive real-time notifications when events occur in your
              organization. Configure endpoints to receive POST requests when jobs are created,
              applications are submitted, and more.
            </Text>
            <Pressable style={styles.docLink}>
              <Text style={styles.docLinkText}>View Documentation →</Text>
            </Pressable>
          </View>
        </Card>

        {/* Webhooks List */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading webhooks...</Text>
          </View>
        ) : webhooks.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No webhooks configured</Text>
            <Text style={styles.emptyText}>
              Create your first webhook endpoint to start receiving real-time event notifications.
            </Text>
            <Link href={ROUTES.OFFICE.WEBHOOKS.CREATE.path} asChild>
              <Button variant="primary" size="md" style={{ marginTop: spacing[16] }}>
                Create Your First Webhook
              </Button>
            </Link>
          </Card>
        ) : (
          <View style={styles.webhooksList}>
            {webhooks.map((webhook: WebhookConfig) => (
              <WebhookCard
                key={webhook.id}
                webhook={webhook}
                isSelected={selectedWebhook === webhook.id}
                onPress={() => setSelectedWebhook(webhook.id)}
                onViewDetails={() => router.push(buildPath(ROUTES.OFFICE.WEBHOOKS.DETAIL, { id: webhook.id }))}
              />
            ))}
          </View>
        )}

        {/* Event Types Reference */}
        {webhooks.length > 0 && (
          <Card style={styles.referenceCard}>
            <Text style={styles.referenceTitle}>Available Event Types</Text>
            <Text style={styles.referenceText}>
              Subscribe to these events to receive notifications:
            </Text>
            <View style={styles.eventTypesList}>
              <EventTypeBadge label="job.created" category="Jobs" />
              <EventTypeBadge label="job.published" category="Jobs" />
              <EventTypeBadge label="application.submitted" category="Applications" />
              <EventTypeBadge label="application.accepted" category="Applications" />
              <EventTypeBadge label="inquiry.created" category="Inquiries" />
              <EventTypeBadge label="background_check.completed" category="Background Checks" />
            </View>
            <Pressable style={styles.viewAllLink}>
              <Text style={styles.viewAllLinkText}>View All Event Types →</Text>
            </Pressable>
          </Card>
        )}
      </ScrollView>
    </OfficePageLayout>
  )
}

interface WebhookCardProps {
  webhook: WebhookConfig
  isSelected: boolean
  onPress: () => void
  onViewDetails: () => void
}

function WebhookCard({ webhook, isSelected, onPress, onViewDetails }: WebhookCardProps) {
  return (
    <Pressable onPress={onPress}>
      <Card
        style={[
          styles.webhookCard,
          isSelected && styles.webhookCardSelected,
        ]}
      >
        <View style={styles.webhookCardHeader}>
          <View style={styles.webhookCardInfo}>
            <View style={styles.webhookCardTitleRow}>
              <Text style={styles.webhookCardTitle}>{webhook.url}</Text>
              <Badge
                variant={webhook.is_active ? 'success' : 'neutral'}
                label={webhook.is_active ? 'Active' : 'Inactive'}
              />
            </View>
            {webhook.description && (
              <Text style={styles.webhookCardDescription} numberOfLines={2}>
                {webhook.description}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.webhookCardMeta}>
          <View style={styles.webhookCardMetaItem}>
            <Text style={styles.webhookCardMetaLabel}>Events</Text>
            <Text style={styles.webhookCardMetaValue}>{webhook.events.length}</Text>
          </View>
          <View style={styles.webhookCardMetaItem}>
            <Text style={styles.webhookCardMetaLabel}>Success Rate</Text>
            <Text style={styles.webhookCardMetaValue}>
              {webhook.total_deliveries > 0
                ? `${Math.round((webhook.successful_deliveries / webhook.total_deliveries) * 100)}%`
                : 'N/A'}
            </Text>
          </View>
          <View style={styles.webhookCardMetaItem}>
            <Text style={styles.webhookCardMetaLabel}>Last Delivery</Text>
            <Text style={styles.webhookCardMetaValue}>
              {webhook.last_delivery_at
                ? new Date(webhook.last_delivery_at).toLocaleDateString()
                : 'Never'}
            </Text>
          </View>
        </View>

        <View style={styles.webhookCardActions}>
          <Button variant="ghost" size="sm" onPress={onViewDetails}>
            View Details
          </Button>
        </View>
      </Card>
    </Pressable>
  )
}

interface EventTypeBadgeProps {
  label: string
  category: string
}

function EventTypeBadge({ label, category }: EventTypeBadgeProps) {
  return (
    <View style={styles.eventTypeBadge}>
      <Text style={styles.eventTypeLabel}>{label}</Text>
      <Text style={styles.eventTypeCategory}>{category}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing[24],
    gap: spacing[24],
  },
  docCard: {
    padding: spacing[20],
    backgroundColor: colors.primary[50],
  },
  docContent: {
    gap: spacing[12],
  },
  docTitle: {
    fontFamily: typography.h6.fontFamily,
    fontSize: typography.h6.fontSize,
    fontWeight: typography.h6.fontWeight,
    color: colors.text.light.primary,
  },
  docText: {
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
    color: colors.text.light.secondary,
    lineHeight: typography.body.lineHeight,
  },
  docLink: {
    marginTop: spacing[8],
  },
  docLinkText: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: typography.body.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
    color: colors.primary[600],
  },
  loadingContainer: {
    padding: spacing[40],
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
    color: colors.text.light.tertiary,
  },
  emptyCard: {
    padding: spacing[40],
    alignItems: 'center',
  },
  emptyTitle: {
    fontFamily: typography.h6.fontFamily,
    fontSize: typography.h6.fontSize,
    fontWeight: typography.h6.fontWeight,
    color: colors.text.light.primary,
    marginBottom: spacing[8],
  },
  emptyText: {
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
    color: colors.text.light.secondary,
    textAlign: 'center',
    maxWidth: 400,
  },
  webhooksList: {
    gap: spacing[16],
  },
  webhookCard: {
    padding: spacing[20],
    gap: spacing[16],
  },
  webhookCardSelected: {
    borderColor: colors.primary[500],
    borderWidth: 2,
  },
  webhookCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  webhookCardInfo: {
    flex: 1,
    gap: spacing[8],
  },
  webhookCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[12],
  },
  webhookCardTitle: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: typography.body.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
    color: colors.text.light.primary,
    flex: 1,
  },
  webhookCardDescription: {
    fontFamily: typography.body.fontFamily,
    fontSize: typography.small.fontSize,
    color: colors.text.light.secondary,
    lineHeight: typography.small.lineHeight,
  },
  webhookCardMeta: {
    flexDirection: 'row',
    gap: spacing[24],
    paddingTop: spacing[12],
    borderTopWidth: 1,
    borderTopColor: colors.border.light.default,
  },
  webhookCardMetaItem: {
    gap: spacing[4],
  },
  webhookCardMetaLabel: {
    fontFamily: typography.body.fontFamily,
    fontSize: typography.small.fontSize,
    color: colors.text.light.tertiary,
  },
  webhookCardMetaValue: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: typography.body.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
    color: colors.text.light.primary,
  },
  webhookCardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  referenceCard: {
    padding: spacing[20],
  },
  referenceTitle: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: typography.body.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
    color: colors.text.light.primary,
    marginBottom: spacing[8],
  },
  referenceText: {
    fontFamily: typography.body.fontFamily,
    fontSize: typography.small.fontSize,
    color: colors.text.light.secondary,
    marginBottom: spacing[16],
  },
  eventTypesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[8],
  },
  eventTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[8],
    paddingHorizontal: spacing[12],
    paddingVertical: spacing[6],
    backgroundColor: colors.bg.light.subtle,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.light[200],
  },
  eventTypeLabel: {
    fontFamily: 'monospace',
    fontSize: typography.small.fontSize,
    color: colors.text.light.primary,
  },
  eventTypeCategory: {
    fontFamily: typography.body.fontFamily,
    fontSize: typography.caption.fontSize,
    color: colors.text.light.tertiary,
  },
  viewAllLink: {
    marginTop: spacing[16],
  },
  viewAllLinkText: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: typography.small.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
    color: colors.primary[600],
  },
})
