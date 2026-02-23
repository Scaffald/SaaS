import { Popover, PopoverHeader, PopoverContent } from "@scaffald/ui";
import { AlertCircle, Bell, Info, ShieldAlert } from "lucide-react-native";
import type { Href } from "expo-router";
import { useRouter } from "expo-router";
import {
  type ElementRef,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { ScrollView } from "react-native";
import {
  Button,
  Card,
  Separator,
  Spinner,
  type StackProps,
  Text,
  type TextProps,
  Row,
  Stack,
} from "@scaffald/ui";

export interface NotificationItem {
  id: string;
  type: string;
  severity: "info" | "important" | "critical";
  title: string;
  preview: string;
  createdAt: string;
  read: boolean;
  ctaUrl?: string | null;
  ctaLabel?: string | null;
  channels: string[];
  metadata?: {
    notification_type?: string;
    site_id?: string;
    overlapping_site_id?: string;
    overlap_percent?: number;
    threshold?: number;
    [key: string]: unknown;
  } | null;
}

type ButtonRef = ElementRef<typeof Button>;

const SEVERITY_PILL_STYLES = {
  critical: { backgroundColor: "$red4", color: "$red11" },
  important: { backgroundColor: "$yellow4", color: "$yellow11" },
  info: { backgroundColor: "$blue4", color: "$blue11" },
} as const satisfies Record<
  NotificationItem["severity"],
  { backgroundColor: StackProps["backgroundColor"]; color: TextProps["color"] }
>;

interface PillProps {
  label: string;
  backgroundColor: StackProps["backgroundColor"];
  color: TextProps["color"];
}

const CHANNEL_PILL_STYLE = {
  backgroundColor: "$color3",
  color: "$color11",
} as const satisfies Pick<PillProps, "backgroundColor" | "color">;

function Pill({ label, backgroundColor, color }: PillProps) {
  return (
    <Row
      backgroundColor={backgroundColor}
      paddingHorizontal="xs"
      paddingVertical="xs"
      borderRadius={12}
      align="center"
    >
      <Text color={color}>{label}</Text>
    </Row>
  );
}

interface NotificationPopoverProps {
  /**
   * Array of notifications to display
   */
  notifications: NotificationItem[];
  /**
   * Unread count to display on badge
   */
  unreadCount: number;
  /**
   * Loading state
   */
  isLoading?: boolean;
  /**
   * Callback when notification is clicked
   */
  onNotificationClick?: (notification: NotificationItem) => void;
  /**
   * Callback to mark notification as read
   */
  onMarkAsRead?: (notificationId: string) => void;
}

/**
 * Format relative time (e.g., "2 hours ago", "1 day ago")
 */
function formatRelativeTime(dateString: string): string {
  if (!dateString) return "";

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return "Just now";
  if (diffMinutes < 60)
    return `${diffMinutes} ${diffMinutes === 1 ? "minute" : "minutes"} ago`;
  if (diffHours < 24)
    return `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} ${weeks === 1 ? "week" : "weeks"} ago`;
  }
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} ${months === 1 ? "month" : "months"} ago`;
  }
  const years = Math.floor(diffDays / 365);
  return `${years} ${years === 1 ? "year" : "years"} ago`;
}

/**
 * Get notification icon based on type
 */
function getNotificationIcon(severity: NotificationItem["severity"]) {
  switch (severity) {
    case "critical":
      return ShieldAlert;
    case "important":
      return AlertCircle;
    default:
      return Info;
  }
}

/**
 * Get notification color based on type
 */
function getNotificationColor(severity: NotificationItem["severity"]) {
  switch (severity) {
    case "critical":
      return "$red10";
    case "important":
      return "$orange10";
    default:
      return "$blue10";
  }
}

/**
 * NotificationPopover component
 * Displays notifications in a popover from the header bell icon
 * Replaces the previous NotificationsActionSheet component
 */
export function NotificationPopover({
  notifications,
  unreadCount,
  isLoading = false,
  onNotificationClick,
  onMarkAsRead,
}: NotificationPopoverProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const triggerRef = useRef<ButtonRef>(null);

  // Separate notifications into unread and read
  const unreadNotifications = notifications.filter((n) => !n.read);
  const readNotifications = notifications.filter((n) => n.read);

  // Handle notification click
  const handleNotificationClick = useCallback(
    (notification: NotificationItem) => {
      // Mark as read if unread
      if (!notification.read && onMarkAsRead) {
        onMarkAsRead(notification.id);
      }

      // Call custom handler if provided
      if (onNotificationClick) {
        onNotificationClick(notification);
      }

      // Navigate to destination if provided
      if (notification.ctaUrl) {
        router.push(notification.ctaUrl as Href);
      }

      // Close popover
      setOpen(false);
    },
    [onNotificationClick, onMarkAsRead, router]
  );

  // Handle escape key to close
  useEffect(() => {
    if (!open) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        // Return focus to trigger (web only; trigger may be View on RN)
        (triggerRef.current as unknown as { focus?: () => void })?.focus?.();
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("keydown", handleEscape);
      return () => window.removeEventListener("keydown", handleEscape);
    }
  }, [open]);

  // Handle click outside to close
  const handleOpenChange = useCallback((newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen && triggerRef.current) {
      // Return focus to trigger when closing (web only)
      const el = triggerRef.current as unknown as { focus?: () => void };
      setTimeout(() => el?.focus?.(), 100);
    }
  }, []);

  const popoverContent = (
    <>
      <PopoverHeader
        title="Notifications"
        showCloseButton
        onClose={() => handleOpenChange(false)}
      />
      <PopoverContent>
        {/* Content */}
        {isLoading ? (
          <Stack padding="md" align="center" gap={12}>
            <Spinner size="sm" color="gray" />
            <Text color="gray">Loading notifications...</Text>
          </Stack>
        ) : notifications.length === 0 ? (
          <Stack padding="md" align="center" gap={12}>
            <Bell size={32} color="gray" opacity={0.5} />
            <Text color="gray" style={{ textAlign: "center" }}>
              No notifications
            </Text>
            <Text color="gray" style={{ textAlign: "center" }}>
              You're all caught up!
            </Text>
          </Stack>
        ) : (
          <ScrollView
            style={{ maxHeight: 320 }}
            showsVerticalScrollIndicator={false}
          >
            <Stack>
              {/* Unread Section */}
              {unreadNotifications.length > 0 && (
                <>
                  <Row
                    padding="sm"
                    paddingHorizontal="md"
                    backgroundColor="$color2"
                    style={{
                      borderBottomWidth: 1,
                      borderBottomColor: "var(--color-border)",
                    }}
                  >
                    <Text color="gray">
                      Unread ({unreadNotifications.length})
                    </Text>
                  </Row>
                  <Stack>
                    {unreadNotifications.map((notification, index) => {
                      const IconComponent = getNotificationIcon(
                        notification.severity
                      );
                      const iconColor = getNotificationColor(
                        notification.severity
                      );

                      return (
                        <Stack key={notification.id}>
                          <Card
                            pressable
                            padding="sm"
                            onPress={() =>
                              handleNotificationClick(notification)
                            }
                            style={{
                              backgroundColor: "var(--color-3)",
                              borderWidth: 1,
                              borderColor: "var(--color-5)",
                              borderRadius: 0,
                            }}
                            accessibilityLabel={`${notification.title}. ${
                              notification.preview
                            }. ${formatRelativeTime(notification.createdAt)}`}
                          >
                            <Row gap={12} align="flex-start">
                              <IconComponent size={18} color={iconColor} />
                              <Stack style={{ flex: 1 }} gap={8}>
                                <Row
                                  justify="space-between"
                                  align="flex-start"
                                  gap={8}
                                >
                                  <Text color="gray" style={{ flex: 1 }}>
                                    {notification.title}
                                  </Text>
                                  <Stack
                                    width={6}
                                    height={6}
                                    backgroundColor="$blue9"
                                    borderRadius={8}
                                    style={{ marginTop: 4 }}
                                  />
                                </Row>
                                <Text color="gray" style={{ lineHeight: 12 }}>
                                  {notification.preview}
                                </Text>
                                <Row gap={8} align="center" marginTop={8}>
                                  <Text color="gray">
                                    {formatRelativeTime(notification.createdAt)}
                                  </Text>
                                  <Pill
                                    label={notification.severity.toUpperCase()}
                                    backgroundColor={
                                      SEVERITY_PILL_STYLES[
                                        notification.severity
                                      ].backgroundColor
                                    }
                                    color={
                                      SEVERITY_PILL_STYLES[
                                        notification.severity
                                      ].color
                                    }
                                  />
                                  {notification.channels?.length > 0 && (
                                    <Pill
                                      label={notification.channels.join(", ")}
                                      backgroundColor={
                                        CHANNEL_PILL_STYLE.backgroundColor
                                      }
                                      color={CHANNEL_PILL_STYLE.color}
                                    />
                                  )}
                                </Row>
                                {notification.ctaLabel && (
                                  <Button
                                    size="sm"
                                    color="primary"
                                    style={{ marginTop: 4 }}
                                    onPress={() =>
                                      handleNotificationClick(notification)
                                    }
                                  >
                                    {notification.ctaLabel}
                                  </Button>
                                )}
                              </Stack>
                            </Row>
                          </Card>
                          {index < unreadNotifications.length - 1 && (
                            <Separator
                              style={{ backgroundColor: "var(--color-border)" }}
                            />
                          )}
                        </Stack>
                      );
                    })}
                  </Stack>
                </>
              )}

              {/* Separator between sections */}
              {unreadNotifications.length > 0 &&
                readNotifications.length > 0 && (
                  <Separator
                    style={{ backgroundColor: "var(--color-border)" }}
                  />
                )}

              {/* Read Section */}
              {readNotifications.length > 0 && (
                <>
                  <Row
                    padding="sm"
                    paddingHorizontal="md"
                    backgroundColor="$color2"
                    style={{
                      borderBottomWidth: 1,
                      borderBottomColor: "var(--color-border)",
                    }}
                  >
                    <Text color="gray">Read</Text>
                  </Row>
                  <Stack>
                    {readNotifications.map((notification, index) => {
                      const IconComponent = getNotificationIcon(
                        notification.severity
                      );
                      const iconColor = getNotificationColor(
                        notification.severity
                      );

                      return (
                        <Stack key={notification.id}>
                          <Card
                            pressable
                            padding="sm"
                            onPress={() =>
                              handleNotificationClick(notification)
                            }
                            style={{
                              backgroundColor: "var(--color-2)",
                              borderWidth: 0,
                              borderRadius: 0,
                              opacity: 0.7,
                            }}
                            accessibilityLabel={`${notification.title}. ${
                              notification.preview
                            }. ${formatRelativeTime(notification.createdAt)}`}
                          >
                            <Row gap={12} align="flex-start">
                              <IconComponent size={18} color={iconColor} />
                              <Stack style={{ flex: 1 }} gap={8}>
                                <Text color="gray">{notification.title}</Text>
                                <Text color="gray" style={{ lineHeight: 12 }}>
                                  {notification.preview}
                                </Text>
                                <Row gap={8} align="center" marginTop={8}>
                                  <Text color="gray">
                                    {formatRelativeTime(notification.createdAt)}
                                  </Text>
                                  <Pill
                                    label={notification.severity.toUpperCase()}
                                    backgroundColor={
                                      SEVERITY_PILL_STYLES[
                                        notification.severity
                                      ].backgroundColor
                                    }
                                    color={
                                      SEVERITY_PILL_STYLES[
                                        notification.severity
                                      ].color
                                    }
                                  />
                                  {notification.channels?.length > 0 && (
                                    <Pill
                                      label={notification.channels.join(", ")}
                                      backgroundColor={
                                        CHANNEL_PILL_STYLE.backgroundColor
                                      }
                                      color={CHANNEL_PILL_STYLE.color}
                                    />
                                  )}
                                </Row>
                                {notification.ctaLabel && (
                                  <Button
                                    size="sm"
                                    color="primary"
                                    style={{ marginTop: 4 }}
                                    onPress={() =>
                                      handleNotificationClick(notification)
                                    }
                                  >
                                    {notification.ctaLabel}
                                  </Button>
                                )}
                              </Stack>
                            </Row>
                          </Card>
                          {index < readNotifications.length - 1 && (
                            <Separator
                              style={{ backgroundColor: "var(--color-border)" }}
                            />
                          )}
                        </Stack>
                      );
                    })}
                  </Stack>
                </>
              )}
            </Stack>
          </ScrollView>
        )}
      </PopoverContent>
    </>
  );

  return (
    <Popover
      placement="bottom-end"
      open={open}
      onOpenChange={handleOpenChange}
      content={popoverContent}
    >
      <Button
        ref={triggerRef}
        variant="text"
        color="gray"
        style={{
          borderWidth: 0,
          backgroundColor: "transparent",
          height: 30,
          position: "relative",
        }}
        accessibilityLabel={`Notifications${
          unreadCount > 0 ? ` (${unreadCount} unread)` : ""
        }`}
        onPress={() => setOpen(!open)}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <Stack
            style={{
              position: "absolute",
              top: -4,
              right: -4,
              backgroundColor: "var(--red-9)",
              borderRadius: 8,
              paddingHorizontal: 4,
              paddingVertical: 4,
              minWidth: 20,
              zIndex: 1,
            }}
          >
            <Row align="center" justify="center">
              <Text color="white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </Text>
            </Row>
          </Stack>
        )}
      </Button>
    </Popover>
  );
}
