/**
 * TeamMemberCard - Individual team member card component
 * Team Member Management UI
 * TASK-1: Create Team Members List Page
 *
 * Displays team member information in a card format with:
 * - Avatar/initials
 * - Name and email
 * - Role badge
 * - Action menu
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MoreVertical, Edit, Trash2 } from 'lucide-react';
import { Stack, Row, Text, Button, Card } from '@unicornlove/beyond-ui';

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
function getRoleBadgeColor(role: TeamMember['role']): React.CSSProperties {
  switch (role) {
    case 'admin':
      return { backgroundColor: 'var(--color-purple-2)', color: 'var(--color-purple-11)' };
    case 'manager':
      return { backgroundColor: 'var(--color-blue-2)', color: 'var(--color-blue-11)' };
    case 'broker':
      return { backgroundColor: 'var(--color-green-2)', color: 'var(--color-green-11)' };
    case 'subcontractor':
      return { backgroundColor: 'var(--color-orange-2)', color: 'var(--color-orange-11)' };
    case 'user':
    default:
      return { backgroundColor: 'var(--color-gray-2)', color: 'var(--color-gray-11)' };
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
      style={{
        backgroundColor: 'var(--color-background)',
        borderRadius: 8,
        border: '1px solid var(--color-border)',
        padding: 16,
        cursor: 'pointer',
      }}
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
      <Row style={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
        {/* Avatar and Info */}
        <Row style={{ alignItems: 'center', gap: 12 }}>
          {/* Avatar */}
          {member.avatar ? (
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                overflow: 'hidden',
                backgroundColor: 'var(--color-gray-3)',
              }}
            >
              <img
                src={member.avatar}
                alt={member.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          ) : (
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                backgroundColor: 'var(--color-gray-3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-gray-11)' }}>
                {getInitials(member.name)}
              </Text>
            </div>
          )}

          {/* Name and Email */}
          <Stack>
            <Text style={{ fontSize: 16, fontWeight: 500, color: 'var(--color-gray-12)' }}>
              {member.name}
            </Text>
            <Text style={{ fontSize: 14, color: 'var(--color-gray-10)' }}>
              {member.email}
            </Text>
            {member.company && (
              <Text style={{ fontSize: 12, color: 'var(--color-gray-10)', marginTop: 2 }}>
                {member.company}
              </Text>
            )}
          </Stack>
        </Row>

        {/* Role Badge and Menu */}
        <Row style={{ alignItems: 'center', gap: 8 }}>
          {/* Role Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              paddingLeft: 10,
              paddingRight: 10,
              paddingTop: 2,
              paddingBottom: 2,
              borderRadius: 9999,
              ...badgeColors,
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: 500, color: badgeColors.color }}>
              {formatRole(member.role)}
            </Text>
          </div>

          {/* Action Menu */}
          {(onEdit || onRemove) && (
            <div style={{ position: 'relative' }} ref={menuRef}>
              <Button
                onPress={handleMenuClick}
                variant="outline"
                size="sm"
                style={{ padding: 4 }}
                aria-label="More options"
                aria-expanded={showMenu}
                aria-haspopup="menu"
              >
                <MoreVertical size={20} />
              </Button>

              {/* Dropdown Menu */}
              {showMenu && (
                <Card
                  style={{
                    position: 'absolute',
                    right: 0,
                    marginTop: 4,
                    width: 144,
                    backgroundColor: 'var(--color-background)',
                    borderRadius: 4,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    border: '1px solid var(--color-border)',
                    zIndex: 10,
                  }}
                  role="menu"
                >
                  {onEdit && (
                    <Button
                      onPress={handleEdit}
                      variant="ghost"
                      size="sm"
                      style={{
                        width: '100%',
                        justifyContent: 'flex-start',
                        paddingLeft: 16,
                        paddingRight: 16,
                        paddingTop: 8,
                        paddingBottom: 8,
                      }}
                      role="menuitem"
                    >
                      <Row style={{ alignItems: 'center', gap: 8 }}>
                        <Edit size={16} />
                        <Text style={{ fontSize: 14, color: 'var(--color-gray-11)' }}>
                          Edit Member
                        </Text>
                      </Row>
                    </Button>
                  )}
                  {onRemove && (
                    <Button
                      onPress={handleRemove}
                      variant="ghost"
                      size="sm"
                      style={{
                        width: '100%',
                        justifyContent: 'flex-start',
                        paddingLeft: 16,
                        paddingRight: 16,
                        paddingTop: 8,
                        paddingBottom: 8,
                      }}
                      role="menuitem"
                    >
                      <Row style={{ alignItems: 'center', gap: 8 }}>
                        <Trash2 size={16} />
                        <Text style={{ fontSize: 14, color: 'var(--color-red-10)' }}>
                          Remove
                        </Text>
                      </Row>
                    </Button>
                  )}
                </Card>
              )}
            </div>
          )}
        </Row>
      </Row>
    </Card>
  );
}

export default TeamMemberCard;
