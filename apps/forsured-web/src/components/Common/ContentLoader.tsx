/**
 * ContentLoader - Loading state wrapper with smooth transitions
 *
 * Provides fade transitions between loading and loaded states,
 * with support for skeleton placeholders.
 *
 * @example
 * ```tsx
 * <ContentLoader loading={isLoading}>
 *   <MyContent />
 * </ContentLoader>
 *
 * // With custom skeleton
 * <ContentLoader loading={isLoading} skeleton={<MySkeleton />}>
 *   <MyContent />
 * </ContentLoader>
 * ```
 */
import type { ReactNode } from 'react';
import { Stack, Spinner, FadeTransition, Skeleton } from '@unicornlove/beyond-ui';

export interface ContentLoaderProps {
  /** Whether content is loading */
  loading: boolean;
  /** Content to display when loaded */
  children: ReactNode;
  /** Custom skeleton to show while loading (default: Spinner) */
  skeleton?: ReactNode;
  /** Minimum height for the loader container */
  minHeight?: number | string;
  /** Whether to use skeleton loading instead of spinner */
  useSkeleton?: boolean;
  /** Number of skeleton lines to show */
  skeletonLines?: number;
}

/**
 * Default skeleton placeholder
 */
function DefaultSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <Stack gap={12} style={{ width: '100%' }}>
      <Skeleton height={24} width="60%" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} height={16} width={i === lines - 1 ? '40%' : '100%'} />
      ))}
    </Stack>
  );
}

/**
 * ContentLoader wraps content with smooth loading transitions
 */
export default function ContentLoader({
  loading,
  children,
  skeleton,
  minHeight = 200,
  useSkeleton = false,
  skeletonLines = 3,
}: ContentLoaderProps) {
  const loadingContent = skeleton || (
    useSkeleton ? (
      <DefaultSkeleton lines={skeletonLines} />
    ) : (
      <Stack alignItems="center" justifyContent="center" style={{ minHeight }}>
        <Spinner size="lg" />
      </Stack>
    )
  );

  return (
    <Stack style={{ minHeight, position: 'relative' }}>
      {/* Loading state */}
      <FadeTransition visible={loading} duration="fast">
        <Stack
          style={{
            position: loading ? 'relative' : 'absolute',
            top: 0,
            left: 0,
            right: 0,
            width: '100%',
          }}
        >
          {loadingContent}
        </Stack>
      </FadeTransition>

      {/* Loaded content */}
      <FadeTransition visible={!loading} duration="normal">
        <Stack style={{ width: '100%' }}>
          {children}
        </Stack>
      </FadeTransition>
    </Stack>
  );
}

export type { ContentLoaderProps };
