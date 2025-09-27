import { Button } from '@app/ui'
import { Menu } from '@tamagui/lucide-icons'
import { DrawerActions } from '@react-navigation/native'

export type HamburgerMenuProps = {
  /**
   * Whether to show the hamburger button
   */
  showButton?: boolean
  /**
   * Navigation object for drawer actions
   */
  navigation?: any
}

export const HamburgerMenu = ({ showButton = true, navigation }: HamburgerMenuProps) => {
  const handleToggle = () => {
    if (navigation) {
      navigation.dispatch(DrawerActions.toggleDrawer())
    }
  }

  if (!showButton) {
    return null
  }

  return (
    <Button
      size="$4"
      chromeless
      icon={<Menu size={24} />}
      onPress={handleToggle}
      accessibilityLabel="Open menu"
      flexShrink={0}
    />
  )
}

export default HamburgerMenu
