/**
 * PageTransition - Wrapper for page content with entry animation
 *
 * Provides a subtle fade-in animation when pages mount.
 * Use this to wrap page content for consistent transitions.
 *
 * @example
 * ```tsx
 * function MyPage() {
 *   return (
 *     <PageTransition>
 *       <H1>My Page</H1>
 *       <Content />
 *     </PageTransition>
 *   )
 * }
 * ```
 */
import { useEffect, useState } from 'react';
import type { ReactNode, CSSProperties } from 'react';
import { Stack, FadeTransition } from '@scaffald/ui';

export interface PageTransitionProps {
  /** Page content */
  children: ReactNode;
  /** Animation duration preset */
  duration?: 'fast' | 'normal' | 'slow';
  /** Container style */
  style?: CSSProperties;
}

/**
 * PageTransition provides a fade-in animation for page content
 */
export default function PageTransition({
  children,
  duration = 'fast',
  style,
}: PageTransitionProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Trigger animation after mount
    setMounted(true);
  }, []);

  return (
    <FadeTransition visible={mounted} duration={duration} unmountOnHide={false}>
      <Stack style={{ width: '100%', ...style }}>
        {children}
      </Stack>
    </FadeTransition>
  );
}

export type { PageTransitionProps };
