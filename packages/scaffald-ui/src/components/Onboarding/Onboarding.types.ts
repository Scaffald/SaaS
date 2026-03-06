/**
 * Onboarding component types
 */

import type { ComponentType, FC } from "react";
import type { ViewStyle } from "react-native";

export interface OnboardingStepInfo {
  Content: FC;
  backgroundImage?: string;
}

export interface OnboardingProps {
  onOnboarded?: () => void;
  autoSwipe?: boolean;
  steps: OnboardingStepInfo[];
  /** When true, shows single static panel (no indicators, no controls). Use for branded auth panel. */
  staticMode?: boolean;
  /** When false, hides prev/next/skip/finish navigation controls while still showing step indicators. Default: true. */
  showControls?: boolean;
  /** Controls background image overlay style. 'light' = white overlay (default), 'dark' = dark overlay for branded panels. */
  overlay?: 'light' | 'dark';
  /** Style applied to the pagination dots row. Use to add bottom margin etc. */
  paginationStyle?: ViewStyle;
}

export interface OnboardingStepContentProps {
  icon: ComponentType<{ size?: number; color?: string }>;
  title: string;
  description: string;
  /** Controls text color scheme. 'light' = dark text (default), 'dark' = white text for dark overlays. */
  theme?: 'light' | 'dark';
}

export interface OnboardingControlsProps {
  currentIdx: number;
  onChange: (newIdx: number) => void;
  stepsCount: number;
  onFinish?: () => void;
  skipLabel?: string;
  continueLabel?: string;
  getStartedLabel?: string;
}
