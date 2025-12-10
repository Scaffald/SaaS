/**
 * Button - Re-export from @unicornlove/ui
 * 
 * This component uses the Tamagui-based Button from the @unicornlove/ui package.
 * For additional props like loading, leftIcon, rightIcon, wrap the Button
 * or use Tamagui's built-in icon support.
 */
export { Button } from '@unicornlove/ui';
export type { ButtonProps } from '@unicornlove/ui';

// Default export for backward compatibility
import { Button as CoreButton } from '@unicornlove/ui';
export default CoreButton;
