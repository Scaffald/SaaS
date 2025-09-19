import { CalendarClock } from '@tamagui/lucide-icons'
import { Paragraph, SizableText, XStack, YStack } from '@my/ui'

import { DashboardCard, SectionHeading } from '../primitives'

export type Certification = {
  id: string
  title: string
  issuer: string
  status?: string
}

export type CertificationSpotlightCardProps = {
  certifications: Certification[]
}

export const CertificationSpotlightCard = ({ certifications }: CertificationSpotlightCardProps) => {
  return (
    <DashboardCard gap="$4">
      <SectionHeading
        title="Get Certified"
        subtitle="Stand out to employers with verified training credentials."
        icon={<CalendarClock size={18} color="var(--color-gray11)" />}
      />
      <XStack gap="$3" $md={{ fd: 'column' }}>
        {certifications.map((cert) => (
          <YStack
            key={cert.id}
            f={1}
            gap="$2"
            p="$4"
            br="$4"
            bw={1}
            boc="$borderColor"
            bg="$color2"
          >
            <SizableText size="$3" fontWeight="600">
              {cert.title}
            </SizableText>
            <Paragraph size="$2" color="$gray11">
              {cert.issuer}
            </Paragraph>
            {cert.status ? (
              <SizableText size="$1" color="$gray10">
                {cert.status}
              </SizableText>
            ) : null}
          </YStack>
        ))}
      </XStack>
    </DashboardCard>
  )
}
