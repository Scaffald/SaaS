// src/pages/gc/settings/CommunicationsSettings.tsx
import { useState, useEffect } from 'react';
import { Stack, Text, Button, H2, Card } from '@scaffald/ui';
import { MessageSquare } from 'lucide-react-native';
import { trpc } from '../../../lib/trpc';
import { toast } from 'sonner';

type EmailPolicy = 'full_content' | 'links_only';

function GCCommunicationsSettings() {
  const { data, isLoading } = trpc.conversation.getEmailPolicy.useQuery();
  const updateMutation = trpc.conversation.updateEmailPolicy.useMutation({
    onSuccess: () => {
      toast.success('Communications settings saved');
      setSavedPolicy(selectedPolicy);
    },
    onError: (err) => {
      toast.error(`Failed to save: ${err.message}`);
    },
  });

  const [selectedPolicy, setSelectedPolicy] = useState<EmailPolicy>('full_content');
  const [savedPolicy, setSavedPolicy] = useState<EmailPolicy>('full_content');

  useEffect(() => {
    if (data?.policy) {
      setSelectedPolicy(data.policy);
      setSavedPolicy(data.policy);
    }
  }, [data?.policy]);

  const isDirty = selectedPolicy !== savedPolicy;

  if (isLoading) {
    return (
      <Stack style={{ gap: 'var(--space-4)' }}>
        <H2>Communications</H2>
        <Stack style={{ gap: 'var(--space-4)' }}>
          {[1, 2].map((i) => (
            <Stack
              key={i}
              style={{
                height: 60,
                backgroundColor: 'var(--color-3)',
                borderRadius: 'var(--radius-4)',
              }}
            />
          ))}
        </Stack>
      </Stack>
    );
  }

  return (
    <Stack style={{ gap: 'var(--space-6)' }}>
      <Stack style={{ gap: 'var(--space-1)' }}>
        <Stack style={{ flexDirection: 'row', alignItems: 'center', gap: 'var(--space-2)' }}>
          <MessageSquare size={20} />
          <H2>Communications</H2>
        </Stack>
        <Text style={{ color: 'var(--color-10)' }}>
          Configure how conversation notifications are delivered via email.
        </Text>
      </Stack>

      <Stack style={{ gap: 'var(--space-3)' }}>
        <Text weight="semibold">Email Notification Format</Text>
        <Text size="sm" style={{ color: 'var(--color-10)' }}>
          Choose how conversation messages are included in email notifications sent to participants.
        </Text>

        <Stack style={{ gap: 'var(--space-2)' }}>
          {(
            [
              {
                value: 'full_content' as const,
                label: 'Include full message content',
                description:
                  'Conversation messages are embedded directly in notification emails. Participants can read and reply without logging in.',
              },
              {
                value: 'links_only' as const,
                label: 'Send notification links only',
                description:
                  'Emails contain a link to view the conversation in the app. Message content is not included in the email body.',
              },
            ] satisfies { value: EmailPolicy; label: string; description: string }[]
          ).map(({ value, label, description }) => (
            <Card
              key={value}
              style={{
                padding: 'var(--space-4)',
                border: `2px solid ${selectedPolicy === value ? 'var(--color-blue-8)' : 'var(--color-border)'}`,
                borderRadius: 'var(--radius-4)',
                cursor: 'pointer',
                backgroundColor:
                  selectedPolicy === value ? 'var(--color-blue-2)' : 'var(--color-surface)',
              }}
              onPress={() => setSelectedPolicy(value)}
            >
              <Stack style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
                <Stack
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    border: `2px solid ${selectedPolicy === value ? 'var(--color-blue-9)' : 'var(--color-border)'}`,
                    backgroundColor:
                      selectedPolicy === value ? 'var(--color-blue-9)' : 'transparent',
                    flexShrink: 0,
                    marginTop: 2,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {selectedPolicy === value && (
                    <Stack
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: 'white',
                      }}
                    />
                  )}
                </Stack>
                <Stack style={{ flex: 1, gap: 'var(--space-1)' }}>
                  <Text weight="medium">{label}</Text>
                  <Text size="sm" style={{ color: 'var(--color-10)' }}>
                    {description}
                  </Text>
                </Stack>
              </Stack>
            </Card>
          ))}
        </Stack>
      </Stack>

      <Button
        variant="primary"
        disabled={!isDirty || updateMutation.isPending}
        onPress={() => updateMutation.mutate({ policy: selectedPolicy })}
        style={{ alignSelf: 'flex-start' }}
      >
        {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
      </Button>
    </Stack>
  );
}

export default GCCommunicationsSettings;
