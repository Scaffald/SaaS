/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState } from 'react';
import { X, Calendar, User, MessageSquare, CheckCircle2 } from 'lucide-react';
import { YStack, XStack, Text, H2, H3, Card } from '@unicornlove/ui';
import { Task } from '../../types';
import Modal from '../Common/Modal';
import Button from '../Common/Button';
import Textarea from '../Common/Textarea';
import Select from '../Common/Select';
import { formatDate } from '../../utils/dateHelpers';

interface TaskDetailModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  availableUsers?: Array<{ id: string; name: string; role: string }>;
}

export default function TaskDetailModal({
  task,
  isOpen,
  onClose,
  onUpdateTask,
  availableUsers = [],
}: TaskDetailModalProps) {
  const [comment, setComment] = useState('');
  const [completionNote, setCompletionNote] = useState('');
  const [selectedAssignee, setSelectedAssignee] = useState(
    task?.assigned_to_user_id || ''
  );
  const [showCompletionForm, setShowCompletionForm] = useState(false);

  if (!task) return null;

  const handleReassign = () => {
    if (selectedAssignee && selectedAssignee !== task.assigned_to_user_id) {
      onUpdateTask(task.id, { assigned_to_user_id: selectedAssignee });
      onClose();
    }
  };

  const handleComplete = () => {
    onUpdateTask(task.id, {
      status: 'completed' as any,
      metadata: {
        ...task.metadata,
        completion_note: completionNote,
        completed_at: new Date().toISOString(),
      },
    });
    setShowCompletionForm(false);
    setCompletionNote('');
    onClose();
  };

  const handleAddComment = () => {
    if (comment.trim()) {
      const comments = task.metadata?.comments || [];
      onUpdateTask(task.id, {
        metadata: {
          ...task.metadata,
          comments: [
            ...comments,
            {
              id: Date.now().toString(),
              text: comment,
              author: 'Current User',
              timestamp: new Date().toISOString(),
            },
          ],
        },
      });
      setComment('');
    }
  };

  const getPriorityColorProps = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return { color: '$red10', backgroundColor: '$red2' };
      case 'high':
        return { color: '$orange10', backgroundColor: '$orange2' };
      default:
        return { color: '$blue10', backgroundColor: '$blue2' };
    }
  };

  const getStatusColorProps = (status: string) => {
    switch (status) {
      case 'completed':
        return { color: '$green10', backgroundColor: '$green2' };
      case 'in_progress':
        return { color: '$blue10', backgroundColor: '$blue2' };
      case 'pending':
        return { color: '$color11', backgroundColor: '$gray2' };
      default:
        return { color: '$color11', backgroundColor: '$gray2' };
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <YStack gap="$6">
        <XStack alignItems="flex-start" justifyContent="space-between">
          <YStack flex={1}>
            <H2 fontSize="$8" fontWeight="600" color="$color12" mb="$2">
              {task.title}
            </H2>
            <XStack alignItems="center" gap="$2">
              <Text
                paddingHorizontal="$2"
                paddingVertical="$1"
                fontSize="$1"
                fontWeight="500"
                borderRadius="$2"
                {...getPriorityColorProps(task.priority)}
              >
                {task.priority}
              </Text>
              <Text
                paddingHorizontal="$2"
                paddingVertical="$1"
                fontSize="$1"
                fontWeight="500"
                borderRadius="$2"
                {...getStatusColorProps(task.status)}
              >
                {task.status.replace('_', ' ')}
              </Text>
            </XStack>
          </YStack>
          <XStack
            onPress={onClose}
            cursor="pointer"
            hoverStyle={{ opacity: 0.8 }}
          >
            <X size={20} color="$color10" />
          </XStack>
        </XStack>

        {task.description && (
          <YStack>
            <H3 fontSize="$3" fontWeight="500" color="$color12" mb="$2">
              Description
            </H3>
            <Text fontSize="$3" color="$color11">{task.description}</Text>
          </YStack>
        )}

        <XStack flexWrap="wrap" gap="$4">
          {task.due_date && (
            <YStack flex={1} minWidth="calc(50% - 8px)">
              <H3 fontSize="$1" fontWeight="500" color="$color10" mb="$1">
                Due Date
              </H3>
              <XStack alignItems="center" fontSize="$3" color="$color12">
                <Calendar size={14} mr="$2" />
                <Text fontSize="$3" color="$color12">{formatDate(task.due_date)}</Text>
              </XStack>
            </YStack>
          )}

          <YStack flex={1} minWidth="calc(50% - 8px)">
            <H3 fontSize="$1" fontWeight="500" color="$color10" mb="$1">
              Task Type
            </H3>
            <Text fontSize="$3" color="$color12" textTransform="capitalize">
              {task.task_type || 'General'}
            </Text>
          </YStack>
        </XStack>

        {task.status !== 'completed' && (
          <>
            <YStack>
              <H3 fontSize="$3" fontWeight="500" color="$color12" mb="$2">
                Reassign Task
              </H3>
              <XStack alignItems="center" gap="$2">
                <Select
                  value={selectedAssignee}
                  onChange={(e) => setSelectedAssignee(e.target.value)}
                  style={{ flex: 1 }}
                  options={[
                    { value: '', label: 'Select assignee' },
                    ...availableUsers.map((user) => ({
                      value: user.id,
                      label: `${user.name} (${user.role})`,
                    })),
                  ]}
                />
                <Button
                  onClick={handleReassign}
                  disabled={
                    !selectedAssignee ||
                    selectedAssignee === task.assigned_to_user_id
                  }
                  size="$2"
                >
                  Reassign
                </Button>
              </XStack>
            </YStack>

            <YStack>
              <H3 fontSize="$3" fontWeight="500" color="$color12" mb="$2">
                Mark as Complete
              </H3>
              {!showCompletionForm ? (
                <Button
                  onClick={() => setShowCompletionForm(true)}
                  variant="secondary"
                  icon={CheckCircle2}
                  width="100%"
                >
                  Complete Task
                </Button>
              ) : (
                <Card gap="$3" padding="$4" backgroundColor="$green2" borderWidth={1} borderColor="$green8" borderRadius="$4">
                  <Textarea
                    value={completionNote}
                    onChange={(e) => setCompletionNote(e.target.value)}
                    placeholder="Add completion notes (optional)"
                    rows={3}
                  />
                  <XStack gap="$2">
                    <Button
                      onClick={handleComplete}
                      variant="primary"
                      flex={1}
                    >
                      Confirm Complete
                    </Button>
                    <Button
                      onClick={() => {
                        setShowCompletionForm(false);
                        setCompletionNote('');
                      }}
                      variant="ghost"
                      flex={1}
                    >
                      Cancel
                    </Button>
                  </XStack>
                </Card>
              )}
            </YStack>
          </>
        )}

        <YStack>
          <XStack alignItems="center" gap="$2" mb="$2">
            <MessageSquare size={16} />
            <H3 fontSize="$3" fontWeight="500" color="$color12">
              Comments
            </H3>
          </XStack>

          <YStack gap="$3" mb="$3" maxHeight={160} overflowY="auto">
            {task.metadata?.comments?.length > 0 ? (
              task.metadata.comments.map((comment: unknown) => (
                <Card
                  key={comment.id}
                  padding="$3"
                  backgroundColor="$backgroundHover"
                  borderRadius="$4"
                >
                  <XStack alignItems="center" justifyContent="space-between" mb="$1">
                    <Text fontSize="$1" fontWeight="500" color="$color12">
                      {comment.author}
                    </Text>
                    <Text fontSize="$1" color="$color10">
                      {formatDate(comment.timestamp)}
                    </Text>
                  </XStack>
                  <Text fontSize="$3" color="$color11">{comment.text}</Text>
                </Card>
              ))
            ) : (
              <Text fontSize="$3" color="$color10" fontStyle="italic">
                No comments yet
              </Text>
            )}
          </YStack>

          <XStack gap="$2">
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment..."
              rows={2}
              style={{ flex: 1 }}
            />
            <Button
              onClick={handleAddComment}
              disabled={!comment.trim()}
              size="$2"
            >
              Add
            </Button>
          </XStack>
        </YStack>

        {task.metadata?.completion_note && (
          <Card padding="$4" backgroundColor="$green2" borderWidth={1} borderColor="$green8" borderRadius="$4">
            <H3 fontSize="$3" fontWeight="500" color="$green10" mb="$2">
              Completion Notes
            </H3>
            <Text fontSize="$3" color="$color11">
              {task.metadata.completion_note}
            </Text>
          </Card>
        )}
      </YStack>
    </Modal>
  );
}
