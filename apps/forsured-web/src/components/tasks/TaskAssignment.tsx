/**
 * REQ-166: Task Management Workflow & UI
 * TaskAssignment component for user picker with search and filtering
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { User, UserRole } from '../../types';

interface TaskAssignmentProps {
  users: User[];
  assignedUserId?: string;
  onAssign: (userId: string) => void;
  allowedRoles?: UserRole[];
  loading?: boolean;
  className?: string;
}

export const TaskAssignment: React.FC<TaskAssignmentProps> = ({
  users,
  assignedUserId,
  onAssign,
  allowedRoles,
  loading = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const assignedUser = users.find((u) => u.id === assignedUserId);

  const filteredUsers = useMemo(() => {
    let filtered = users;

    // Filter by allowed roles
    if (allowedRoles && allowedRoles.length > 0) {
      filtered = filtered.filter((user) => allowedRoles.includes(user.role));
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query) ||
          user.company.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [users, allowedRoles, searchQuery]);

  const handleUserSelect = (userId: string) => {
    onAssign(userId);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleToggle = () => {
    if (!loading) {
      setIsOpen(!isOpen);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle();
    }
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        disabled={loading}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {loading ? (
          <>
            <svg className="animate-spin h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-sm text-gray-600">Loading...</span>
          </>
        ) : assignedUser ? (
          <>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                {assignedUser.name.charAt(0)}
              </div>
              <div className="text-left">
                <div className="text-sm font-medium text-gray-900">{assignedUser.name}</div>
                <div className="text-xs text-gray-500">{assignedUser.role}</div>
              </div>
            </div>
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            <span className="sr-only">Reassign task</span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-sm text-gray-600">Unassigned</span>
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            <span className="sr-only">Assign task</span>
          </>
        )}
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="p-2 border-b border-gray-200">
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              autoFocus
            />
          </div>

          <div className="max-h-64 overflow-y-auto" role="listbox">
            {users.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">No users available</div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">No users found</div>
            ) : (
              filteredUsers.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => handleUserSelect(user.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left transition-colors"
                  role="option"
                  aria-selected={user.id === assignedUserId}
                >
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                    {user.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{user.name}</div>
                    <div className="text-xs text-gray-500 truncate">{user.email}</div>
                    <div className="text-xs text-gray-400 capitalize">{user.role}</div>
                  </div>
                  {user.id === assignedUserId && (
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
