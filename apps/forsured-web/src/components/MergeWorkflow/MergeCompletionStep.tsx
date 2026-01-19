/**
 * MergeCompletionStep - Success screen with merge summary
 * REQ-12: Add Manual Broker and Contractor Registration
 * TASK-10: Build merge workflow UI - conflict resolution and data verification
 *
 * Shows success message with checkmark, summary of transferred data,
 * and "Go to Dashboard" button.
 */
import { Stack, Row, Text, H1, Card } from '@unicornlove/beyond-ui';
import { CheckCircle, ClipboardList, Building, FileText, ArrowRight } from 'lucide-react';
import Button from '../Common/Button';

interface MergeStats {
  tasksTransferred: number;
  projectsConfirmed: number;
  documentsTransferred: number;
}

interface MergeCompletionStepProps {
  stats: MergeStats | null;
  onGoToDashboard: () => void;
}

export function MergeCompletionStep({
  stats,
  onGoToDashboard,
}: MergeCompletionStepProps) {
  return (
    <Stack alignItems="center" gap={32} style={{ paddingTop: 32, paddingBottom: 32 }}>
      {/* Success icon */}
      <div
        style={{
          width: 96,
          height: 96,
          borderRadius: '50%',
          backgroundColor: 'var(--color-green-2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'scale-in 0.3s ease-out',
        }}
      >
        <CheckCircle size={56} style={{ color: 'var(--color-green-10)' }} />
      </div>

      {/* Success message */}
      <Stack alignItems="center" gap={12}>
        <H1 style={{ fontSize: 32, fontWeight: 700, textAlign: 'center' }}>
          Account Merge Complete!
        </H1>
        <Text
          size="lg"
          muted
          style={{ textAlign: 'center', maxWidth: 480 }}
        >
          Your account has been successfully linked with your existing records.
          You will now receive notifications for all future activity.
        </Text>
      </Stack>

      {/* Merge summary */}
      {stats && (
        <Card
          style={{
            padding: 24,
            backgroundColor: 'var(--color-gray-2)',
            borderRadius: 16,
            width: '100%',
            maxWidth: 400,
          }}
        >
          <Stack gap={16}>
            <Text size="sm" weight="semibold" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)' }}>
              Transfer Summary
            </Text>

            <Stack gap={12}>
              {/* Tasks */}
              <Row alignItems="center" justifyContent="space-between">
                <Row alignItems="center" gap={12}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      backgroundColor: 'var(--color-blue-2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ClipboardList size={20} style={{ color: 'var(--color-blue-10)' }} />
                  </div>
                  <Text size="md">Tasks</Text>
                </Row>
                <Text size="lg" weight="semibold">
                  {stats.tasksTransferred}
                </Text>
              </Row>

              {/* Projects */}
              <Row alignItems="center" justifyContent="space-between">
                <Row alignItems="center" gap={12}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      backgroundColor: 'var(--color-green-2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Building size={20} style={{ color: 'var(--color-green-10)' }} />
                  </div>
                  <Text size="md">Projects</Text>
                </Row>
                <Text size="lg" weight="semibold">
                  {stats.projectsConfirmed}
                </Text>
              </Row>

              {/* Documents */}
              <Row alignItems="center" justifyContent="space-between">
                <Row alignItems="center" gap={12}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      backgroundColor: 'var(--color-purple-2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <FileText size={20} style={{ color: 'var(--color-purple-10)' }} />
                  </div>
                  <Text size="md">Documents</Text>
                </Row>
                <Text size="lg" weight="semibold">
                  {stats.documentsTransferred}
                </Text>
              </Row>
            </Stack>
          </Stack>
        </Card>
      )}

      {/* CTA button */}
      <Button
        variant="primary"
        size="lg"
        onPress={onGoToDashboard}
        rightIcon={ArrowRight}
        style={{ marginTop: 8 }}
      >
        Go to Dashboard
      </Button>

      {/* Additional info */}
      <Text
        size="sm"
        muted
        style={{ textAlign: 'center', maxWidth: 400 }}
      >
        A notification has been sent to the person who added you, letting them know
        you've registered. You can now collaborate with them directly.
      </Text>

      {/* Animation styles */}
      <style>{`
        @keyframes scale-in {
          0% {
            transform: scale(0.8);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </Stack>
  );
}

export default MergeCompletionStep;
