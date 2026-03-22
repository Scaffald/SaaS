/**
 * Career Explorer Screen - Search, browse, and discover O*NET occupations.
 *
 * @see Issue #104
 */

import { Search, TrendingUp, Star, Compass } from 'lucide-react-native'
import { useCallback, useState } from 'react'
import { Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import {
  AssessmentHeader,
  Button,
  Card,
  Input,
  Spinner,
  Text,
  Row,
  Stack,
  useThemeContext,
} from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import {
  useSearchOccupations,
  useRIASECStatus,
  useOccupationStatus,
} from '@scf/core/utils/onet-sdk-hooks'
import { OccupationCard } from './components/OccupationCard'
import { ROUTES } from '@scf/core/constants/routes'
import { useDebounce } from '@scf/core/utils/useDebounce'

/** Featured career categories for browsing */
const CAREER_CATEGORIES = [
  { label: 'Construction & Extraction', icon: '🏗️', query: 'construction' },
  { label: 'Architecture & Engineering', icon: '📐', query: 'engineer' },
  { label: 'Management', icon: '📊', query: 'manager construction' },
  { label: 'Installation & Maintenance', icon: '🔧', query: 'maintenance repair' },
  { label: 'Transportation', icon: '🚛', query: 'transportation' },
  { label: 'Production & Manufacturing', icon: '🏭', query: 'manufacturing' },
]

/**
 * CareerExplorerScreen - returns { leftContent, rightContent, breadcrumbItems }
 * for DashboardLayout rendering via the route page.
 */
export function CareerExplorerScreen() {
  const { theme } = useThemeContext()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedQuery = useDebounce(searchQuery, 300)

  const { data: riasecStatus } = useRIASECStatus()
  const { data: occupationStatus } = useOccupationStatus()

  const { data: searchResults, isLoading: searchLoading } = useSearchOccupations(
    { query: debouncedQuery, limit: 20 },
    { enabled: debouncedQuery.length >= 2 }
  )

  const selectedOccupations = occupationStatus?.occupations ?? []
  const hasRiasec = riasecStatus?.isCompleted

  const handleCategorySearch = useCallback((query: string) => {
    setSearchQuery(query)
  }, [])

  const handleOccupationPress = useCallback(
    (onetCode: string) => {
      router.push(ROUTES.ASSESSMENTS.CAREER_EXPLORER.DETAIL.path.replace(':onetCode', onetCode))
    },
    [router]
  )

  const leftContent = (
    <Stack gap={24} style={{ paddingBottom: 40 }}>
      {/* Header */}
      <AssessmentHeader
        category="Career Discovery"
        title="Career Explorer"
        subtitle="Search and discover careers from 1,000+ occupations in the O*NET database"
      />

      {/* Search */}
      <Stack gap={8}>
        <Row
          gap={8}
          align="center"
          style={{
            backgroundColor: colors.bg[theme].subtle,
            borderRadius: 10,
            paddingHorizontal: 12,
            borderWidth: 1,
            borderColor: colors.border[theme].default,
          }}
        >
          <Search size={18} color={colors.icon[theme].default} />
          <Input
            placeholder="Search occupations (e.g., electrician, project manager...)"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={{ flex: 1, borderWidth: 0, backgroundColor: 'transparent' }}
          />
        </Row>
      </Stack>

      {/* Search Results */}
      {debouncedQuery.length >= 2 && (
        <Stack gap={8}>
          <Text style={{ color: colors.text[theme].secondary, fontSize: 12 }}>
            {searchLoading
              ? 'Searching...'
              : `${searchResults?.occupations?.length ?? 0} results for "${debouncedQuery}"`}
          </Text>

          {searchLoading ? (
            <Stack align="center" paddingVertical={20}>
              <Spinner variant="ios" size="lg" />
            </Stack>
          ) : (
            <Stack gap={6}>
              {(searchResults?.occupations ?? []).map((occ) => (
                <OccupationCard
                  key={occ.onet_code}
                  title={occ.title}
                  onetCode={occ.onet_code}
                  onPress={() => handleOccupationPress(occ.onet_code)}
                  showSavedIndicator={selectedOccupations.some(
                    (o) => o.onet_code === occ.onet_code
                  )}
                />
              ))}
            </Stack>
          )}
        </Stack>
      )}

      {/* No search — show categories */}
      {debouncedQuery.length < 2 && (
        <>
          {/* Saved occupations */}
          {selectedOccupations.length > 0 && (
            <Stack gap={8}>
              <Text style={{ color: colors.text[theme].secondary, fontWeight: '600' }}>
                Your Target Careers
              </Text>
              {selectedOccupations.map((occ) => (
                <OccupationCard
                  key={occ.onet_code}
                  title={occ.title}
                  onetCode={occ.onet_code}
                  onPress={() => handleOccupationPress(occ.onet_code)}
                  isSaved
                />
              ))}
            </Stack>
          )}

          {/* Browse by category */}
          <Stack gap={8}>
            <Text style={{ color: colors.text[theme].secondary, fontWeight: '600' }}>
              Browse by Category
            </Text>
            <Row gap={8} style={{ flexWrap: 'wrap' }}>
              {CAREER_CATEGORIES.map((cat) => (
                <Pressable
                  key={cat.query}
                  onPress={() => handleCategorySearch(cat.query)}
                  style={{ width: '48%' }}
                >
                  <Card
                    padding="md"
                    style={{
                      backgroundColor: colors.bg[theme].subtle,
                      borderWidth: 1,
                      borderColor: colors.border[theme].default,
                      minHeight: 80,
                    }}
                  >
                    <Stack gap={6}>
                      <Text style={{ fontSize: 24 }}>{cat.icon}</Text>
                      <Text style={{ color: colors.text[theme].primary, fontSize: 13 }}>
                        {cat.label}
                      </Text>
                    </Stack>
                  </Card>
                </Pressable>
              ))}
            </Row>
          </Stack>
        </>
      )}
    </Stack>
  )

  const rightContent = (
    <Stack gap={20} padding="xs">
      <Stack gap={4}>
        <Text style={{ fontWeight: '600', color: colors.text[theme].primary }}>
          Career Discovery
        </Text>
        <Text style={{ fontSize: 13, color: colors.text[theme].secondary, lineHeight: 20 }}>
          Explore occupations, discover career paths, and find roles that match your interests.
        </Text>
      </Stack>

      {/* RIASEC CTA — moved from main content to sidebar */}
      {!hasRiasec && (
        <Card
          padding="md"
          radius="xl"
          style={{
            backgroundColor: `${colors.blue[500]}10`,
            borderWidth: 1,
            borderColor: `${colors.blue[500]}30`,
          }}
        >
          <Stack gap={8}>
            <Row gap={8} align="center">
              <TrendingUp size={20} color={colors.blue[500]} />
              <Text style={{ color: colors.text[theme].primary, fontWeight: '600', fontSize: 14 }}>
                Get Recommendations
              </Text>
            </Row>
            <Text style={{ color: colors.text[theme].secondary, fontSize: 13, lineHeight: 20 }}>
              Complete your RIASEC assessment to get career recommendations tailored to your
              interests.
            </Text>
            <Button
              size="sm"
              color="primary"
              onPress={() => router.push(ROUTES.ASSESSMENTS.RIASEC.path)}
            >
              Take Assessment
            </Button>
          </Stack>
        </Card>
      )}

      {/* Saved careers summary */}
      {selectedOccupations.length > 0 && (
        <Card variant="outlined" padding="md" radius="xl">
          <Stack gap={8}>
            <Row gap={8} align="center">
              <Star size={16} color={colors.warning[500]} fill={colors.warning[500]} />
              <Text
                style={{ fontWeight: '600', fontSize: 14, color: colors.text[theme].primary }}
              >
                Saved Careers
              </Text>
            </Row>
            <Text style={{ fontSize: 13, color: colors.text[theme].secondary }}>
              {selectedOccupations.length} occupation
              {selectedOccupations.length !== 1 ? 's' : ''} saved
            </Text>
          </Stack>
        </Card>
      )}

      {/* Quick links */}
      <Card variant="outlined" padding="md" radius="xl">
        <Stack gap={8}>
          <Row gap={8} align="center">
            <Compass size={16} color={colors.primary[500]} />
            <Text style={{ fontWeight: '600', fontSize: 14, color: colors.text[theme].primary }}>
              Related Assessments
            </Text>
          </Row>
          <Stack gap={6}>
            <Button
              size="sm"
              variant="outline"
              onPress={() => router.push(ROUTES.ASSESSMENTS.RIASEC.path)}
            >
              Career Interests (RIASEC)
            </Button>
            <Button
              size="sm"
              variant="outline"
              onPress={() => router.push(ROUTES.ASSESSMENTS.OCCUPATION.path)}
            >
              Occupation Preferences
            </Button>
          </Stack>
        </Stack>
      </Card>
    </Stack>
  )

  return { leftContent, rightContent }
}
