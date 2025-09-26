import {
  Avatar,
  Paragraph,
  Settings,
  SizableText,
  XStack,
  YStack,
  useToastController,
} from '@app/ui'
import {
  CheckCircle2,
  Circle,
  Cog,
  FileText,
  LogOut,
  PhoneCall,
  ShieldCheck,
  User,
  Wrench,
} from '@tamagui/lucide-icons'
import type { IconProps } from '@tamagui/helpers-icon'
import type { ThemeName } from 'tamagui'
import { SolitoImage } from 'solito/image'
import { useLink } from 'solito/link'

import { useSupabase } from '@app/core/utils/supabase/useSupabase'

export type ProfileSection = {
  id: string
  label: string
  icon: React.FC<IconProps>
  accentTheme: ThemeName
}

export type ProfileChecklistItem = {
  id: string
  label: string
  isCompleted: boolean
}

export const PROFILE_SECTIONS: ProfileSection[] = [
  { id: 'overview', label: 'Overview', icon: User, accentTheme: 'blue' },
  { id: 'basic-info', label: 'Basic information', icon: FileText, accentTheme: 'green' },
  { id: 'work-skills', label: 'Work & skills', icon: Wrench, accentTheme: 'orange' },
  { id: 'travel-compliance', label: 'Travel & compliance', icon: ShieldCheck, accentTheme: 'purple' },
  { id: 'contact-availability', label: 'Contact & availability', icon: PhoneCall, accentTheme: 'pink' },
]

type ProfileLayoutProps = {
  sections?: ProfileSection[]
  activeSectionId?: string
  onNavigate?: (sectionId: string) => void
  checklist?: ProfileChecklistItem[]
  completionPercentage?: number
  avatarUrl?: string
  fullName?: string
  children?: React.ReactNode
}

export const ProfileLayout = ({
  sections = PROFILE_SECTIONS,
  activeSectionId,
  onNavigate,
  checklist,
  completionPercentage,
  avatarUrl,
  fullName,
  children,
}: ProfileLayoutProps) => {
  return (
    <XStack gap="$6" ai="flex-start" $md={{ fd: 'column' }}>
      <ProfileSidebar
        sections={sections}
        activeSectionId={activeSectionId}
        onNavigate={onNavigate}
        checklist={checklist}
        completionPercentage={completionPercentage}
        avatarUrl={avatarUrl}
        fullName={fullName}
      />
      {children ? <YStack f={1} gap="$8" flexBasis={0}>{children}</YStack> : null}
    </XStack>
  )
}

type ProfileSidebarProps = {
  sections: ProfileSection[]
  activeSectionId?: string
  onNavigate?: (sectionId: string) => void
  checklist?: ProfileChecklistItem[]
  completionPercentage?: number
  avatarUrl?: string
  fullName?: string
}

export const ProfileSidebar = ({
  sections,
  activeSectionId,
  onNavigate,
  checklist,
  completionPercentage,
  avatarUrl,
  fullName,
}: ProfileSidebarProps) => {
  return (
    <YStack
      w={300}
      gap="$6"
      p="$4"
      br="$6"
      bg="$color1"
      borderColor="$color4"
      borderWidth={1}
      $md={{ w: '100%' }}
    >
      <YStack gap="$3" ai="center">
        <Avatar circular size={120} br="$10" overflow="hidden">
          {avatarUrl ? <SolitoImage src={avatarUrl} alt="Profile avatar" width={120} height={120} /> : null}
        </Avatar>
        <SizableText size="$4" fontWeight="700" ta="center">
          {fullName || 'Your profile'}
        </SizableText>
      </YStack>

      <SettingsMenu sections={sections} activeSectionId={activeSectionId} onNavigate={onNavigate} />

      {checklist && completionPercentage != null ? (
        <ProfileProgressCard checklist={checklist} completionPercentage={completionPercentage} />
      ) : null}
    </YStack>
  )
}

type SettingsMenuProps = {
  sections: ProfileSection[]
  activeSectionId?: string
  onNavigate?: (sectionId: string) => void
}

export const SettingsMenu = ({ sections, activeSectionId, onNavigate }: SettingsMenuProps) => {
  const supabase = useSupabase()
  const settingsLink = useLink({ href: '/settings' })
  const toast = useToastController()

  return (
    <Settings>
      <Settings.Items>
        <Settings.Group>
          {sections.map((section) => (
            <Settings.Item
              key={section.id}
              icon={section.icon}
              isActive={section.id === activeSectionId}
              accentTheme={section.accentTheme}
              onPress={() => onNavigate?.(section.id)}
            >
              {section.label}
            </Settings.Item>
          ))}
        </Settings.Group>
        <Settings.Group>
          <Settings.Item icon={Cog} {...settingsLink}>
            Account settings
          </Settings.Item>
          <Settings.Item
            icon={LogOut}
            accentTheme="red"
            onPress={async () => {
              const { error } = await supabase.auth.signOut()
              if (error) {
                toast.show('Unable to sign out', {
                  message: error.message,
                })
              }
            }}
          >
            Sign out
          </Settings.Item>
        </Settings.Group>
      </Settings.Items>
    </Settings>
  )
}

type ProfileProgressCardProps = {
  checklist: ProfileChecklistItem[]
  completionPercentage: number
}

export const ProfileProgressCard = ({ checklist, completionPercentage }: ProfileProgressCardProps) => {
  return (
    <YStack gap="$4" p="$4" br="$6" borderColor="$color4" borderWidth={1}>
      <YStack gap="$1">
        <Paragraph size="$2" color="$gray11">
          Profile completion
        </Paragraph>
        <SizableText size="$6" fontWeight="700">
          {completionPercentage}% complete
        </SizableText>
      </YStack>
      <YStack gap="$2">
        {checklist.map((item) => (
          <XStack key={item.id} ai="center" gap="$3">
            {item.isCompleted ? (
              <CheckCircle2 size={18} color="$green10" />
            ) : (
              <Circle size={18} color="$gray8" />
            )}
            <Paragraph size="$2" color="$gray11">
              {item.label}
            </Paragraph>
          </XStack>
        ))}
      </YStack>
    </YStack>
  )
}

type ProfileSectionContainerProps = {
  id: string
  title: string
  description: string
  registerRef?: (node: HTMLElement | null) => void
  children: React.ReactNode
}

export const ProfileSectionContainer = ({
  id,
  title,
  description,
  registerRef,
  children,
}: ProfileSectionContainerProps) => {
  return (
    <YStack id={id} gap="$4" ref={registerRef}>
      <YStack gap="$1">
        <SizableText size="$5" fontWeight="700">
          {title}
        </SizableText>
        <Paragraph size="$3" color="$gray11">
          {description}
        </Paragraph>
      </YStack>
      <YStack gap="$4" p="$4" br="$6" borderWidth={1} borderColor="$color4">
        {children}
      </YStack>
    </YStack>
  )
}
