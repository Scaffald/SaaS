/**
 * SidebarUserProfile component
 * User profile display in the sidebar
 */

import { SidebarMenuItem, Avatar } from '@scaffald/ui';

export interface SidebarUserProfileProps {
  initials: string;
  displayName: string;
  supportingText: string;
  onPress?: () => void;
}

export function SidebarUserProfile({
  initials,
  displayName,
  supportingText,
  onPress,
}: SidebarUserProfileProps) {
  return (
    <SidebarMenuItem
      type="double"
      avatar={<Avatar initials={initials} size={40} />}
      label={displayName}
      supportingText={supportingText}
      onPress={onPress}
    />
  );
}
