/**
 * Badge - Re-export Chip from @unicornlove/ui as Badge for backward compatibility
 */
export { Chip as Badge } from '@unicornlove/ui';
export type { ChipProps as BadgeProps } from '@unicornlove/ui';

// Default export for backward compatibility
import { Chip } from '@unicornlove/ui';
export default Chip;
