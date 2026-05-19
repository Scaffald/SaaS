import { DashboardPage } from "@scf/core/features/dashboard/DashboardPage";
import type { NewsItem } from "@scf/core/features/news";
import { useAggregatedNews } from "@scf/core/features/news/hooks/useNewsFeed";
import { useNewsIndustryResolution } from "@scf/core/features/news/hooks/useNewsIndustryResolution";
import { AlertCircle, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react-native";
import { Button, Row, Spinner, Stack, Text } from "@scaffald/ui";
import { openExternalLink } from "@scf/core/utils/platform";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Image, Pressable, StyleSheet, View, type TextStyle, type ViewStyle } from "react-native";
import { colors } from "@scaffald/ui/tokens";
import { useThemeContext } from "@scaffald/ui";

const FULL_PAGE_ITEM_COUNT = 40;

const formatTimeAgo = (date: Date) => {
  const diffMs = Date.now() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "1 day ago";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
};

const capitalise = (v?: string | null) =>
  v ? v.charAt(0).toUpperCase() + v.slice(1) : "";

type ArticleItem = NewsItem & { source?: string | null; category?: string | null };

function toDate(d: Date | string): Date {
  return d instanceof Date ? d : new Date(d as string);
}

// ── Featured article panel (left column) ──────────────────────────────────────
function FeaturedPanel({
  item,
  index,
  total,
  onPrev,
  onNext,
  onOpen,
}: {
  item: ArticleItem;
  index: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onOpen: () => void;
}) {
  const { theme } = useThemeContext();
  const [imgError, setImgError] = useState(false);
  const pubDate = toDate(item.pubDate);
  const hasImage = !!item.image && !imgError;

  return (
    <Stack gap={0} style={{ flex: 1 }}>
      {/* Image */}
      {hasImage ? (
        <View style={styles.featuredImageWrap}>
          <Image
            source={hasImage && item.image ? { uri: item.image } : undefined}
            style={StyleSheet.absoluteFillObject}
            resizeMode="cover"
            onError={() => setImgError(true)}
          />
          <View style={[StyleSheet.absoluteFillObject, styles.imageOverlay]} />
          {item.category ? (
            <View style={styles.imageCategoryWrap}>
              <Text style={styles.imageCategoryText}>
                {capitalise(item.category).toUpperCase()}
              </Text>
            </View>
          ) : null}
        </View>
      ) : item.category ? (
        <View
          style={[
            styles.categoryPill,
            { backgroundColor: colors.bg[theme].muted, alignSelf: "flex-start" },
          ]}
        >
          <Text style={StyleSheet.flatten([styles.categoryPillText, { color: colors.text[theme].secondary }]) as TextStyle}>
            {capitalise(item.category)}
          </Text>
        </View>
      ) : null}

      {/* Content */}
      <Stack gap={12} style={styles.featuredContent}>
        <Text
          style={StyleSheet.flatten([styles.featuredTitle, { color: colors.text[theme].primary }]) as TextStyle}
        >
          {item.title}
        </Text>

        {item.description ? (
          <>
            <View style={{ height: 1, backgroundColor: colors.border[theme].default }} />
            <Text
              style={StyleSheet.flatten([styles.featuredDescription, { color: colors.text[theme].secondary }]) as TextStyle}
            >
              {item.description}
            </Text>
          </>
        ) : null}

        {/* Meta */}
        <Row gap={8} align="center" wrap>
          <Text style={StyleSheet.flatten([styles.metaText, { color: colors.text[theme].tertiary }]) as TextStyle}>
            {formatTimeAgo(pubDate)}
          </Text>
          {item.readTime ? (
            <Text style={StyleSheet.flatten([styles.metaText, { color: colors.text[theme].tertiary }]) as TextStyle}>
              · {item.readTime}
            </Text>
          ) : null}
          {item.source ? (
            <Text
              numberOfLines={1}
              style={StyleSheet.flatten([styles.metaText, { color: colors.text[theme].tertiary }]) as TextStyle}
            >
              · {item.source}
            </Text>
          ) : null}
        </Row>

        {/* Read button */}
        <Button variant="filled" color="primary" size="sm" onPress={onOpen}>
          Read Article
        </Button>

        {/* Pagination */}
        <Row align="center" justify="space-between" style={styles.pagination}>
          <Pressable
            onPress={onPrev}
            disabled={index === 0}
            style={({ pressed }) => [
              styles.pageBtn,
              { opacity: index === 0 ? 0.3 : pressed ? 0.6 : 1 },
            ]}
          >
            <ChevronLeft size={18} color={colors.text[theme].secondary} />
            <Text style={StyleSheet.flatten([styles.pageBtnText, { color: colors.text[theme].secondary }]) as TextStyle}>
              Prev
            </Text>
          </Pressable>

          <Text style={StyleSheet.flatten([styles.pageCount, { color: colors.text[theme].tertiary }]) as TextStyle}>
            {index + 1} of {total}
          </Text>

          <Pressable
            onPress={onNext}
            disabled={index === total - 1}
            style={({ pressed }) => [
              styles.pageBtn,
              { opacity: index === total - 1 ? 0.3 : pressed ? 0.6 : 1 },
            ]}
          >
            <Text style={StyleSheet.flatten([styles.pageBtnText, { color: colors.text[theme].secondary }]) as TextStyle}>
              Next
            </Text>
            <ChevronRight size={18} color={colors.text[theme].secondary} />
          </Pressable>
        </Row>
      </Stack>
    </Stack>
  );
}

// ── Feed row (right column) ────────────────────────────────────────────────────
function FeedRow({
  item,
  selected,
  divider,
  onPress,
}: {
  item: ArticleItem;
  selected: boolean;
  divider: boolean;
  onPress: () => void;
}) {
  const { theme } = useThemeContext();
  const [imgError, setImgError] = useState(false);
  const pubDate = toDate(item.pubDate);
  const hasImage = !!item.image && !imgError;

  return (
    <View>
      {divider ? (
        <View style={{ height: 1, backgroundColor: colors.border[theme].default }} />
      ) : null}
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Row
          gap={12}
          align="flex-start"
          style={StyleSheet.flatten([
            styles.feedRow,
            selected ? {
              backgroundColor:
                theme === "dark" ? colors.bg[theme].subtle : colors.blue[50],
              borderRadius: 8,
              paddingHorizontal: 8,
              marginHorizontal: -8,
            } : undefined,
          ]) as ViewStyle}
        >
          {hasImage ? (
            <Image
              source={hasImage && item.image ? { uri: item.image } : undefined}
              style={styles.feedThumb}
              resizeMode="cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <View
              style={StyleSheet.flatten([styles.feedThumb, { backgroundColor: colors.bg[theme].muted }]) as ViewStyle}
            />
          )}
          <View style={{ flex: 1, gap: 3 }}>
            <Text
              numberOfLines={2}
              style={StyleSheet.flatten([
                styles.feedTitle,
                {
                  color: selected
                    ? theme === "dark"
                      ? colors.blue[300]
                      : colors.blue[700]
                    : colors.text[theme].primary,
                  fontWeight: selected ? "600" : "500",
                },
              ]) as TextStyle}
            >
              {item.title}
            </Text>
            <Row gap={6} align="center">
              <Text style={StyleSheet.flatten([styles.metaText, { color: colors.text[theme].tertiary }]) as TextStyle}>
                {formatTimeAgo(pubDate)}
              </Text>
              {item.category ? (
                <Text style={StyleSheet.flatten([styles.metaText, { color: colors.text[theme].tertiary }]) as TextStyle}>
                  · {capitalise(item.category)}
                </Text>
              ) : null}
            </Row>
          </View>
        </Row>
      </Pressable>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  featuredImageWrap: {
    height: 260,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 20,
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  imageCategoryWrap: {
    position: "absolute",
    bottom: 16,
    left: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 6,
  },
  imageCategoryText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.8,
  },
  featuredContent: {
    paddingBottom: 8,
  },
  featuredTitle: {
    fontSize: 22,
    fontWeight: "700",
    lineHeight: 30,
  },
  featuredDescription: {
    fontSize: 15,
    lineHeight: 26,
  },
  pagination: {
    paddingTop: 4,
  },
  pageBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  pageBtnText: {
    fontSize: 13,
  },
  pageCount: {
    fontSize: 13,
  },
  feedRow: {
    paddingVertical: 12,
  },
  feedThumb: {
    width: 60,
    height: 60,
    borderRadius: 6,
    flexShrink: 0,
  },
  feedTitle: {
    fontSize: 13,
    lineHeight: 19,
  },
  categoryPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
  },
  categoryPillText: {
    fontSize: 11,
    fontWeight: "500",
  },
  metaText: {
    fontSize: 12,
  },
});

// ── Page ──────────────────────────────────────────────────────────────────────
export default function NewsPage() {
  const router = useRouter();
  const { theme } = useThemeContext();
  const [selectedIndex, setSelectedIndex] = useState(0);

  const { effectiveIndustryId, isResolving: isResolvingIndustry } =
    useNewsIndustryResolution({
      industrySlug: "construction",
      useUserIndustry: false,
    });

  const {
    data: newsItems = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useAggregatedNews({
    industryId: effectiveIndustryId ?? "",
    maxTotalItems: FULL_PAGE_ITEM_COUNT,
    enabled: !!effectiveIndustryId,
  });

  const items = useMemo(() => {
    const raw = newsItems as unknown as ArticleItem[];
    const seen = new Set<string>();
    return raw.filter((item) => {
      const key = item.link || item.id;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [newsItems]);

  const selectedItem = items[selectedIndex] ?? null;

  const handleOpenArticle = (article: { link: string }) => {
    openExternalLink(article.link, { inApp: true });
  };

  // Page header — shown in left column above the featured panel
  const pageHeader = (
    <Row align="center" justify="space-between" style={{ marginBottom: 24 }}>
      <Stack gap={2}>
        <Text
          style={{ fontSize: 22, fontWeight: "700", color: colors.text[theme].primary }}
        >
          News
        </Text>
        <Text style={{ fontSize: 13, color: colors.text[theme].secondary }}>
          Curated construction headlines
        </Text>
      </Stack>
      <Row gap={8}>
        <Button
          size="sm"
          variant="outline"
          iconStart={RefreshCw}
          onPress={() => void refetch()}
          disabled={isLoading}
        >
          Refresh
        </Button>
        <Button size="sm" variant="outline" onPress={() => router.back()}>
          Back
        </Button>
      </Row>
    </Row>
  );

  // States
  const isSpinning = isResolvingIndustry || (isLoading && items.length === 0);

  if (isSpinning || isError || (!isLoading && !isError && items.length === 0)) {
    const leftContent = (
      <Stack gap={0}>
        {pageHeader}
        {isSpinning ? (
          <Stack align="center" gap={12} style={{ paddingVertical: 64 }}>
            <Spinner size="lg" color="primary" />
            <Text style={{ color: colors.text[theme].secondary }}>
              Loading latest news…
            </Text>
          </Stack>
        ) : isError ? (
          <Stack align="center" gap={12} style={{ paddingVertical: 64 }}>
            <AlertCircle size={32} color={colors.error[500]} />
            <Text style={{ color: colors.text[theme].primary, textAlign: "center" }}>
              Unable to load news at the moment.
            </Text>
            <Text style={{ color: colors.text[theme].secondary, textAlign: "center" }}>
              {error?.message || "Please check your connection and try again."}
            </Text>
            <Button variant="filled" color="primary" size="sm" onPress={() => void refetch()}>
              Retry
            </Button>
          </Stack>
        ) : (
          <Stack align="center" gap={12} style={{ paddingVertical: 64 }}>
            <Text style={{ color: colors.text[theme].secondary }}>
              No articles found. Check back soon.
            </Text>
          </Stack>
        )}
      </Stack>
    );

    return (
      <DashboardPage
        showBreadcrumb={false}
        pageTitle="News"
        leftContent={leftContent}
      />
    );
  }

  // Two-column layout: featured reader (left) + feed (right)
  const leftContent = (
    <Stack gap={0}>
      {pageHeader}
      {selectedItem ? (
        <FeaturedPanel
          key={selectedItem.id}
          item={selectedItem}
          index={selectedIndex}
          total={items.length}
          onPrev={() => setSelectedIndex((i) => Math.max(0, i - 1))}
          onNext={() => setSelectedIndex((i) => Math.min(items.length - 1, i + 1))}
          onOpen={() => void handleOpenArticle(selectedItem)}
        />
      ) : null}
    </Stack>
  );

  const rightContent = (
    <Stack gap={0}>
      <Row align="center" justify="space-between" style={{ marginBottom: 12 }}>
        <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text[theme].primary }}>
          All Stories
        </Text>
        <Text style={{ fontSize: 12, color: colors.text[theme].tertiary }}>
          {items.length} articles
        </Text>
      </Row>
      <Stack>
        {items.map((item, i) => (
          <FeedRow
            key={item.id}
            item={item}
            selected={i === selectedIndex}
            divider={i > 0}
            onPress={() => setSelectedIndex(i)}
          />
        ))}
      </Stack>
    </Stack>
  );

  return (
    <DashboardPage
      showBreadcrumb={false}
      pageTitle="News"
      leftContent={leftContent}
      rightContent={rightContent}
    />
  );
}
