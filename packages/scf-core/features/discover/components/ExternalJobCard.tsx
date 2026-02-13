import { ROUTES, buildPath } from '@scf/core/constants/routes'
import { DiscoverCard } from '@unicornlove/beyond-ui'
import { Building2, Clock, DollarSign, MapPin } from 'lucide-react-native'
import { useRouter } from 'expo-router'
import { Button, Separator, Text, Row, Stack } from '@unicornlove/beyond-ui'

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

export function ExternalJobCard({ job }: ExternalJobCardProps) {
  const router = useRouter()
  const formatDate = (dateString?: string) => {
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

  const formatCompensation = () => {
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

  const compensation = formatCompensation()
  const postedDate = formatDate(job.posted_date)
  const primaryIndustry = job.industries?.[0]?.industry_name

  return (
    <DiscoverCard
      variant={job.featured ? 'info' : 'neutral'}
      isSelected={job.featured}
      interactive={false}
      padding="md"
      gap={12}
    >
      {/* Header */}
      <Row gap={12} align="flex-start">
        {job.company_logo ? (
          <Stack
            width={48}
            height={48}
            borderRadius={8}
            overflow="hidden"
            backgroundColor="$color3"
            align="center"
            justify="center"
          >
            <img
              src={job.company_logo}
              alt={job.company_name || 'Company'}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </Stack>
        ) : (
          <Stack
            width={48}
            height={48}
            borderRadius={8}
            backgroundColor="$blue4"
            align="center"
            justify="center"
          >
            <Building2 size={24} color="$blue10" />
          </Stack>
        )}

        <Stack flex={1} gap={4}>
          <Text color="$gray11">{job.title}</Text>
          {job.company_name && <Text color="$gray11">{job.company_name}</Text>}
        </Stack>

        {job.featured && (
          <Stack
            paddingHorizontal={8}
            paddingVertical={4}
            borderRadius={8}
            backgroundColor="$blue5"
          >
            <Text color="$blue11">FEATURED</Text>
          </Stack>
        )}
      </Row>

      {/* Meta Info */}
      <Row gap={16} flexWrap="wrap">
        {job.job_location && (
          <Row gap={8} align="center">
            <MapPin size="md" color="$gray11" />
            <Text color="$gray11">{job.job_location}</Text>
          </Row>
        )}

        {job.job_type && (
          <Row gap={8} align="center">
            <Clock size="md" color="$gray11" />
            <Text color="$gray11">{job.job_type}</Text>
          </Row>
        )}

        {compensation && (
          <Row gap={8} align="center">
            <DollarSign size="md" color="$gray11" />
            <Text color="$gray11">{compensation}</Text>
          </Row>
        )}

        {postedDate && <Text color="$gray11">{postedDate}</Text>}
      </Row>

      {/* Description */}
      {job.description && (
        <Text color="$gray11" ellipsizeMode="tail">
          {job.description}
        </Text>
      )}

      {/* Tags */}
      <Row gap={8} flexWrap="wrap">
        {primaryIndustry && (
          <Stack
            paddingHorizontal={8}
            paddingVertical={4}
            borderRadius={8}
            backgroundColor="$blue3"
          >
            <Text color="$blue11">{primaryIndustry}</Text>
          </Stack>
        )}
        {job.job_category && (
          <Stack
            paddingHorizontal={8}
            paddingVertical={4}
            borderRadius={8}
            backgroundColor="$color3"
          >
            <Text color="$gray11">{job.job_category}</Text>
          </Stack>
        )}
      </Row>

      <Separator />

      {/* Actions */}
      <Row gap={8} justify="flex-end">
        <Button
          size="sm"
          theme="info"
          onPress={() =>
            router.push(buildPath(ROUTES.DASHBOARD.DISCOVER.JOBS.DETAIL, { id: job.id }))
          }
        >
          View Details
        </Button>
      </Row>
    </DiscoverCard>
  )
}
