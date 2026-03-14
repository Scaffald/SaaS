/**
 * Data Category Summary Component
 * CCPA Compliance Implementation
 *
 * Displays the 6 CCPA data categories with indicators
 * showing what types of personal information are collected
 */

import { Text, Row, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

/**
 * CCPA data category type
 */
export type CCPACategory =
  | 'identifiers'
  | 'financial'
  | 'professional'
  | 'commercial'
  | 'usage'
  | 'inferences'

/**
 * Category metadata structure
 */
interface CategoryInfo {
  name: string
  description: string
  examples: string[]
  hasData: boolean
  recordCount?: number
}

/**
 * Props for DataCategorySummary component
 */
interface DataCategorySummaryProps {
  categories: Array<{
    category: CCPACategory
    record_count: number
    data_types: string[]
  }>
}

/**
 * Category metadata with descriptions and examples
 */
const CATEGORY_METADATA: Record<CCPACategory, Omit<CategoryInfo, 'hasData' | 'recordCount'>> = {
  identifiers: {
    name: 'Personal Identifiers',
    description: 'Information that identifies you directly or indirectly',
    examples: ['Name', 'Email', 'Phone number', 'Address', 'Account ID'],
  },
  financial: {
    name: 'Financial Information',
    description: 'Financial data and transaction information',
    examples: ['Insurance policies', 'Payment methods', 'Coverage amounts', 'Claims'],
  },
  professional: {
    name: 'Professional Information',
    description: 'Employment and professional data',
    examples: ['Company name', 'Job title', 'Licenses', 'Certifications'],
  },
  commercial: {
    name: 'Commercial Information',
    description: 'Business and transactional data',
    examples: ['Projects', 'Contracts', 'Business relationships'],
  },
  usage: {
    name: 'Usage Data',
    description: 'Information about how you use our services',
    examples: ['Tasks completed', 'Features used', 'Login history'],
  },
  inferences: {
    name: 'Inferences',
    description: 'Insights derived from your data',
    examples: ['Compliance scores', 'Risk assessments', 'Recommendations'],
  },
}

/**
 * Single category card component
 */
function CategoryCard({ info }: { info: CategoryInfo }) {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'

  return (
    <Stack
      padding="md"
      backgroundColor={colors.bg[t].muted}
      borderRadius={12}
      borderWidth={1}
      borderColor={info.hasData ? (t === 'dark' ? colors.green[300] : colors.green[600]) : colors.border[t].default}
      gap={8}
      flex={1}
      minWidth={280}
    >
      <Row justify="space-between" align="center">
        <Text>{info.name}</Text>
        {info.hasData ? (
          <Row backgroundColor={t === 'dark' ? `${colors.green[300]}20` : `${colors.green[600]}15`} paddingHorizontal={8} paddingVertical={4} borderRadius={8}>
            <Text color={t === 'dark' ? colors.green[300] : colors.green[600]}>{info.recordCount || 0} records</Text>
          </Row>
        ) : (
          <Row backgroundColor={colors.bg[t].muted} paddingHorizontal={8} paddingVertical={4} borderRadius={8}>
            <Text color={colors.text[t].secondary}>No data</Text>
          </Row>
        )}
      </Row>

      <Text color={colors.text[t].secondary}>{info.description}</Text>

      <Stack gap={4} marginTop={4}>
        <Text color={colors.text[t].secondary}>Examples:</Text>
        <Text color={colors.text[t].secondary}>{info.examples.join(' • ')}</Text>
      </Stack>
    </Stack>
  )
}

/**
 * Data Category Summary Component
 *
 * Displays all CCPA data categories with indicators for what data
 * the user has stored in the system.
 */
export function DataCategorySummary({ categories }: DataCategorySummaryProps) {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'

  // Build category info with actual data
  const categoryInfos: CategoryInfo[] = (Object.keys(CATEGORY_METADATA) as CCPACategory[]).map(
    (categoryKey) => {
      const metadata = CATEGORY_METADATA[categoryKey]
      const categoryData = categories.find((c) => c.category === categoryKey)

      return {
        ...metadata,
        hasData: (categoryData?.record_count || 0) > 0,
        recordCount: categoryData?.record_count || 0,
      }
    }
  )

  // Count categories with data
  const categoriesWithData = categoryInfos.filter((c) => c.hasData).length

  return (
    <Stack gap={16}>
      {/* Summary banner */}
      <Row padding="sm" backgroundColor={t === 'dark' ? `${colors.blue[300]}15` : `${colors.blue[600]}10`} borderRadius={12} gap={8} align="center">
        <Text color={t === 'dark' ? colors.blue[300] : colors.blue[600]}>
          We collect data in {categoriesWithData} of 6 CCPA categories. View details below.
        </Text>
      </Row>

      {/* Category cards grid */}
      <Row wrap gap={12}>
        {categoryInfos.map((info) => (
          <CategoryCard key={info.name} info={info} />
        ))}
      </Row>
    </Stack>
  )
}

export default DataCategorySummary
