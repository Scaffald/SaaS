/**
 * Connected Apps Panel Component
 * CCPA Compliance Implementation
 *
 * Displays third-party applications that have access to user data
 * with options to view permissions and revoke access
 */

import { Text, Row, Stack, Button, useThemeContext } from "@scaffald/ui";
import { colors } from "@scaffald/ui/tokens";

/**
 * Connected app structure
 */
export interface ConnectedApp {
  id: string;
  app_id: string;
  app_name: string;
  app_icon_url?: string;
  description?: string;
  connected_at: string;
  last_accessed_at?: string;
  permissions: string[];
  data_categories: string[];
  can_revoke: boolean;
}

/**
 * Props for ConnectedAppsPanel
 */
interface ConnectedAppsPanelProps {
  apps: ConnectedApp[];
  onRevoke?: (appId: string) => void;
  onViewDetails?: (appId: string) => void;
}

/**
 * Permission badge colors based on sensitivity
 */
function getPermissionColors(theme: 'light' | 'dark'): Record<string, { bg: string; text: string }> {
  return {
    read: { bg: theme === 'dark' ? colors.info[900] : colors.info[100], text: colors.info[700] },
    write: { bg: theme === 'dark' ? colors.warning[900] : colors.warning[100], text: colors.warning[700] },
    delete: { bg: theme === 'dark' ? colors.error[900] : colors.error[50], text: colors.error[600] },
    default: { bg: colors.bg[theme].subtle, text: colors.text[theme].secondary },
  };
}

/**
 * Get color for permission type
 */
function getPermissionColor(permission: string, theme: 'light' | 'dark'): { bg: string; text: string } {
  const permColors = getPermissionColors(theme);
  const lowerPerm = permission.toLowerCase();
  if (lowerPerm.includes("delete") || lowerPerm.includes("remove")) {
    return permColors.delete;
  }
  if (
    lowerPerm.includes("write") ||
    lowerPerm.includes("create") ||
    lowerPerm.includes("update")
  ) {
    return permColors.write;
  }
  if (lowerPerm.includes("read") || lowerPerm.includes("view")) {
    return permColors.read;
  }
  return permColors.default;
}

/**
 * Format date string
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Format relative time
 */
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

/**
 * Permission badge
 */
function PermissionBadge({ permission }: { permission: string }) {
  const { theme } = useThemeContext();
  const t = theme === 'dark' ? 'dark' : 'light';
  const permColor = getPermissionColor(permission, t);
  return (
    <Row
      backgroundColor={permColor.bg}
      paddingHorizontal={8}
      paddingVertical={4}
      borderRadius={8}
    >
      <Text style={{ color: permColor.text }}>{permission}</Text>
    </Row>
  );
}

/**
 * App icon placeholder
 */
function AppIconPlaceholder({ name }: { name: string }) {
  const { theme } = useThemeContext();
  const t = theme === 'dark' ? 'dark' : 'light';
  const initials = name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Stack
      width={48}
      height={48}
      borderRadius={12}
      backgroundColor={colors.bg[t].subtle}
      align="center"
      justify="center"
    >
      <Text style={{ color: colors.text[t].secondary }}>{initials}</Text>
    </Stack>
  );
}

/**
 * Single connected app card
 */
function AppCard({
  app,
  onRevoke,
  onViewDetails,
}: {
  app: ConnectedApp;
  onRevoke?: (appId: string) => void;
  onViewDetails?: (appId: string) => void;
}) {
  const { theme } = useThemeContext();
  const t = theme === 'dark' ? 'dark' : 'light';
  return (
    <Stack
      padding="md"
      backgroundColor={colors.bg[t].muted}
      borderRadius={12}
      borderWidth={1}
      borderColor={colors.border[t].default}
      gap={12}
    >
      {/* App header */}
      <Row gap={12} align="flex-start">
        <AppIconPlaceholder name={app.app_name} />
        <Stack flex={1} gap={4}>
          <Text>{app.app_name}</Text>
          {app.description && (
            <Text style={{ color: colors.text[t].secondary }}>{app.description}</Text>
          )}
        </Stack>
      </Row>

      {/* Connection info */}
      <Row gap={16} wrap>
        <Stack gap={4}>
          <Text style={{ color: colors.text[t].secondary }}>Connected</Text>
          <Text>{formatDate(app.connected_at)}</Text>
        </Stack>
        {app.last_accessed_at && (
          <Stack gap={4}>
            <Text style={{ color: colors.text[t].secondary }}>Last Access</Text>
            <Text>{formatRelativeTime(app.last_accessed_at)}</Text>
          </Stack>
        )}
      </Row>

      {/* Permissions */}
      <Stack gap={8}>
        <Text style={{ color: colors.text[t].secondary }}>Permissions</Text>
        <Row gap={4} wrap>
          {app.permissions.slice(0, 5).map((permission) => (
            <PermissionBadge key={permission} permission={permission} />
          ))}
          {app.permissions.length > 5 && (
            <Row
              backgroundColor={colors.bg[t].subtle}
              paddingHorizontal={8}
              paddingVertical={4}
              borderRadius={8}
            >
              <Text style={{ color: colors.text[t].secondary }}>
                +{app.permissions.length - 5} more
              </Text>
            </Row>
          )}
        </Row>
      </Stack>

      {/* Data categories */}
      <Stack gap={8}>
        <Text style={{ color: colors.text[t].secondary }}>Data Categories Accessed</Text>
        <Text style={{ color: colors.text[t].secondary }}>
          {app.data_categories.join(" • ")}
        </Text>
      </Stack>

      {/* Actions */}
      <Row gap={8} justify="flex-end" style={{ marginTop: 4 }}>
        <Button
          size="sm"
          variant="outline"
          onPress={() => onViewDetails?.(app.id)}
        >
          View Details
        </Button>
        {app.can_revoke && (
          <Button size="sm" color="error" onPress={() => onRevoke?.(app.id)}>
            Revoke Access
          </Button>
        )}
      </Row>
    </Stack>
  );
}

/**
 * Empty state component
 */
function EmptyState() {
  const { theme } = useThemeContext();
  const t = theme === 'dark' ? 'dark' : 'light';
  return (
    <Stack
      padding="xl"
      backgroundColor={colors.bg[t].muted}
      borderRadius={12}
      borderWidth={1}
      borderColor={colors.border[t].default}
      align="center"
      gap={8}
    >
      <Text style={{ color: colors.text[t].secondary }}>No Connected Applications</Text>
      <Text style={{ color: colors.text[t].secondary, textAlign: "center" }}>
        When you connect third-party applications to your account, they will
        appear here so you can manage their access to your data.
      </Text>
    </Stack>
  );
}

/**
 * Connected Apps Panel Component
 *
 * Displays all third-party applications with access to user data
 */
export function ConnectedAppsPanel({
  apps,
  onRevoke,
  onViewDetails,
}: ConnectedAppsPanelProps) {
  const { theme } = useThemeContext();
  const t = theme === 'dark' ? 'dark' : 'light';
  if (!apps || apps.length === 0) {
    return <EmptyState />;
  }

  return (
    <Stack gap={12}>
      {/* Summary */}
      <Row
        padding="sm"
        backgroundColor={t === 'dark' ? colors.warning[900] : colors.warning[50]}
        borderRadius={12}
        gap={8}
        align="center"
      >
        <Text style={{ color: colors.warning[700] }}>
          {apps.length} application{apps.length === 1 ? "" : "s"} currently have
          access to your data. You can revoke access at any time.
        </Text>
      </Row>

      {/* App cards */}
      {apps.map((app) => (
        <AppCard
          key={app.id}
          app={app}
          onRevoke={onRevoke}
          onViewDetails={onViewDetails}
        />
      ))}

      {/* Info text */}
      <Text style={{ color: colors.text[t].secondary, marginTop: 8 }}>
        Revoking access will immediately prevent the application from accessing
        your data. Some applications may require you to re-authorize access to
        restore functionality.
      </Text>
    </Stack>
  );
}

export default ConnectedAppsPanel;
