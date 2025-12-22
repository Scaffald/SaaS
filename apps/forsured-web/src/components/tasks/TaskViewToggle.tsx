/**
 * TaskViewToggle - Task view toggle using Tamagui
 * REQ-268: Inbox vs Assigned by Me View
 */
import React from 'react';
import { XStack, YStack, Text, Button, styled } from '@unicornlove/ui';
import { Chip as Badge } from '@unicornlove/ui';
import { Inbox, Send } from 'lucide-react';
import { TaskViewType } from '../../hooks/useTaskViewFilter';

export interface TaskViewToggleProps {
  currentView: TaskViewType;
  onViewChange: (view: TaskViewType) => void;
  inboxCount: number;
  assignedByMeCount: number;
  className?: string;
}

const ToggleContainer = styled(XStack, {
  name: 'TaskViewToggle',
  display: 'inline-flex',
  borderRadius: '$3',
  backgroundColor: '$backgroundHover',
  borderWidth: 1,
  borderColor: '$borderColor',
  padding: '$1',
  gap: '$1',
});

const ToggleButton = styled(Button, {
  name: 'ToggleButton',
  flexDirection: 'row',
  alignItems: 'center',
  gap: '$2',
  paddingHorizontal: '$4',
  paddingVertical: '$2',
  fontSize: '$2',
  fontWeight: '500',
  borderRadius: '$3',
  backgroundColor: 'transparent',
  borderWidth: 1,
  borderColor: 'transparent',
  
  variants: {
    active: {
      true: {
        backgroundColor: '$background',
        shadowColor: '$shadowColor',
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        color: '$blue11',
        borderColor: '$blue6',
      },
      false: {
        color: '$color10',
        hoverStyle: {
          color: '$color11',
          backgroundColor: '$backgroundPress',
        },
      },
    },
  } as const,
});

export function TaskViewToggle({
  currentView,
  onViewChange,
  inboxCount,
  assignedByMeCount,
  className = '',
}: TaskViewToggleProps) {
  return (
    <ToggleContainer role="tablist" aria-label="Task view selection">
      <ToggleButton
        role="tab"
        aria-selected={currentView === 'inbox'}
        aria-controls="task-list"
        active={currentView === 'inbox'}
        onPress={() => onViewChange('inbox')}
      >
        <Inbox
          size={16}
          color={currentView === 'inbox' ? 'currentColor' : undefined}
        />
        <Text>My Inbox</Text>
        <Badge
          variant={currentView === 'inbox' ? 'default' : 'default'}
          size="sm"
        >
          {inboxCount}
        </Badge>
      </ToggleButton>

      <ToggleButton
        role="tab"
        aria-selected={currentView === 'assigned-by-me'}
        aria-controls="task-list"
        active={currentView === 'assigned-by-me'}
        onPress={() => onViewChange('assigned-by-me')}
      >
        <Send
          size={16}
          color={currentView === 'assigned-by-me' ? 'currentColor' : undefined}
        />
        <Text>Assigned by Me</Text>
        <Badge
          variant={currentView === 'assigned-by-me' ? 'default' : 'default'}
          size="sm"
        >
          {assignedByMeCount}
        </Badge>
      </ToggleButton>
    </ToggleContainer>
  );
}

export default TaskViewToggle;
