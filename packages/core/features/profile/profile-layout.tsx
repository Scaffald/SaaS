import { SidebarMenu, type MenuItem, useToastController } from '@app/ui'
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
import { ROUTES, DASHBOARD_ROUTES } from '@app/core/constants/routes'

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
  {
    id: 'travel-compliance',
    label: 'Travel & compliance',
    icon: ShieldCheck,
    accentTheme: 'purple',
  },
  {
    id: 'contact-availability',
    label: 'Contact & availability',
    icon: PhoneCall,
    accentTheme: 'pink',
  },
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
    <XStack gap="$6" ai="flex-start" $sm={{ fd: 'column' }}>
      <ProfileSidebar
        sections={sections}
        activeSectionId={activeSectionId}
        onNavigate={onNavigate}
        checklist={checklist}
        completionPercentage={completionPercentage}
        avatarUrl={avatarUrl}
        fullName={fullName}
      />
      {children ? (
        <YStack
          f={1}
          gap="$8"
          flexBasis={0}
          $gtSm={{
            w: '100%',
            maw: 800,
            als: 'center',
          }}
          $gtLg={{
            maw: 900,
          }}
        >
          {children}
        </YStack>
      ) : null}
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

export const ProfileSidebar = ({ sections, activeSectionId, onNavigate }: ProfileSidebarProps) => {
  return (
    <SettingsMenu sections={sections} activeSectionId={activeSectionId} onNavigate={onNavigate} />
  )
}

type SettingsMenuProps = {
  sections: ProfileSection[]
  activeSectionId?: string
  onNavigate?: (sectionId: string) => void
}

export const SettingsMenu = ({ sections, activeSectionId, onNavigate }: SettingsMenuProps) => {
  const supabase = useSupabase()
  const settingsLink = useLink({
    href: DASHBOARD_ROUTES.SETTINGS?.fullPath || '/dashboard/settings',
  })
  const toast = useToastController()

  const menuItems: MenuItem[] = [
    ...sections.map((section) => ({
      id: section.id,
      label: section.label,
      icon: section.icon,
      accentTheme: section.accentTheme,
      isActive: section.id === activeSectionId,
      onPress: () => onNavigate?.(section.id),
    })),
    {
      id: 'account-settings',
      label: 'Account settings',
      icon: Cog,
      href: settingsLink.href,
      showSeparator: true,
    },
    {
      id: 'sign-out',
      label: 'Sign out',
      icon: LogOut,
      accentTheme: 'red',
      onPress: async () => {
        const { error } = await supabase.auth.signOut()
        if (error) {
          toast.show('Unable to sign out', {
            message: error.message,
          })
        }
      },
    },
  ]

  return <SidebarMenu items={menuItems} />
}

type ProfileProgressCardProps = {
  checklist: ProfileChecklistItem[]
  completionPercentage: number
}

export const ProfileProgressCard = ({
  checklist,
  completionPercentage,
}: ProfileProgressCardProps) => {
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
