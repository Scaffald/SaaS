/**
 * AnimatedList - List wrapper with staggered entry animations
 *
 * Provides smooth fade-in animations for list items with configurable
 * stagger delay between items.
 *
 * @example
 * ```tsx
 * <AnimatedList items={tasks} keyExtractor={(task) => task.id}>
 *   {(task, index) => <TaskCard task={task} />}
 * </AnimatedList>
 * ```
 */
import { useMemo } from 'react';
import type { ReactNode, CSSProperties } from 'react';
import { Stack, FadeTransition } from '@scaffald/ui';

export interface AnimatedListProps<T> {
  /** Array of items to render */
  items: T[];
  /** Function to extract unique key from item */
  keyExtractor: (item: T, index: number) => string;
  /** Render function for each item */
  children: (item: T, index: number) => ReactNode;
  /** Delay between each item animation in ms (default: 50) */
  staggerDelay?: number;
  /** Gap between items */
  gap?: number;
  /** Container style */
  style?: CSSProperties;
  /** Empty state component */
  emptyState?: ReactNode;
  /** Maximum number of items to animate (rest appear instantly) */
  maxAnimatedItems?: number;
}

/**
 * AnimatedList renders items with staggered fade-in animations
 */
export default function AnimatedList<T>({
  items,
  keyExtractor,
  children,
  staggerDelay = 50,
  gap = 16,
  style,
  emptyState,
  maxAnimatedItems = 20,
}: AnimatedListProps<T>) {
  // Memoize the rendered items to prevent unnecessary re-renders
  const renderedItems = useMemo(() => {
    return items.map((item, index) => {
      const key = keyExtractor(item, index);
      const shouldAnimate = index < maxAnimatedItems;
      const delay = shouldAnimate ? index * staggerDelay : 0;

      return (
        <div
          key={key}
          style={{
            opacity: shouldAnimate ? undefined : 1,
            animation: shouldAnimate
              ? `fadeInUp 0.3s ease-out ${delay}ms both`
              : undefined,
          }}
        >
          {children(item, index)}
        </div>
      );
    });
  }, [items, keyExtractor, children, staggerDelay, maxAnimatedItems]);

  if (items.length === 0 && emptyState) {
    return <FadeTransition visible={true}>{emptyState}</FadeTransition>;
  }

  return (
    <>
      {/* CSS animation keyframes */}
      <style>
        {`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
      <Stack gap={gap} style={style}>
        {renderedItems}
      </Stack>
    </>
  );
}

export type { AnimatedListProps };
