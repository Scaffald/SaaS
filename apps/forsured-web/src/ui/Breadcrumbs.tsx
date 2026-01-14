/**
 * Breadcrumbs wrapper - migrated from Tamagui to Beyond UI
 * Provides backwards-compatible API for existing code
 */
import React from 'react';
import { Home } from 'lucide-react';
import {
  Breadcrumb as BeyondBreadcrumb,
  type BreadcrumbItemData,
} from '@unicornlove/beyond-ui';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: React.ComponentType<{ size?: number; color?: string }>;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  showHome?: boolean;
  separator?: React.ComponentType<{ size?: number; color?: string }>;
  className?: string;
}

export default function Breadcrumbs({
  items,
  showHome = false,
  separator,
  className = '',
}: BreadcrumbsProps) {
  // Build items array for Beyond UI
  const allItems: BreadcrumbItemData[] = showHome
    ? [
        { label: 'Home', icon: <Home size={16} />, onPress: () => window.location.href = '/' },
        ...items.map((item) => ({
          label: item.label,
          icon: item.icon ? <item.icon size={16} /> : undefined,
          onPress: item.onClick || (item.href ? () => window.location.href = item.href! : undefined),
          href: item.href,
        })),
      ]
    : items.map((item) => ({
        label: item.label,
        icon: item.icon ? <item.icon size={16} /> : undefined,
        onPress: item.onClick || (item.href ? () => window.location.href = item.href! : undefined),
        href: item.href,
      }));

  // Current index is the last item
  const currentIndex = allItems.length - 1;

  return (
    <BeyondBreadcrumb
      items={allItems}
      currentIndex={currentIndex}
      showHomeIcon={showHome}
      separator={separator ? <separator size={16} /> : undefined}
    />
  );
}
