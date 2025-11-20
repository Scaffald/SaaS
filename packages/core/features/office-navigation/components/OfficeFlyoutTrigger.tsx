import { Button } from 'tamagui'
import { Popover } from '@app/ui'
import { Briefcase } from '@tamagui/lucide-icons'
import { OfficeFlyoutMenu } from './OfficeFlyoutMenu'
import { useOfficeFlyoutMenu } from '../hooks/useOfficeFlyoutMenu'

export interface OfficeFlyoutTriggerProps {
  isOpen: boolean
  onToggle: () => void
  triggerRef: React.RefObject<HTMLElement | null>
}

export const OfficeFlyoutTrigger = ({ isOpen, onToggle, triggerRef }: OfficeFlyoutTriggerProps) => {
  const handlePress = () => {
    onToggle()
  }

  return (
    <Popover.Trigger asChild>
      <Button
        ref={triggerRef}
        borderStyle="unset"
        borderWidth={0}
        bg="transparent"
        height={30}
        px="$2"
        display="none"
        $md={{ display: 'flex' }}
        aria-label="Office navigation menu"
        aria-expanded={isOpen}
        onPress={handlePress}
        hoverStyle={{ bg: '$color3' }}
        pressStyle={{ bg: '$color4' }}
        cursor="pointer"
      >
        <Briefcase size={20} color="$color12" />
      </Button>
    </Popover.Trigger>
  )
}

// Main export component that combines trigger and menu
export const OfficeFlyout = () => {
  const { isOpen, setIsOpen, activeRoute, toggleMenu, triggerRef } = useOfficeFlyoutMenu()

  const handleNavigate = () => {
    setIsOpen(false)
  }

  return (
    <Popover placement="bottom-end" open={isOpen} onOpenChange={setIsOpen}>
      <OfficeFlyoutTrigger isOpen={isOpen} onToggle={toggleMenu} triggerRef={triggerRef} />
      <OfficeFlyoutMenu
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        pathname={activeRoute}
        onNavigate={handleNavigate}
        triggerRef={triggerRef}
      />
    </Popover>
  )
}
