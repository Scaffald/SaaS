import { Row, Stack, Text, useResponsive } from '@scaffald/ui'
import { View } from 'react-native'
import { AUTH_ROUTES } from '../../../constants/routes'
import { brand, layout } from '../theme'
import { CtaLink } from './CtaLink'
import { MarketingHeading } from './MarketingHeading'
import { TradeTicker } from './TradeTicker'

const TRADES = [
  'MEP Trades',
  'Estimators',
  'Project Managers',
  'Robotics',
  'Engineers',
  'Architects',
  'Machinists',
  'Technicians',
  'Heavy Equipment Operators',
  'Security Specialists',
  'Linemen',
  'Leadership',
  'Installers',
  'Mechanics',
]

export function Hero() {
  const { isMobile, select } = useResponsive()
  const titleSize = select({ base: 38, xs: 44, sm: 52, md: 60, lg: 68 }) ?? 38

  return (
    <View style={{ backgroundColor: brand.deep, overflow: 'hidden' }}>
      <Stack
        align="center"
        style={{
          width: '100%',
          maxWidth: layout.maxWidth,
          marginHorizontal: 'auto',
          paddingHorizontal: layout.gutter,
          paddingTop: isMobile ? 56 : 96,
          paddingBottom: 64,
        }}
      >
        <Row
          align="center"
          gap={8}
          style={{
            backgroundColor: 'rgba(29,114,130,0.3)',
            borderWidth: 1,
            borderColor: 'rgba(63,181,199,0.3)',
            borderRadius: 999,
            paddingHorizontal: 16,
            paddingVertical: 6,
            marginBottom: 32,
          }}
        >
          <View
            style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: brand.tealBright }}
          />
          <Text size="sm" weight="medium" color={brand.tealPale}>
            Now available for iOS &amp; Android
          </Text>
        </Row>

        <MarketingHeading
          level={1}
          align="center"
          color="#ffffff"
          style={{
            fontSize: titleSize,
            lineHeight: titleSize * 1.1,
            letterSpacing: -0.5,
            maxWidth: 900,
            marginBottom: 24,
          }}
        >
          Connecting skilled trade workers to great employers
        </MarketingHeading>

        <Text
          align="center"
          color={brand.tealSoft}
          style={{
            fontSize: isMobile ? 16 : 19,
            lineHeight: isMobile ? 26 : 30,
            maxWidth: 640,
            marginBottom: 40,
          }}
        >
          Scaffald is a comprehensive talent platform designed to streamline the process of finding,
          hiring, and managing professionals in the trades. Advanced job matching, workflows, and
          review systems enhance workforce efficiency and reliability.
        </Text>

        <Stack
          gap={16}
          align="center"
          style={{
            flexDirection: isMobile ? 'column' : 'row',
            marginBottom: 32,
            width: isMobile ? '100%' : undefined,
          }}
        >
          <CtaLink
            href={`${AUTH_ROUTES.LOGIN.path}?intent=worker`}
            label="Create Your Worker Profile"
            variant="primary"
            fullWidth={isMobile}
          />
          <CtaLink
            href={`${AUTH_ROUTES.LOGIN.path}?intent=org`}
            label="Register your Organization"
            variant="ghost"
            fullWidth={isMobile}
          />
        </Stack>
      </Stack>

      <TradeTicker trades={TRADES} />
    </View>
  )
}
