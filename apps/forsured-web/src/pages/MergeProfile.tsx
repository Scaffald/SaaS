/**
 * MergeProfile - Multi-step merge workflow page
 * REQ-12: Add Manual Broker and Contractor Registration
 * TASK-10: Build merge workflow UI - conflict resolution and data verification
 *
 * Guides newly registered users through profile conflict resolution,
 * project verification, and document review when their account matches
 * a manually-created record.
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stack, Row, Text, H1, Card } from '@unicornlove/beyond-ui';
import { Loader2 } from 'lucide-react';
import { trpc } from '../lib/trpc';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/Common/Button';
import {
  MergeProgress,
  ConflictResolutionStep,
  ProjectVerificationStep,
  DocumentReviewStep,
  MergeCompletionStep,
} from '../components/MergeWorkflow';

/**
 * Session storage key for merge workflow context
 */
const MERGE_CONTEXT_KEY = 'forsured_merge_context';

/**
 * Merge context stored in sessionStorage for the merge workflow
 */
interface MergeContext {
  realUserId: string;
  realUserEmail: string;
  matches: Array<{
    manualUserId: string;
    name: string;
    email: string;
    organizationId: string;
    organizationName: string;
    matchReason: string;
  }>;
  detectedAt: string;
}

/**
 * Conflict data returned from the API
 */
interface ConflictData {
  manualUserId: string;
  manualUserName: string;
  conflicts: Array<{
    field: string;
    manualValue: string;
    scaffaldValue: string;
  }>;
  projects: Array<{
    id: string;
    name: string;
    role: string;
    addedBy: string;
    addedAt: string;
  }>;
  documents: Array<{
    id: string;
    name: string;
    uploadedBy: string;
    uploadedAt: string;
    fileType: string;
    previewUrl?: string;
  }>;
}

/**
 * Resolution data for conflicts
 */
interface ConflictResolution {
  field: string;
  selectedValue: 'manual' | 'scaffald';
}

type MergeStep = 'conflicts' | 'projects' | 'documents' | 'completion';

const STEP_ORDER: MergeStep[] = ['conflicts', 'projects', 'documents', 'completion'];

export default function MergeProfile() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<MergeStep>('conflicts');
  const [mergeContext, setMergeContext] = useState<MergeContext | null>(null);
  const [conflictData, setConflictData] = useState<ConflictData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Step state
  const [selectedManualUserId, setSelectedManualUserId] = useState<string | null>(null);
  const [conflictResolutions, setConflictResolutions] = useState<ConflictResolution[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [documentsAcknowledged, setDocumentsAcknowledged] = useState(false);
  const [mergeComplete, setMergeComplete] = useState(false);
  const [mergeStats, setMergeStats] = useState<{
    tasksTransferred: number;
    projectsConfirmed: number;
    documentsTransferred: number;
  } | null>(null);

  // tRPC mutations
  const getConflictsMutation = trpc.userMerge.getConflicts.useMutation();
  const resolveConflictsMutation = trpc.userMerge.resolveConflicts.useMutation();
  const executeMergeMutation = trpc.userMerge.executeMerge.useMutation();

  // Load merge context from sessionStorage
  useEffect(() => {
    const storedContext = sessionStorage.getItem(MERGE_CONTEXT_KEY);
    if (!storedContext) {
      setError('No merge context found. Please try logging in again.');
      setLoading(false);
      return;
    }

    try {
      const context = JSON.parse(storedContext) as MergeContext;
      setMergeContext(context);

      // If only one match, auto-select it
      if (context.matches.length === 1) {
        setSelectedManualUserId(context.matches[0].manualUserId);
      }
    } catch (err) {
      setError('Invalid merge context. Please try logging in again.');
    }
    setLoading(false);
  }, []);

  // Load conflict data when manual user is selected
  useEffect(() => {
    async function loadConflicts() {
      if (!selectedManualUserId) return;

      setLoading(true);
      try {
        const result = await getConflictsMutation.mutateAsync({
          manualUserId: selectedManualUserId,
        });

        setConflictData({
          manualUserId: selectedManualUserId,
          manualUserName: mergeContext?.matches.find(m => m.manualUserId === selectedManualUserId)?.name || 'Unknown User',
          conflicts: result.conflicts,
          projects: result.projects,
          documents: result.documents,
        });

        // Initialize all projects as selected
        setSelectedProjects(result.projects.map(p => p.id));
      } catch (err) {
        console.error('[MergeProfile] Error loading conflicts:', err);
        setError('Failed to load merge data. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    loadConflicts();
  }, [selectedManualUserId]);

  // Handle step navigation
  const handleNextStep = useCallback(async () => {
    const currentIndex = STEP_ORDER.indexOf(currentStep);
    if (currentIndex < STEP_ORDER.length - 1) {
      setCurrentStep(STEP_ORDER[currentIndex + 1]);
    }
  }, [currentStep]);

  const handlePreviousStep = useCallback(() => {
    const currentIndex = STEP_ORDER.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(STEP_ORDER[currentIndex - 1]);
    }
  }, [currentStep]);

  // Handle conflict resolution submission
  const handleConflictsComplete = useCallback(async (resolutions: ConflictResolution[]) => {
    setConflictResolutions(resolutions);

    // Submit resolutions to API
    try {
      await resolveConflictsMutation.mutateAsync({
        manualUserId: selectedManualUserId!,
        resolutions: resolutions.map(r => ({
          field: r.field,
          selectedValue: r.selectedValue === 'manual'
            ? conflictData?.conflicts.find(c => c.field === r.field)?.manualValue || ''
            : conflictData?.conflicts.find(c => c.field === r.field)?.scaffaldValue || '',
        })),
      });
      handleNextStep();
    } catch (err) {
      console.error('[MergeProfile] Error saving conflict resolutions:', err);
      toast.error('Failed to save your selections. Please try again.');
    }
  }, [selectedManualUserId, conflictData, resolveConflictsMutation, handleNextStep]);

  // Handle project verification
  const handleProjectsComplete = useCallback((projectIds: string[]) => {
    setSelectedProjects(projectIds);
    handleNextStep();
  }, [handleNextStep]);

  // Handle document acknowledgment
  const handleDocumentsComplete = useCallback(async () => {
    setDocumentsAcknowledged(true);

    // Execute the merge
    try {
      const result = await executeMergeMutation.mutateAsync({
        manualUserId: selectedManualUserId!,
        confirmedProjectIds: selectedProjects,
      });

      setMergeStats({
        tasksTransferred: result.tasksTransferred,
        projectsConfirmed: result.projectsConfirmed,
        documentsTransferred: result.documentsTransferred,
      });
      setMergeComplete(true);

      // Clear the merge context from sessionStorage
      sessionStorage.removeItem(MERGE_CONTEXT_KEY);

      handleNextStep();
    } catch (err) {
      console.error('[MergeProfile] Error executing merge:', err);
      toast.error('Failed to complete the merge. Please try again.');
    }
  }, [selectedManualUserId, selectedProjects, executeMergeMutation, handleNextStep]);

  // Handle completion - navigate to dashboard
  const handleGoToDashboard = useCallback(() => {
    navigate('/');
  }, [navigate]);

  // Handle skip workflow - for users who want to skip
  const handleSkipWorkflow = useCallback(() => {
    sessionStorage.removeItem(MERGE_CONTEXT_KEY);
    toast.info('You can complete the merge later from your settings.');
    navigate('/');
  }, [navigate]);

  // Render loading state
  if (loading) {
    return (
      <Stack
        alignItems="center"
        justifyContent="center"
        style={{ minHeight: '100vh', padding: 24 }}
      >
        <Loader2 size={48} className="animate-spin" style={{ color: 'var(--color-blue-10)' }} />
        <Text size="lg" style={{ marginTop: 16 }}>Loading merge data...</Text>
      </Stack>
    );
  }

  // Render error state
  if (error) {
    return (
      <Stack
        alignItems="center"
        justifyContent="center"
        style={{ minHeight: '100vh', padding: 24 }}
      >
        <Card
          style={{
            padding: 32,
            maxWidth: 400,
            textAlign: 'center',
            backgroundColor: 'var(--color-red-2)',
            border: '1px solid var(--color-red-6)',
            borderRadius: 12,
          }}
        >
          <Text size="lg" weight="medium" style={{ color: 'var(--color-red-11)', marginBottom: 16 }}>
            {error}
          </Text>
          <Button variant="primary" onPress={() => navigate('/login')}>
            Go to Login
          </Button>
        </Card>
      </Stack>
    );
  }

  // Render multiple matches selection
  if (mergeContext && mergeContext.matches.length > 1 && !selectedManualUserId) {
    return (
      <Stack
        style={{
          maxWidth: 672,
          width: '100%',
          alignSelf: 'center',
          margin: '0 auto',
          padding: 24,
        }}
      >
        <H1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>
          Multiple Accounts Found
        </H1>
        <Text size="lg" muted style={{ marginBottom: 32 }}>
          We found multiple existing accounts that may be yours. Please select the one to merge:
        </Text>

        <Stack gap={16}>
          {mergeContext.matches.map((match) => (
            <Card
              key={match.manualUserId}
              onPress={() => setSelectedManualUserId(match.manualUserId)}
              style={{
                padding: 20,
                cursor: 'pointer',
                backgroundColor: 'var(--color-background)',
                border: '2px solid var(--color-border)',
                borderRadius: 12,
              }}
            >
              <Stack gap={8}>
                <Text size="lg" weight="semibold">{match.name}</Text>
                <Text size="sm" muted>{match.email}</Text>
                <Row gap={8} style={{ marginTop: 8 }}>
                  <span
                    style={{
                      paddingLeft: 8,
                      paddingRight: 8,
                      paddingTop: 4,
                      paddingBottom: 4,
                      fontSize: 12,
                      fontWeight: 500,
                      borderRadius: 8,
                      backgroundColor: 'var(--color-blue-2)',
                      color: 'var(--color-blue-10)',
                    }}
                  >
                    {match.organizationName}
                  </span>
                  <span
                    style={{
                      paddingLeft: 8,
                      paddingRight: 8,
                      paddingTop: 4,
                      paddingBottom: 4,
                      fontSize: 12,
                      fontWeight: 500,
                      borderRadius: 8,
                      backgroundColor: 'var(--color-gray-2)',
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    {match.matchReason}
                  </span>
                </Row>
              </Stack>
            </Card>
          ))}
        </Stack>

        <Button
          variant="ghost"
          onPress={handleSkipWorkflow}
          style={{ marginTop: 24, alignSelf: 'center' }}
        >
          Skip for now
        </Button>
      </Stack>
    );
  }

  // Determine which step content to render
  const currentStepIndex = STEP_ORDER.indexOf(currentStep);
  const totalSteps = STEP_ORDER.length;

  return (
    <Stack
      style={{
        maxWidth: 800,
        width: '100%',
        alignSelf: 'center',
        margin: '0 auto',
        padding: 24,
        minHeight: '100vh',
      }}
    >
      {/* Progress indicator - hide on completion */}
      {currentStep !== 'completion' && (
        <MergeProgress
          currentStep={currentStepIndex + 1}
          totalSteps={totalSteps}
          steps={['Resolve Conflicts', 'Verify Projects', 'Review Documents', 'Complete']}
        />
      )}

      {/* Step content */}
      <Stack style={{ marginTop: 32, flex: 1 }}>
        {currentStep === 'conflicts' && conflictData && (
          <ConflictResolutionStep
            conflicts={conflictData.conflicts}
            manualUserName={conflictData.manualUserName}
            onComplete={handleConflictsComplete}
            onBack={handleSkipWorkflow}
            isLoading={resolveConflictsMutation.isPending}
          />
        )}

        {currentStep === 'projects' && conflictData && (
          <ProjectVerificationStep
            projects={conflictData.projects}
            selectedProjectIds={selectedProjects}
            onComplete={handleProjectsComplete}
            onBack={handlePreviousStep}
          />
        )}

        {currentStep === 'documents' && conflictData && (
          <DocumentReviewStep
            documents={conflictData.documents}
            onComplete={handleDocumentsComplete}
            onBack={handlePreviousStep}
            isLoading={executeMergeMutation.isPending}
          />
        )}

        {currentStep === 'completion' && (
          <MergeCompletionStep
            stats={mergeStats}
            onGoToDashboard={handleGoToDashboard}
          />
        )}
      </Stack>
    </Stack>
  );
}
