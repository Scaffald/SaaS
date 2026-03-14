import { Award, BadgeCheck, Clock3, DollarSign, MapPin, Star, User } from 'lucide-react-native'
import type { ComponentRef } from 'react'
import { forwardRef, memo } from 'react'
import { Image, View } from 'react-native'
import { Card, Text, Row, Stack, Separator, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import {
  workerPalette,
  badgeToneColors,
  textSmall,
  textCaption,
  pillStyle,
  iconCircleStyle,
  MetricDot,
  Pill,
  OverflowCount,
} from '@scf/core/components/ui'

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
      const t = theme === 'dark' ? 'dark' : 'light'
      const pal = workerPalette[t]
      const isCompact = variant === 'compact'

      const hasMetrics = (experienceYears ?? 0) > 0 || (hourlyRate ?? 0) > 0 || !!locationLabel

      return (
        <View ref={forwardedRef}>
          <Card
            pressable={!!onPress}
            onPress={onPress ? () => onPress(id) : undefined}
            padding="md"
            variant={isSelected ? 'elevated' : 'surface'}
            style={[isSelected && { borderColor: pal.selectedBorder, borderWidth: 1 }]}
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
                      backgroundColor: colors.gray[t === 'dark' ? 700 : 100],
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
                    style={iconCircleStyle(isCompact ? 44 : 48, pal.iconBg, isCompact ? 22 : 12)}
                  >
                    <User size={isCompact ? 20 : 22} color={pal.iconFg} />
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
                      style={{ ...textSmall, color: colors.text[t].tertiary }}
                      numberOfLines={isCompact ? 1 : 2}
                    >
                      {title}
                    </Text>
                  )}
                </Stack>

                {score != null && score > 0 && (
                  <View
                    style={{
                      backgroundColor: pal.iconBg,
                      borderRadius: 8,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Star size={12} color={pal.accent} />
                    <Text style={{ ...textCaption, fontWeight: '700', color: pal.accent }}>
                      {score}
                    </Text>
                  </View>
                )}
              </Row>

              {/* Metrics row */}
              {hasMetrics && (
                <Row gap={6} align="center" wrap>
                  {experienceYears != null && experienceYears > 0 && (
                    <>
                      <Clock3 size={14} color={colors.text[t].tertiary} />
                      <Text style={{ ...textSmall, color: colors.text[t].tertiary }}>
                        {experienceYears} yrs
                      </Text>
                    </>
                  )}
                  {hourlyRate != null && hourlyRate > 0 && (
                    <>
                      {experienceYears != null && experienceYears > 0 && <MetricDot theme={t} />}
                      <DollarSign size={14} color={pal.accent} />
                      <Text style={{ ...textSmall, color: pal.accent }}>${hourlyRate}/hr</Text>
                    </>
                  )}
                  {locationLabel && (
                    <>
                      {((experienceYears ?? 0) > 0 || (hourlyRate ?? 0) > 0) && (
                        <MetricDot theme={t} />
                      )}
                      <MapPin size={14} color={colors.text[t].tertiary} />
                      <Text
                        style={{ ...textSmall, color: colors.text[t].tertiary, flex: 1 }}
                        numberOfLines={1}
                      >
                        {locationLabel}
                      </Text>
                    </>
                  )}
                </Row>
              )}

              {/* --- Full variant only below --- */}
              {!isCompact &&
                (badges.length > 0 || skills.length > 0 || certifications.length > 0) && (
                  <>
                    <Separator />

                    {badges.length > 0 && (
                      <Row gap={6} wrap>
                        {badges.slice(0, 3).map((badge) => {
                          const tone = badgeToneColors[badge.tone]
                          return (
                            <Row
                              key={badge.id}
                              align="center"
                              gap={4}
                              style={{ ...pillStyle, backgroundColor: tone.bg }}
                            >
                              {badge.tone === 'success' ? (
                                <BadgeCheck size={14} color={tone.icon} />
                              ) : (
                                <Award size={14} color={tone.icon} />
                              )}
                              <Text style={{ ...textCaption, color: tone.text }}>
                                {badge.label}
                              </Text>
                            </Row>
                          )
                        })}
                        {badges.length > 3 && <OverflowCount count={badges.length - 3} theme={t} />}
                      </Row>
                    )}

                    {(skills.length > 0 || certifications.length > 0) && (
                      <Row gap={4} wrap>
                        {certifications.slice(0, 2).map((cert) => (
                          <Pill
                            key={cert}
                            label={cert}
                            bgColor={pal.pillBg}
                            textColor={pal.pillText}
                          />
                        ))}
                        {skills.slice(0, 3).map((skill) => (
                          <Pill
                            key={skill}
                            label={skill}
                            bgColor={pal.tagBg}
                            textColor={pal.tagText}
                          />
                        ))}
                        {certifications.length + skills.length > 5 && (
                          <OverflowCount
                            count={certifications.length + skills.length - 5}
                            theme={t}
                          />
                        )}
                      </Row>
                    )}
                  </>
                )}

              {isCompact && skills.length > 0 && (
                <Row gap={4} wrap>
                  {skills.slice(0, 3).map((skill) => (
                    <Pill
                      key={skill}
                      label={skill}
                      bgColor={pal.tagBg}
                      textColor={pal.tagText}
                      compact
                    />
                  ))}
                  {skills.length > 3 && <OverflowCount count={skills.length - 3} theme={t} />}
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
