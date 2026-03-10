/**
 * Career Explorer Screen - Search, browse, and discover O*NET occupations.
 *
 * @see Issue #104
 */

import { Briefcase, ChevronRight, Search, Star, TrendingUp } from 'lucide-react-native'
import { useCallback, useState } from 'react'
import { Pressable, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import {
  Button,
  Card,
  H2,
  Input,
  Spinner,
  Text,
  Row,
  Stack,
  useThemeContext,
} from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { useSearchOccupations, useRIASECStatus, useOccupationStatus } from '@scf/core/utils/onet-sdk-hooks'
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

  const handleOccupationPress = useCallback((onetCode: string) => {
    router.push(ROUTES.DASHBOARD.CAREER_EXPLORER.DETAIL.path.replace(':onetCode', onetCode))
  }, [router])

  return (
    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
      <Stack gap={24} style={{ paddingBottom: 40 }}>
        {/* Header */}
        <Stack gap={8}>
          <H2>Career Explorer</H2>
          <Text style={{ color: colors.text[theme].secondary }}>
            Search and discover careers from 1,000+ occupations
          </Text>
        </Stack>

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
                <Spinner size="lg" />
              </Stack>
            ) : (
              <Stack gap={6}>
                {(searchResults?.occupations ?? []).map((occ) => {
                  const isSelected = selectedOccupations.some(
                    (o) => o.onet_code === occ.onet_code
                  )
                  return (
                    <Pressable
                      key={occ.onet_code}
                      onPress={() => handleOccupationPress(occ.onet_code)}
                    >
                      <Card
                        padding="md"
                        style={{
                          backgroundColor: colors.bg[theme].default,
                          borderWidth: 1,
                          borderColor: isSelected
                            ? colors.border[theme].active
                            : colors.border[theme].default,
                        }}
                      >
                        <Row gap={12} align="center">
                          <Briefcase size={20} color={colors.icon[theme].default} />
                          <Stack style={{ flex: 1 }}>
                            <Text style={{ color: colors.text[theme].primary }}>
                              {occ.title}
                            </Text>
                            <Text style={{ color: colors.text[theme].tertiary, fontSize: 12 }}>
                              {occ.onet_code}
                            </Text>
                          </Stack>
                          {isSelected && (
                            <Star size={16} color={colors.warning[500]} fill={colors.warning[500]} />
                          )}
                          <ChevronRight size={16} color={colors.icon[theme].default} />
                        </Row>
                      </Card>
                    </Pressable>
                  )
                })}
              </Stack>
            )}
          </Stack>
        )}

        {/* No search — show categories + recommendations */}
        {debouncedQuery.length < 2 && (
          <>
            {/* RIASEC CTA if not completed */}
            {!hasRiasec && (
              <Card
                padding="md"
                style={{
                  backgroundColor: `${colors.blue[500]}10`,
                  borderWidth: 1,
                  borderColor: `${colors.blue[500]}30`,
                }}
              >
                <Stack gap={8}>
                  <Row gap={8} align="center">
                    <TrendingUp size={20} color={colors.blue[500]} />
                    <Text style={{ color: colors.text[theme].primary, fontWeight: '600' }}>
                      Get Personalized Recommendations
                    </Text>
                  </Row>
                  <Text style={{ color: colors.text[theme].secondary, fontSize: 13 }}>
                    Complete your RIASEC career interests assessment to get matched with careers
                    tailored to your interests.
                  </Text>
                  <Button
                    size="sm"
                    color="primary"
                    onPress={() => router.push(ROUTES.DASHBOARD.ASSESSMENTS.RIASEC.path)}
                  >
                    Take Assessment
                  </Button>
                </Stack>
              </Card>
            )}

            {/* Saved occupations */}
            {selectedOccupations.length > 0 && (
              <Stack gap={8}>
                <Text style={{ color: colors.text[theme].secondary, fontWeight: '600' }}>
                  Your Target Careers
                </Text>
                {selectedOccupations.map((occ) => (
                  <Pressable
                    key={occ.onet_code}
                    onPress={() => handleOccupationPress(occ.onet_code)}
                  >
                    <Card
                      padding="md"
                      style={{
                        backgroundColor: colors.bg[theme].default,
                        borderWidth: 1,
                        borderColor: colors.border[theme].active,
                      }}
                    >
                      <Row gap={12} align="center">
                        <Star size={18} color={colors.warning[500]} fill={colors.warning[500]} />
                        <Stack style={{ flex: 1 }}>
                          <Text style={{ color: colors.text[theme].primary }}>{occ.title}</Text>
                          <Text style={{ color: colors.text[theme].tertiary, fontSize: 12 }}>
                            {occ.onet_code}
                          </Text>
                        </Stack>
                        <ChevronRight size={16} color={colors.icon[theme].default} />
                      </Row>
                    </Card>
                  </Pressable>
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
    </ScrollView>
  )
}
