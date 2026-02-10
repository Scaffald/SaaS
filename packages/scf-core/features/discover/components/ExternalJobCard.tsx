import { ROUTES, buildPath } from '@scf/core/constants/routes'
import { DiscoverCard } from '@unicornlove/beyond-ui'
import { Building2, Clock, DollarSign, MapPin } from '@tamagui/lucide-icons'
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
      padding="$4"
      gap="$3"
    >
      {/* Header */}
      <Row gap="$3" alignItems="flex-start">
        {job.company_logo ? (
          <Stack
            width={48}
            height={48}
            borderRadius="$2"
            overflow="hidden"
            backgroundColor="$color3"
            alignItems="center"
            justifyContent="center"
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
            borderRadius="$2"
            backgroundColor="$blue4"
            alignItems="center"
            justifyContent="center"
          >
            <Building2 size={24} color="$blue10" />
          </Stack>
        )}

        <Stack flex={1} gap="$1">
          <Text fontSize="$6" fontWeight="600" color="$color12">
            {job.title}
          </Text>
          {job.company_name && (
            <Text fontSize="$4" color="$color11">
              {job.company_name}
            </Text>
          )}
        </Stack>

        {job.featured && (
          <Stack
            paddingHorizontal="$2"
            paddingVertical="$1"
            borderRadius="$2"
            backgroundColor="$blue5"
          >
            <Text fontSize="$2" fontWeight="600" color="$blue11">
              FEATURED
            </Text>
          </Stack>
        )}
      </Row>

      {/* Meta Info */}
      <Row gap="$4" flexWrap="wrap">
        {job.job_location && (
          <Row gap="$2" alignItems="center">
            <MapPin size={16} color="$color10" />
            <Text fontSize="$3" color="$color11">
              {job.job_location}
            </Text>
          </Row>
        )}

        {job.job_type && (
          <Row gap="$2" alignItems="center">
            <Clock size={16} color="$color10" />
            <Text fontSize="$3" color="$color11">
              {job.job_type}
            </Text>
          </Row>
        )}

        {compensation && (
          <Row gap="$2" alignItems="center">
            <DollarSign size={16} color="$color10" />
            <Text fontSize="$3" color="$color11">
              {compensation}
            </Text>
          </Row>
        )}

        {postedDate && (
          <Text fontSize="$3" color="$color10">
            {postedDate}
          </Text>
        )}
      </Row>

      {/* Description */}
      {job.description && (
        <Text fontSize="$3" color="$color11" numberOfLines={3} ellipsizeMode="tail">
          {job.description}
        </Text>
      )}

      {/* Tags */}
      <Row gap="$2" flexWrap="wrap">
        {primaryIndustry && (
          <Stack
            paddingHorizontal="$2"
            paddingVertical="$1"
            borderRadius="$2"
            backgroundColor="$blue3"
          >
            <Text fontSize="$2" color="$blue11">
              {primaryIndustry}
            </Text>
          </Stack>
        )}
        {job.job_category && (
          <Stack
            paddingHorizontal="$2"
            paddingVertical="$1"
            borderRadius="$2"
            backgroundColor="$color3"
          >
            <Text fontSize="$2" color="$color11">
              {job.job_category}
            </Text>
          </Stack>
        )}
      </Row>

      <Separator />

      {/* Actions */}
      <Row gap="$2" justifyContent="flex-end">
        <Button
          size="$3"
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
