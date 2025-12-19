/**
 * Card - Re-export from @unicornlove/ui
 * 
 * The package exports Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter
 */
export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@unicornlove/ui';
export type { CardProps } from '@unicornlove/ui';

// Default export for backward compatibility
import { Card as DataDisplayCard } from '@unicornlove/ui';
export default DataDisplayCard;
