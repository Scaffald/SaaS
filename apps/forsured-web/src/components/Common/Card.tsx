/**
 * Card - Re-export from @unicornlove/beyond-ui

 *
 * Note: Beyond UI Card has CardHeader, CardContent, CardFooter
 * CardTitle and CardDescription are replaced with H4 and Text components
 */
export {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from '@unicornlove/beyond-ui'
export type { CardProps } from '@unicornlove/beyond-ui'

// CardTitle and CardDescription aliases using Typography components
import { H4 as CardTitle, Text as CardDescription } from '@unicornlove/beyond-ui'
export { CardTitle, CardDescription }

// Default export for backward compatibility
import { Card as DataDisplayCard } from '@unicornlove/beyond-ui'
export default DataDisplayCard
