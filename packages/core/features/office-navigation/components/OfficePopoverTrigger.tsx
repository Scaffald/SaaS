import { Popover } from '@app/ui'
import { Briefcase } from '@tamagui/lucide-icons'
import type { ElementRef } from 'react'
import { Button } from 'tamagui'
import { useOfficePopoverMenu } from '../hooks/useOfficePopoverMenu'
import { OfficePopoverMenu } from './OfficePopoverMenu'

type ButtonRef = ElementRef<typeof Button>

export interface OfficePopoverTriggerProps {
  isOpen: boolean
  onToggle: () => void
  triggerRef: React.RefObject<ButtonRef>
}

export const OfficePopoverTrigger = ({ isOpen, onToggle, triggerRef }: OfficePopoverTriggerProps) => {
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
export const OfficePopover = () => {
  const { isOpen, setIsOpen, activeRoute, toggleMenu, triggerRef } = useOfficePopoverMenu()

  const handleNavigate = () => {
    setIsOpen(false)
  }

  return (
    <Popover placement="bottom-end" open={isOpen} onOpenChange={setIsOpen}>
      <OfficePopoverTrigger isOpen={isOpen} onToggle={toggleMenu} triggerRef={triggerRef} />
      <OfficePopoverMenu
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        pathname={activeRoute}
        onNavigate={handleNavigate}
        triggerRef={triggerRef}
      />
    </Popover>
  )
}

