import { Award, BadgeCheck, Clock3, DollarSign, MapPin, Star, User } from 'lucide-react-native'
import type { ComponentRef } from 'react'
import { forwardRef, memo } from 'react'
import { Image, View } from 'react-native'
import { Card, Text, Row, Stack, Separator, useThemeContext } from '@scaffald/ui'

// Brand-aligned color tokens (warm stone + primary teal)
const T = {
  light: {
    avatarBg: '#e8f6f9',       // primary.50
    avatarIcon: '#1d7282',     // primary.500
    scoreBg: '#e8f6f9',        // primary.50
    scoreText: '#1d7282',      // primary.500
    rate: '#1d7282',           // primary.500
    meta: '#6e6760',           // gray.500
    metaDot: '#cdc8c0',        // gray.300
    subtitle: '#6e6760',       // gray.500
    skillBg: '#f1efeb',        // gray.100
    skillText: '#504940',      // gray.600
    certBg: '#e8f6f9',         // primary.50
    certText: '#034550',       // primary.700
    selectedBorder: '#1e96a8', // primary.400
    placeholderBg: '#f1efeb',  // gray.100
    overflow: '#9e9790',       // gray.400
  },
  dark: {
    avatarBg: '#022d38',       // primary.800
    avatarIcon: '#3fb5c7',     // primary.300
    scoreBg: '#022d38',        // primary.800
    scoreText: '#3fb5c7',      // primary.300
    rate: '#3fb5c7',           // primary.300
    meta: '#9e9790',           // gray.400
    metaDot: '#504940',        // gray.600
    subtitle: '#9e9790',       // gray.400
    skillBg: '#3c352c',        // gray.700
    skillText: '#cdc8c0',      // gray.300
    certBg: '#022d38',         // primary.800
    certText: '#7fd1de',       // primary.200
    selectedBorder: '#3fb5c7', // primary.300
    placeholderBg: '#3c352c',  // gray.700
    overflow: '#6e6760',       // gray.500
  },
} as const

export interface ProfileBadge {
  id: string
  label: string
  tone: 'success' | 'warning' | 'danger'
}

export interface ProfileCardProps {
  id: string
  name: string
  title?: string
  score?: number
  experienceYears?: number
  hourlyRate?: number
  locationLabel?: string
  avatarUrl?: string | null
  badges?: ProfileBadge[]
  certifications?: string[]
  skills?: string[]
  isSelected?: boolean
  onPress?: (id: string) => void
  variant?: 'compact' | 'full'
}

export const ProfileCard = memo(
  forwardRef<ComponentRef<typeof View>, ProfileCardProps>(
    (
      {
        id,
        name,
        title,
        score,
        experienceYears,
        hourlyRate,
        locationLabel,
        avatarUrl,
        badges = [],
        certifications = [],
        skills = [],
        isSelected = false,
        onPress,
        variant = 'full',
      },
      forwardedRef
    ) => {
      const { theme } = useThemeContext()
      const c = T[theme === 'dark' ? 'dark' : 'light']
      const isCompact = variant === 'compact'

      const metricParts: string[] = []
      if (experienceYears) metricParts.push(`${experienceYears} yrs`)
      if (hourlyRate) metricParts.push(`$${hourlyRate}/hr`)
      if (locationLabel) metricParts.push(locationLabel)

      return (
        <View ref={forwardedRef}>
          <Card
            pressable={!!onPress}
            onPress={onPress ? () => onPress(id) : undefined}
            padding="md"
            variant={isSelected ? 'elevated' : 'surface'}
            style={[
              isSelected && {
                borderColor: c.selectedBorder,
                borderWidth: 1,
              },
            ]}
          >
            <Stack gap={isCompact ? 10 : 12}>
              {/* Header: Avatar + Name + Score */}
              <Row gap={12} align="center">
                {avatarUrl ? (
                  <View
                    style={{
                      width: isCompact ? 44 : 48,
                      height: isCompact ? 44 : 48,
                      borderRadius: isCompact ? 22 : 12,
                      overflow: 'hidden',
                      backgroundColor: c.placeholderBg,
                    }}
                  >
                    <Image
                      source={{ uri: avatarUrl }}
                      style={{ width: '100%', height: '100%' }}
                      resizeMode="cover"
                    />
                  </View>
                ) : (
                  <View
                    style={{
                      width: isCompact ? 44 : 48,
                      height: isCompact ? 44 : 48,
                      borderRadius: isCompact ? 22 : 12,
                      backgroundColor: c.avatarBg,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <User size={isCompact ? 20 : 22} color={c.avatarIcon} />
                  </View>
                )}

                <Stack flex={1} gap={2}>
                  <Text
                    style={{ fontWeight: '600', fontSize: isCompact ? 14 : 15 }}
                    numberOfLines={1}
                  >
                    {name}
                  </Text>
                  {title && (
                    <Text
                      style={{ fontSize: 13, color: c.subtitle }}
                      numberOfLines={isCompact ? 1 : 2}
                    >
                      {title}
                    </Text>
                  )}
                </Stack>

                {score != null && score > 0 && (
                  <View
                    style={{
                      backgroundColor: c.scoreBg,
                      borderRadius: 8,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Star size={12} color={c.scoreText} />
                    <Text style={{ fontSize: 12, fontWeight: '700', color: c.scoreText }}>
                      {score}
                    </Text>
                  </View>
                )}
              </Row>

              {/* Metrics row */}
              {metricParts.length > 0 && (
                <Row gap={6} align="center" wrap>
                  {experienceYears != null && experienceYears > 0 && (
                    <>
                      <Clock3 size={14} color={c.meta} />
                      <Text style={{ fontSize: 13, color: c.meta }}>
                        {experienceYears} yrs
                      </Text>
                    </>
                  )}
                  {hourlyRate != null && hourlyRate > 0 && (
                    <>
                      {experienceYears != null && experienceYears > 0 && (
                        <Text style={{ fontSize: 13, color: c.metaDot }}>·</Text>
                      )}
                      <DollarSign size={14} color={c.rate} />
                      <Text style={{ fontSize: 13, color: c.rate }}>${hourlyRate}/hr</Text>
                    </>
                  )}
                  {locationLabel && (
                    <>
                      {(experienceYears != null && experienceYears > 0) ||
                      (hourlyRate != null && hourlyRate > 0) ? (
                        <Text style={{ fontSize: 13, color: c.metaDot }}>·</Text>
                      ) : null}
                      <MapPin size={14} color={c.meta} />
                      <Text
                        style={{ fontSize: 13, color: c.meta, flex: 1 }}
                        numberOfLines={1}
                      >
                        {locationLabel}
                      </Text>
                    </>
                  )}
                </Row>
              )}

              {/* --- Full variant only below --- */}
              {!isCompact && (badges.length > 0 || skills.length > 0 || certifications.length > 0) && (
                <>
                  <Separator />

                  {badges.length > 0 && (
                    <Row gap={6} wrap>
                      {badges.slice(0, 3).map((badge) => (
                        <Row
                          key={badge.id}
                          align="center"
                          gap={4}
                          style={{
                            paddingHorizontal: 8,
                            paddingVertical: 3,
                            borderRadius: 6,
                            backgroundColor:
                              badge.tone === 'success'
                                ? '#dcfce7'
                                : badge.tone === 'warning'
                                  ? '#fef9c3'
                                  : '#fee2e2',
                          }}
                        >
                          {badge.tone === 'success' ? (
                            <BadgeCheck size={14} color="#16a34a" />
                          ) : (
                            <Award size={14} color={badge.tone === 'warning' ? '#ca8a04' : '#dc2626'} />
                          )}
                          <Text
                            style={{
                              fontSize: 12,
                              color:
                                badge.tone === 'success'
                                  ? '#16a34a'
                                  : badge.tone === 'warning'
                                    ? '#ca8a04'
                                    : '#dc2626',
                            }}
                          >
                            {badge.label}
                          </Text>
                        </Row>
                      ))}
                      {badges.length > 3 && (
                        <Text style={{ fontSize: 12, color: c.overflow, alignSelf: 'center' }}>
                          +{badges.length - 3}
                        </Text>
                      )}
                    </Row>
                  )}

                  {(skills.length > 0 || certifications.length > 0) && (
                    <Row gap={4} wrap>
                      {certifications.slice(0, 2).map((cert) => (
                        <View
                          key={cert}
                          style={{
                            backgroundColor: c.certBg,
                            paddingHorizontal: 8,
                            paddingVertical: 3,
                            borderRadius: 6,
                          }}
                        >
                          <Text style={{ fontSize: 12, color: c.certText }}>{cert}</Text>
                        </View>
                      ))}
                      {skills.slice(0, 3).map((skill) => (
                        <View
                          key={skill}
                          style={{
                            backgroundColor: c.skillBg,
                            paddingHorizontal: 8,
                            paddingVertical: 3,
                            borderRadius: 6,
                          }}
                        >
                          <Text style={{ fontSize: 12, color: c.skillText }}>{skill}</Text>
                        </View>
                      ))}
                      {certifications.length + skills.length > 5 && (
                        <Text style={{ fontSize: 12, color: c.overflow, alignSelf: 'center' }}>
                          +{certifications.length + skills.length - 5}
                        </Text>
                      )}
                    </Row>
                  )}
                </>
              )}

              {isCompact && skills.length > 0 && (
                <Row gap={4} wrap>
                  {skills.slice(0, 3).map((skill) => (
                    <View
                      key={skill}
                      style={{
                        backgroundColor: c.skillBg,
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 6,
                      }}
                    >
                      <Text style={{ fontSize: 11, color: c.skillText }}>{skill}</Text>
                    </View>
                  ))}
                  {skills.length > 3 && (
                    <Text style={{ fontSize: 11, color: c.overflow, alignSelf: 'center' }}>
                      +{skills.length - 3}
                    </Text>
                  )}
                </Row>
              )}
            </Stack>
          </Card>
        </View>
      )
    }
  )
)

ProfileCard.displayName = 'ProfileCard'
