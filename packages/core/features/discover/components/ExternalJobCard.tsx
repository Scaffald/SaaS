import { Card, XStack, YStack, Text, Button, Separator } from 'tamagui'
import { Building2, MapPin, Clock, DollarSign, ExternalLink } from '@tamagui/lucide-icons'
import { Linking } from 'react-native'

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
  onViewDetails: (job: ExternalJob) => void
}

export function ExternalJobCard({ job, onViewDetails }: ExternalJobCardProps) {
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
    <Card
      elevate
      bordered
      p="$4"
      gap="$3"
      hoverStyle={{
        borderColor: '$blue8',
        scale: 1.01,
      }}
      pressStyle={{
        scale: 0.99,
      }}
      animation="quick"
      bg={job.featured ? '$blue2' : '$background'}
      borderColor={job.featured ? '$blue6' : '$color5'}
    >
      {/* Header */}
      <XStack gap="$3" items="flex-start">
        {job.company_logo ? (
          <YStack
            width={48}
            height={48}
            rounded="$2"
            overflow="hidden"
            bg="$color3"
            items="center"
            justify="center"
          >
            <img
              src={job.company_logo}
              alt={job.company_name || 'Company'}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </YStack>
        ) : (
          <YStack width={48} height={48} rounded="$2" bg="$blue4" items="center" justify="center">
            <Building2 size={24} color="$blue10" />
          </YStack>
        )}

        <YStack flex={1} gap="$1">
          <Text fontSize="$6" fontWeight="600" color="$color12">
            {job.title}
          </Text>
          {job.company_name && (
            <Text fontSize="$4" color="$color11">
              {job.company_name}
            </Text>
          )}
        </YStack>

        {job.featured && (
          <YStack px="$2" py="$1" rounded="$2" bg="$blue5">
            <Text fontSize="$2" fontWeight="600" color="$blue11">
              FEATURED
            </Text>
          </YStack>
        )}
      </XStack>

      {/* Meta Info */}
      <XStack gap="$4" flexWrap="wrap">
        {job.job_location && (
          <XStack gap="$2" items="center">
            <MapPin size={16} color="$color10" />
            <Text fontSize="$3" color="$color11">
              {job.job_location}
            </Text>
          </XStack>
        )}

        {job.job_type && (
          <XStack gap="$2" items="center">
            <Clock size={16} color="$color10" />
            <Text fontSize="$3" color="$color11">
              {job.job_type}
            </Text>
          </XStack>
        )}

        {compensation && (
          <XStack gap="$2" items="center">
            <DollarSign size={16} color="$color10" />
            <Text fontSize="$3" color="$color11">
              {compensation}
            </Text>
          </XStack>
        )}

        {postedDate && (
          <Text fontSize="$3" color="$color10">
            {postedDate}
          </Text>
        )}
      </XStack>

      {/* Description */}
      {job.description && (
        <Text fontSize="$3" color="$color11" numberOfLines={3} ellipsizeMode="tail">
          {job.description}
        </Text>
      )}

      {/* Tags */}
      <XStack gap="$2" flexWrap="wrap">
        {primaryIndustry && (
          <YStack px="$2" py="$1" rounded="$2" bg="$blue3">
            <Text fontSize="$2" color="$blue11">
              {primaryIndustry}
            </Text>
          </YStack>
        )}
        {job.job_category && (
          <YStack px="$2" py="$1" rounded="$2" bg="$color3">
            <Text fontSize="$2" color="$color11">
              {job.job_category}
            </Text>
          </YStack>
        )}
      </XStack>

      <Separator />

      {/* Actions */}
      <XStack gap="$2" justify="flex-end">
        <Button size="$3" theme="blue" onPress={() => onViewDetails(job)}>
          View Details
        </Button>
      </XStack>
    </Card>
  )
}
