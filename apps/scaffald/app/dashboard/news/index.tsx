import { DashboardPage } from "@scf/core/features/dashboard/DashboardPage";
import type { NewsItem } from "@scf/core/features/news";
import { useAggregatedNews } from "@scf/core/features/news/hooks/useNewsFeed";
import { useNewsIndustryResolution } from "@scf/core/features/news/hooks/useNewsIndustryResolution";
import { redirect } from "@scf/core/utils/redirect";
import { AlertCircle, ExternalLink, RefreshCw } from "lucide-react-native";
import {
  Button,
  spacing,
  Paragraph,
  Spinner,
  Text,
  Row,
  Stack,
} from "@scaffald/ui";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { type ReactNode, useState } from "react";
import { Platform, Image, Pressable, StyleSheet, View } from "react-native";
import { colors } from "@scaffald/ui/tokens";
import { useThemeContext } from "@scaffald/ui";

const FULL_PAGE_ITEM_COUNT = 40;

// Simple NewsCard component
interface NewsCardProps {
  title: string;
  description?: string;
  image?: string;
  footer?: ReactNode;
  onPress?: () => void;
  fullCardClickable?: boolean;
  minHeight?: number;
}

const NewsCard = ({
  title,
  description,
  image,
  footer,
  onPress,
  fullCardClickable,
  minHeight = 220,
}: NewsCardProps) => {
  const { theme } = useThemeContext();
  const [imageError, setImageError] = useState(false);
  const fallbackImage = `https://picsum.photos/800/600?random=${Math.floor(
    Math.random() * 1000
  )}`;
  const imageSource = imageError ? fallbackImage : image || fallbackImage;

  return (
    <Pressable
      onPress={fullCardClickable ? onPress : undefined}
      style={({ pressed }) => [
        styles.newsCard,
        { minHeight, backgroundColor: colors.bg[theme].subtle },
        pressed && styles.pressed,
      ]}
    >
      <Image
        source={{ uri: imageSource }}
        style={styles.newsCardImage}
        onError={() => setImageError(true)}
      />
      <View style={styles.newsCardOverlay} />
      <Stack padding={spacing[6]} style={styles.newsCardContent}>
        <Stack gap={spacing[4]}>
          <Text size="lg" weight="bold" color={colors.text[theme].primary}>
            {title}
          </Text>
          {description && (
            <Text size="sm" color={colors.text[theme].secondary}>
              {description}
            </Text>
          )}
          {footer && (
            <Row gap={spacing[4]} style={styles.newsCardFooter}>
              {footer}
            </Row>
          )}
        </Stack>
      </Stack>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  newsCard: {
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
  },
  newsCardImage: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
  },
  newsCardOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  newsCardContent: {
    flex: 1,
    justifyContent: "flex-end",
    zIndex: 1,
  },
  newsCardFooter: {
    alignItems: "center",
  },
  pressed: {
    opacity: 0.8,
  },
});

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

export default function NewsPage() {
  const router = useRouter();
  const { theme } = useThemeContext();

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

  const handleOpenArticle = async (article: NewsItem) => {
    try {
      if (Platform.OS === "web") {
        window.open(article.link, "_blank", "noopener,noreferrer");
      } else {
        await WebBrowser.openBrowserAsync(article.link, {
          controlsColor: "#2563eb",
          dismissButtonStyle: "close",
          enableBarCollapsing: true,
          toolbarColor: "#0f172a",
        });
      }
    } catch (browserError) {
      console.warn(
        "Failed to open article, using redirect fallback:",
        browserError
      );
      redirect(article.link);
    }
  };

  const content = (
    <Stack gap={16}>
      <Stack gap={8}>
        <Text color="gray">Industry News</Text>
        <Paragraph size="lg" color="gray">
          Curated headlines across construction, safety, technology, and
          workforce development.
        </Paragraph>
      </Stack>

      <Row gap={8}>
        <Button
          size="sm"
          variant="outline"
          color="gray"
          iconStart={RefreshCw}
          onPress={() => {
            void refetch();
          }}
          disabled={isLoading}
        >
          Refresh
        </Button>
        <Button
          size="sm"
          variant="outline"
          color="gray"
          onPress={() => router.back()}
        >
          Back
        </Button>
      </Row>

      {isResolvingIndustry || (isLoading && newsItems.length === 0) ? (
        <Stack align="center" gap={12}>
          <Spinner size="lg" color="primary" />
          <Text style={{ color: colors.text[theme].secondary }}>
            Loading latest news…
          </Text>
        </Stack>
      ) : null}

      {isError ? (
        <Stack align="center" gap={12}>
          <AlertCircle size={32} color="red" />
          <Text color="red" style={{ textAlign: "center" }}>
            Unable to load news at the moment.
          </Text>
          <Text color="gray" style={{ textAlign: "center" }}>
            {error?.message || "Please check your connection and try again."}
          </Text>
          <Button
            variant="filled"
            color="primary"
            size="sm"
            onPress={() => {
              void refetch();
            }}
          >
            Retry
          </Button>
        </Stack>
      ) : null}

      {!isLoading && !isError && newsItems.length === 0 ? (
        <Stack align="center" gap={12}>
          <Text color="gray">No articles found</Text>
          <Text color="gray" style={{ textAlign: "center" }}>
            Please check again soon for more industry updates.
          </Text>
        </Stack>
      ) : null}

      <Stack gap={16}>
        {newsItems.map((item) => {
          const pubDate = item.pubDate instanceof Date ? item.pubDate : new Date(item.pubDate as string)
          return (
          <NewsCard
            key={item.id}
            title={item.title ?? ''}
            description={item.description}
            image={item.image ?? undefined}
            onPress={() => void handleOpenArticle({ id: item.id, title: item.title ?? '', description: item.description, link: item.link ?? '', pubDate, image: item.image ?? undefined, readTime: item.readTime })}
            fullCardClickable
            minHeight={220}
            footer={
              <Row gap={12} align="center">
                <Text color="gray">{formatTimeAgo(pubDate)}</Text>
                {item.readTime && (
                  <>
                    <Text color="gray">•</Text>
                    <Text color="gray">{item.readTime}</Text>
                  </>
                )}
                <ExternalLink size="lg" color="gray" />
              </Row>
            }
          />
          )
        })}
      </Stack>
    </Stack>
  );

  return (
    <DashboardPage
      showBreadcrumb={false}
      pageTitle="Industry News"
      leftContent={content}
    />
  );
}
