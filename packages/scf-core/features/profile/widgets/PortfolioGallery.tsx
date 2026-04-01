import { usePortfolioItems } from "@scf/core/utils/portfolio-sdk-hooks";
import { getStorageUrl } from "@scf/core/utils/supabase/storage";
import { DashboardWidget, ResponsiveModal, useThemeContext } from "@scaffald/ui";
import { Eye } from "lucide-react-native";
import { useState } from "react";
import { Image } from "react-native";
import { Card, DashboardWidgetHeader, Spinner, Text, Row, Stack } from "@scaffald/ui";
import { colors } from "@scaffald/ui/tokens";
import type { PortfolioItem } from "@scaffald/sdk";
import type { ProfileWidgetProps } from "./types";

/**
 * PortfolioGallery Component
 *
 * Display-only component for viewing portfolio in public profile view.
 * Shows portfolio items in a grid layout with lightbox functionality.
 *
 * @param userId - User ID to display portfolio for
 * @param showEdit - Whether to show edit actions (always false for gallery)
 * @param variant - Display variant (compact or full)
 */
export function PortfolioGallery({
  userId,
  variant = "full",
}: ProfileWidgetProps) {
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const { theme } = useThemeContext();

  // Fetch portfolio items
  const { data: portfolioItems = [], isLoading } = usePortfolioItems(
    userId ? { userId } : undefined,
    { enabled: !!userId }
  );

  const handleItemClick = (item: PortfolioItem) => {
    setSelectedItem(item);
    setLightboxOpen(true);
  };

  if (isLoading) {
    return (
      <DashboardWidget>
        <Stack gap={16} align="center" paddingVertical={32}>
          <Spinner variant="ios" size="lg" />
          <Text style={{ color: colors.text[theme].secondary }}>Loading portfolio...</Text>
        </Stack>
      </DashboardWidget>
    );
  }

  if (portfolioItems.length === 0) {
    return null; // Don't show widget if no portfolio items
  }

  return (
    <>
      <DashboardWidget>
        <Stack gap={16}>
          <DashboardWidgetHeader title="Portfolio" />

          {/* Grid Layout */}
          <Stack gap={12}>
            {portfolioItems.map((item) => {
              const imageUrl = item.file_path
                ? getStorageUrl("portfolio", item.file_path)
                : item.image_url;

              return (
                <Card
                  key={item.id}
                  variant="outlined"
                  pressable
                  onPress={() => handleItemClick(item)}
                >
                  <Stack gap={12}>
                    {imageUrl && (
                      <Image
                        source={{ uri: imageUrl }}
                        style={{
                          width: "100%",
                          height: variant === "compact" ? 150 : 200,
                          borderRadius: 12,
                        }}
                        resizeMode="cover"
                      />
                    )}
                    <Stack gap={8} padding="sm">
                      <Text>{item.title}</Text>
                      {Boolean(item.description) && variant === "full" && (
                        <Text style={{ color: colors.text[theme].secondary }}>
                          {/* Render rich text description - simplified for now */}
                          {typeof item.description === "string"
                            ? item.description
                            : "Rich text description"}
                        </Text>
                      )}
                      {imageUrl && (
                        <Row gap={8} align="center" style={{ marginTop: 8 }}>
                          <Eye size={16} color={colors.text[theme].secondary} />
                          <Text style={{ color: colors.text[theme].secondary }}>
                            Click to view
                          </Text>
                        </Row>
                      )}
                    </Stack>
                  </Stack>
                </Card>
              );
            })}
          </Stack>
        </Stack>
      </DashboardWidget>

      {/* Lightbox Modal */}
      {selectedItem && (
        <ResponsiveModal
          open={lightboxOpen}
          onOpenChange={setLightboxOpen}
          title={selectedItem.title}
          size="lg"
        >
          <Stack gap={16}>
            {(() => {
              const imageUrl = selectedItem.file_path
                ? getStorageUrl("portfolio", selectedItem.file_path)
                : selectedItem.image_url;

              return (
                <>
                  {imageUrl && (
                    <Image
                      source={{ uri: imageUrl }}
                      style={{ width: "100%", height: 400, borderRadius: 12 }}
                      resizeMode="contain"
                    />
                  )}
                  {selectedItem.description && (
                    <Stack gap={8}>
                      <Text>Description</Text>
                      <Text style={{ color: colors.text[theme].secondary, lineHeight: 16 }}>
                        {typeof selectedItem.description === "string"
                          ? selectedItem.description
                          : "Rich text description"}
                      </Text>
                    </Stack>
                  )}
                </>
              );
            })()}
          </Stack>
        </ResponsiveModal>
      )}
    </>
  );
}
