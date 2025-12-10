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

import React from 'react';

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
function getRoleBadgeColor(role: TeamMember['role']): string {
  switch (role) {
    case 'admin':
      return 'bg-purple-100 text-purple-800';
    case 'manager':
      return 'bg-blue-100 text-blue-800';
    case 'broker':
      return 'bg-green-100 text-green-800';
    case 'subcontractor':
      return 'bg-orange-100 text-orange-800';
    case 'user':
    default:
      return 'bg-gray-100 text-gray-800';
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
  const [showMenu, setShowMenu] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  React.useEffect(() => {
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

  return (
    <div
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleCardClick();
        }
      }}
      aria-label={`View ${member.name}'s profile`}
    >
      <div className="flex items-start justify-between">
        {/* Avatar and Info */}
        <div className="flex items-center gap-3">
          {/* Avatar */}
          {member.avatar ? (
            <img
              src={member.avatar}
              alt={member.name}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-600 font-medium text-sm">
                {getInitials(member.name)}
              </span>
            </div>
          )}

          {/* Name and Email */}
          <div>
            <h3 className="font-medium text-gray-900">{member.name}</h3>
            <p className="text-sm text-gray-500">{member.email}</p>
            {member.company && (
              <p className="text-xs text-gray-400 mt-0.5">{member.company}</p>
            )}
          </div>
        </div>

        {/* Role Badge and Menu */}
        <div className="flex items-center gap-2">
          {/* Role Badge */}
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(
              member.role
            )}`}
          >
            {formatRole(member.role)}
          </span>

          {/* Action Menu */}
          {(onEdit || onRemove) && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={handleMenuClick}
                className="p-1 rounded hover:bg-gray-100 transition-colors"
                aria-label="More options"
                aria-expanded={showMenu}
                aria-haspopup="menu"
              >
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {showMenu && (
                <div
                  className="absolute right-0 mt-1 w-36 bg-white rounded-md shadow-lg border border-gray-200 z-10"
                  role="menu"
                >
                  {onEdit && (
                    <button
                      onClick={handleEdit}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      role="menuitem"
                    >
                      Edit Member
                    </button>
                  )}
                  {onRemove && (
                    <button
                      onClick={handleRemove}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      role="menuitem"
                    >
                      Remove
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TeamMemberCard;
