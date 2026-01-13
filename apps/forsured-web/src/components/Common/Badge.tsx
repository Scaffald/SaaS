/**
 * Badge - Re-export Chip from @unicornlove/beyond-ui as Badge
 * Migrated from Tamagui to Beyond UI
 */
export { Chip as Badge } from '@unicornlove/beyond-ui';
export type { ChipProps as BadgeProps } from '@unicornlove/beyond-ui';

// Default export for backward compatibility
import { Chip } from '@unicornlove/beyond-ui';
export default Chip;
