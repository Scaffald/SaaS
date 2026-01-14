/**
 * TaskViewToggle - Task view toggle using Beyond UI
 * REQ-268: Inbox vs Assigned by Me View
 */
import React from 'react';
import { Row, Stack, Text, Button, Chip } from '@unicornlove/beyond-ui';
import { Inbox, Send } from 'lucide-react';
import { TaskViewType } from '../../hooks/useTaskViewFilter';

export interface TaskViewToggleProps {
  currentView: TaskViewType;
  onViewChange: (view: TaskViewType) => void;
  inboxCount: number;
  assignedByMeCount: number;
  className?: string;
}

const getToggleButtonStyle = (active: boolean): React.CSSProperties => ({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  gap: '8px',
  paddingLeft: '16px',
  paddingRight: '16px',
  paddingTop: '8px',
  paddingBottom: '8px',
  fontSize: '14px',
  fontWeight: 500,
  borderRadius: '8px',
  backgroundColor: active ? 'var(--color-background)' : 'transparent',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: active ? 'var(--color-blue6)' : 'transparent',
  color: active ? 'var(--color-blue11)' : 'var(--color-color10)',
  boxShadow: active ? '0 2px 4px var(--color-shadowColor)' : 'none',
  cursor: 'pointer',
});

export function TaskViewToggle({
  currentView,
  onViewChange,
  inboxCount,
  assignedByMeCount,
  className = '',
}: TaskViewToggleProps) {
  return (
    <Row
      role="tablist"
      aria-label="Task view selection"
      style={{
        display: 'inline-flex',
        borderRadius: '8px',
        backgroundColor: 'var(--color-backgroundHover)',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: 'var(--color-border)',
        padding: '4px',
        gap: '4px',
      }}
    >
      <button
        type="button"
        role="tab"
        aria-selected={currentView === 'inbox'}
        aria-controls="task-list"
        onClick={() => onViewChange('inbox')}
        style={getToggleButtonStyle(currentView === 'inbox')}
      >
        <Inbox
          size={16}
          color={currentView === 'inbox' ? 'currentColor' : undefined}
        />
        <Text>My Inbox</Text>
        <Chip
          variant="default"
          size="sm"
        >
          {inboxCount}
        </Chip>
      </button>

      <button
        type="button"
        role="tab"
        aria-selected={currentView === 'assigned-by-me'}
        aria-controls="task-list"
        onClick={() => onViewChange('assigned-by-me')}
        style={getToggleButtonStyle(currentView === 'assigned-by-me')}
      >
        <Send
          size={16}
          color={currentView === 'assigned-by-me' ? 'currentColor' : undefined}
        />
        <Text>Assigned by Me</Text>
        <Chip
          variant="default"
          size="sm"
        >
          {assignedByMeCount}
        </Chip>
      </button>
    </Row>
  );
}

export default TaskViewToggle;
