import { ROUTES, buildPath } from '@scf/core/constants/routes'
import { Card, Text, Row, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { Building2, Clock, DollarSign, MapPin } from 'lucide-react-native'
import { useRouter } from 'expo-router'
import { Image, View } from 'react-native'
import {
  jobPalette,
  textSmall,
  textCaption,
  iconCircleStyle,
  MetricRow,
  Pill,
} from '@scf/core/components/ui'

export interface ExternalJob {
  id: string
  title: string
  company_name?: string
  company_logo?: string
  company_website?: string
  job_location?: string
  job_type?: string
  job_category?: string
  description?: string
  responsibilities?: string[]
  requirements?: string[]
  benefits?: string[]
  compensation_min?: number
  compensation_max?: number
  compensation_currency?: string
  compensation_period?: string
  posted_date?: string
  application_url: string
  external_url: string
  industries?: Array<{
    industry_name: string
    confidence_score: number
  }>
  featured?: boolean
}

interface ExternalJobCardProps {
  job: ExternalJob
}

function formatRelativeDate(dateString?: string): string | null {
  if (!dateString) return null
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  return date.toLocaleDateString()
}

function formatCompensation(job: ExternalJob): string | null {
  const currency = job.compensation_currency || 'USD'
  const symbol = currency === 'USD' ? '$' : currency

  if (job.compensation_min && job.compensation_max) {
    return `${symbol}${job.compensation_min.toLocaleString()} - ${symbol}${job.compensation_max.toLocaleString()}`
  }
  if (job.compensation_min) {
    return `${symbol}${job.compensation_min.toLocaleString()}+`
  }
  return null
}

export function ExternalJobCard({ job }: ExternalJobCardProps) {
  const router = useRouter()
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
  const pal = jobPalette[t]

  const compensation = formatCompensation(job)
  const postedDate = formatRelativeDate(job.posted_date)
  const primaryIndustry = job.industries?.[0]?.industry_name

  return (
    <Card
      pressable
      onPress={() =>
        router.push(buildPath(ROUTES.DASHBOARD.DISCOVER.JOBS.DETAIL, { id: job.id }))
      }
      padding="md"
      variant={job.featured ? 'elevated' : 'surface'}
    >
      <Stack gap={12}>
        {/* Header */}
        <Row gap={12} align="center">
          {job.company_logo ? (
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                overflow: 'hidden',
                backgroundColor: colors.gray[t === 'dark' ? 700 : 100],
              }}
            >
              <Image
                source={{ uri: job.company_logo }}
                style={{ width: 48, height: 48 }}
                resizeMode="cover"
              />
            </View>
          ) : (
            <View style={iconCircleStyle(48, pal.iconBg)}>
              <Building2 size={22} color={pal.iconFg} />
            </View>
          )}

          <Stack flex={1} gap={2}>
            <Text style={{ fontWeight: '600', fontSize: 15 }} numberOfLines={2}>
              {job.title}
            </Text>
            {job.company_name && (
              <Text
                style={{ ...textSmall, color: colors.text[t].tertiary }}
                numberOfLines={1}
              >
                {job.company_name}
              </Text>
            )}
          </Stack>

          {job.featured && (
            <Pill
              label="FEATURED"
              bgColor={colors.primary[t === 'dark' ? 800 : 50]}
              textColor={colors.primary[t === 'dark' ? 200 : 700]}
            />
          )}
        </Row>

        {/* Meta Info */}
        <Row gap={8} wrap>
          {job.job_location && <MetricRow icon={MapPin} text={job.job_location} theme={t} />}
          {job.job_type && <MetricRow icon={Clock} text={job.job_type} theme={t} />}
          {compensation && (
            <MetricRow icon={DollarSign} text={compensation} color={colors.success[500]} theme={t} />
          )}
        </Row>

        {/* Description */}
        {job.description && (
          <Text style={{ ...textSmall, color: colors.text[t].secondary }} numberOfLines={3}>
            {job.description}
          </Text>
        )}

        {/* Tags */}
        {(primaryIndustry || job.job_category) && (
          <Row gap={6} wrap>
            {primaryIndustry && (
              <Pill label={primaryIndustry} bgColor={pal.pillBg} textColor={pal.pillText} />
            )}
            {job.job_category && (
              <Pill
                label={job.job_category}
                bgColor={colors.bg[t].muted}
                textColor={colors.text[t].tertiary}
              />
            )}
          </Row>
        )}

        {/* Posted date */}
        {postedDate && (
          <Row justify="flex-end">
            <Text style={{ ...textCaption, color: colors.text[t].disabled }}>{postedDate}</Text>
          </Row>
        )}
      </Stack>
    </Card>
  )
}
