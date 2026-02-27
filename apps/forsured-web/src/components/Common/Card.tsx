/**
 * Card - Re-export from @scaffald/ui

 *
 * Note: Beyond UI Card has CardHeader, CardContent, CardFooter
 * CardTitle and CardDescription are replaced with H4 and Text components
 */
export {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from '@scaffald/ui'
export type { CardProps } from '@scaffald/ui'

// CardTitle and CardDescription aliases using Typography components
import { H4 as CardTitle, Text as CardDescription } from '@scaffald/ui'
export { CardTitle, CardDescription }

// Default export for backward compatibility
import { Card as DataDisplayCard } from '@scaffald/ui'
export default DataDisplayCard
