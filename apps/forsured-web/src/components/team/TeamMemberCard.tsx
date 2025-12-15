/**
 * TeamMemberCard - Individual team member card component
 * REQ-283: Team Member Management UI
 * TASK-1: Create Team Members List Page
 *
 * Displays team member information in a card format with:
 * - Avatar/initials
 * - Name and email
 * - Role badge
 * - Action menu
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { MoreVertical, Edit, Trash2 } from 'lucide-react';
import { YStack, XStack, Text, Button, Card, SizableText } from '@unicornlove/ui';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'user' | 'broker' | 'subcontractor';
  company?: string;
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface TeamMemberCardProps {
  member: TeamMember;
  onEdit?: (member: TeamMember) => void;
  onRemove?: (member: TeamMember) => void;
  onClick?: (member: TeamMember) => void;
}

/**
 * Get role badge color based on role type
 */
function getRoleBadgeColor(role: TeamMember['role']): { bg: string; text: string } {
  switch (role) {
    case 'admin':
      return { bg: '$purple2', text: '$purple11' };
    case 'manager':
      return { bg: '$blue2', text: '$blue11' };
    case 'broker':
      return { bg: '$green2', text: '$green11' };
    case 'subcontractor':
      return { bg: '$orange2', text: '$orange11' };
    case 'user':
    default:
      return { bg: '$color2', text: '$color11' };
  }
}

/**
 * Get initials from name
 */
function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Format role for display
 */
function formatRole(role: TeamMember['role']): string {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export function TeamMemberCard({
  member,
  onEdit,
  onRemove,
  onClick,
}: TeamMemberCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCardClick = () => {
    onClick?.(member);
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    onEdit?.(member);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    onRemove?.(member);
  };

  const badgeColors = getRoleBadgeColor(member.role);

  return (
    <Card
      backgroundColor="$background"
      borderRadius="$4"
      elevation={1}
      borderWidth={1}
      borderColor="$borderColor"
      padding="$4"
      cursor="pointer"
      hoverStyle={{ elevation: 2 }}
      onPress={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleCardClick();
        }
      }}
      aria-label={`View ${member.name}'s profile`}
    >
      <XStack alignItems="flex-start" justifyContent="space-between">
        {/* Avatar and Info */}
        <XStack alignItems="center" gap="$3">
          {/* Avatar */}
          {member.avatar ? (
            <YStack
              width={48}
              height={48}
              borderRadius={9999}
              overflow="hidden"
              backgroundColor="$color3"
            >
              <img
                src={member.avatar}
                alt={member.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </YStack>
          ) : (
            <YStack
              width={48}
              height={48}
              borderRadius={9999}
              backgroundColor="$color3"
              alignItems="center"
              justifyContent="center"
            >
              <SizableText fontSize="$3" fontWeight="500" color="$color11">
                {getInitials(member.name)}
              </SizableText>
            </YStack>
          )}

          {/* Name and Email */}
          <YStack>
            <Text fontSize="$4" fontWeight="500" color="$color12">
              {member.name}
            </Text>
            <SizableText fontSize="$3" color="$color10">
              {member.email}
            </SizableText>
            {member.company && (
              <SizableText fontSize="$1" color="$color10" marginTop="$0.5">
                {member.company}
              </SizableText>
            )}
          </YStack>
        </XStack>

        {/* Role Badge and Menu */}
        <XStack alignItems="center" gap="$2">
          {/* Role Badge */}
          <YStack
            alignItems="center"
            paddingHorizontal="$2.5"
            paddingVertical="$0.5"
            borderRadius={9999}
            backgroundColor={badgeColors.bg as any}
          >
            <SizableText fontSize="$1" fontWeight="500" color={badgeColors.text as any}>
              {formatRole(member.role)}
            </SizableText>
          </YStack>

          {/* Action Menu */}
          {(onEdit || onRemove) && (
            <YStack position="relative" ref={menuRef}>
              <Button
                onPress={handleMenuClick}
                variant="outlined"
                size="$2"
                padding="$1"
                aria-label="More options"
                aria-expanded={showMenu}
                aria-haspopup="menu"
              >
                <MoreVertical size={20} />
              </Button>

              {/* Dropdown Menu */}
              {showMenu && (
                <Card
                  position="absolute"
                  right={0}
                  marginTop="$1"
                  width={144}
                  backgroundColor="$background"
                  borderRadius="$2"
                  elevation={4}
                  borderWidth={1}
                  borderColor="$borderColor"
                  zIndex={10}
                  role="menu"
                >
                  {onEdit && (
                    <Button
                      onPress={handleEdit}
                      variant="outlined"
                      size="$2"
                      width="100%"
                      justifyContent="flex-start"
                      paddingHorizontal="$4"
                      paddingVertical="$2"
                      role="menuitem"
                    >
                      <XStack alignItems="center" gap="$2">
                        <Edit size={16} />
                        <SizableText fontSize="$3" color="$color11">
                          Edit Member
                        </SizableText>
                      </XStack>
                    </Button>
                  )}
                  {onRemove && (
                    <Button
                      onPress={handleRemove}
                      variant="outlined"
                      size="$2"
                      width="100%"
                      justifyContent="flex-start"
                      paddingHorizontal="$4"
                      paddingVertical="$2"
                      role="menuitem"
                    >
                      <XStack alignItems="center" gap="$2">
                        <Trash2 size={16} />
                        <SizableText fontSize="$3" color="$red10">
                          Remove
                        </SizableText>
                      </XStack>
                    </Button>
                  )}
                </Card>
              )}
            </YStack>
          )}
        </XStack>
      </XStack>
    </Card>
  );
}

export default TeamMemberCard;
