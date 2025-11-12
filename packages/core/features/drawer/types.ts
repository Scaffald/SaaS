import type { JSX } from "react";
import type { GestureResponderEvent } from "react-native";
import type { DrawerContentComponentProps } from "@react-navigation/drawer";
import type { TranslationKey } from "@app/core/locales";
import type { BarChart3 } from "@tamagui/lucide-icons";

/**
 * Configuration for individual drawer menu items
 */
export type DrawerItemConfig = {
  key: string;
  title?: string;
  titleKey?: TranslationKey;
  href: string;
  icon?: typeof BarChart3;
  description?: string;
  badge?: string;
  disabled?: boolean;
  subItems?: DrawerItemConfig[];
  hasChevron?: boolean;
  isExpandable?: boolean;
  isCompleted?: boolean; // Shows checkmark icon when true
  isOnCooldown?: boolean; // Shows clock icon when true (overrides checkmark)
};

/**
 * Props for DrawerLink component
 */
export type DrawerLinkProps = {
  item: DrawerItemConfig;
  pathname: string;
  depth?: number;
  expandedItems?: Set<string>;
  onToggleExpanded?: (key: string) => void;
  // Optional for drawer close functionality if needed
  onNavigate?: (href: string, event: GestureResponderEvent) => void;
};

/**
 * Configuration for drawer menu sections
 */
export type DrawerSectionConfig = {
  key: string;
  title: string;
  items: DrawerItemConfig[];
};

/**
 * Props for DrawerSection component
 */
export type DrawerSectionProps = {
  section: DrawerSectionConfig;
  pathname: string;
  collapsed?: boolean;
  onNavigate?: (href: string, event: GestureResponderEvent) => void;
  expandedItems?: Set<string>;
  onToggleExpanded?: (key: string) => void;
};

/**
 * Props for DrawerContent component
 */
export type DrawerContentProps = {
  pathname: string;
  collapsed?: boolean;
  onNavigate?: (href: string, event: GestureResponderEvent) => void;
  expandedItems?: Set<string>;
  onToggleExpanded?: (key: string) => void;
  drawerProps?: DrawerContentComponentProps;
};
