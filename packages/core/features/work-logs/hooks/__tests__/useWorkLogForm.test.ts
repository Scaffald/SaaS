import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useNetInfo } from '@react-native-community/netinfo';

import { useWorkLogForm } from '../useWorkLogForm';
import * as api from '@app/core/utils/api';
import * as useOfflineWorkLogs from '../useOfflineWorkLogs';

vi.mock('@app/core/utils/api', () => ({
  api: {
    workLogs: {
      getProjectOptions: {
        useQuery: vi.fn(() => ({
          data: { organizations: [], projects: [] },
          isLoading: false,
        })),
      },
      create: {
        useMutation: vi.fn(() => ({
          mutateAsync: vi.fn(),
        })),
      },
      update: {
        useMutation: vi.fn(() => ({
          mutateAsync: vi.fn(),
        })),
      },
    },
    profile: {
      skills: {
        getUserSkills: {
          useQuery: vi.fn(() => ({
            data: [],
            isLoading: false,
          })),
        },
      },
    },
  },
}));

vi.mock('@react-native-community/netinfo', () => ({
  useNetInfo: vi.fn(() => ({
    isConnected: true,
    isInternetReachable: true,
  })),
}));

vi.mock('@tamagui/toast', () => ({
  useToastController: vi.fn(() => ({
    show: vi.fn(),
  })),
}));

vi.mock('../useOfflineWorkLogs', () => ({
  useOfflineWorkLogs: vi.fn(() => ({
    offlineWorkLogs: [],
    queueWorkLog: vi.fn(),
    mutateOfflineWorkLog: vi.fn(),
    markWorkLogForSync: vi.fn(),
  })),
}));

const VALID_PROJECT_ID = '11111111-1111-1111-1111-111111111111'

vi.mock('@app/core/utils/location/useWorkLogLocation', () => ({
  useWorkLogLocation: vi.fn(() => ({
    location: null,
    isCapturing: false,
    captureLocation: vi.fn(),
    error: null,
  })),
}));

describe('useWorkLogForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes form with default values', () => {
    const { result } = renderHook(() => useWorkLogForm());

    expect(result.current.form.getValues('entryType')).toBe('daily');
    expect(result.current.form.getValues('visibility')).toBe('private');
    expect(result.current.form.getValues('showOnProfile')).toBe(false);
    expect(result.current.timeEntryFields.length).toBe(1);
  });

  it('initializes form with provided initial values', () => {
    const initialValues = {
      projectId: 'project-1',
      entryType: 'project' as const,
      logDate: '2025-01-15',
      timeEntries: [
        { start: '08:00', end: '12:00' },
        { start: '13:00', end: '17:00' },
      ],
      workDescription: 'Initial work',
    };

    const { result } = renderHook(() =>
      useWorkLogForm({ initialValues }),
    );

    expect(result.current.form.getValues('projectId')).toBe('project-1');
    expect(result.current.form.getValues('entryType')).toBe('project');
    expect(result.current.form.getValues('logDate')).toBe('2025-01-15');
    expect(result.current.form.getValues('workDescription')).toBe('Initial work');
    expect(result.current.timeEntryFields.length).toBe(2);
  });

  it('calculates total hours from time entries', () => {
    const initialValues = {
      timeEntries: [
        { start: '08:00', end: '12:00' },
        { start: '13:00', end: '17:00' },
      ],
    };

    const { result } = renderHook(() =>
      useWorkLogForm({ initialValues }),
    );

    expect(result.current.totalHours).toBe(8);
  });

  it('detects overlapping time entries', () => {
    const initialValues = {
      timeEntries: [
        { start: '08:00', end: '12:00' },
        { start: '11:00', end: '15:00' },
      ],
    };

    const { result } = renderHook(() =>
      useWorkLogForm({ initialValues }),
    );

    expect(result.current.overlapDetected).toBe(true);
  });

  it('adds time entry', () => {
    const { result } = renderHook(() => useWorkLogForm());

    act(() => {
      result.current.addTimeEntry();
    });

    expect(result.current.timeEntryFields.length).toBe(2);
  });

  it('removes time entry', () => {
    const initialValues = {
      timeEntries: [
        { start: '08:00', end: '12:00' },
        { start: '13:00', end: '17:00' },
      ],
    };

    const { result } = renderHook(() =>
      useWorkLogForm({ initialValues }),
    );

    act(() => {
      result.current.removeTimeEntry(0);
    });

    expect(result.current.timeEntryFields.length).toBe(1);
  });

  it('handles offline mode by queueing work log', async () => {
    const mockQueueWorkLog = vi.fn().mockResolvedValue({
      id: 'offline-id',
      createdAt: '2025-01-10T00:00:00Z',
      updatedAt: '2025-01-10T00:00:00Z',
      payload: {
        kind: 'create',
        input: {
          projectId: 'project-1',
          entryType: 'daily',
          logDate: '2025-01-10',
          timeEntries: [{ start: '08:00', end: '12:00' }],
          workDescription: 'Offline work',
        },
      },
      syncStatus: 'pending',
      photos: [],
      retryCount: 0,
      nextRetryAt: null,
    });

    vi.mocked(useOfflineWorkLogs.useOfflineWorkLogs).mockReturnValue({
      offlineWorkLogs: [],
      isLoading: false,
      queueWorkLog: mockQueueWorkLog,
      mutateOfflineWorkLog: vi.fn(),
      markWorkLogForSync: vi.fn(),
      removeOfflineWorkLog: vi.fn(),
      refreshOfflineWorkLogs: vi.fn(),
      resetOfflineWorkLogs: vi.fn(),
    });

    vi.mocked(useNetInfo).mockReturnValue({
      isConnected: false,
      isInternetReachable: false,
    } as never);

    const { result } = renderHook(() => useWorkLogForm());

    await waitFor(() => {
      expect(result.current.isSubmitting).toBe(false);
    });

    act(() => {
      result.current.form.setValue('projectId', VALID_PROJECT_ID);
      result.current.form.setValue('workDescription', 'Offline work');
      result.current.form.setValue('timeEntries.0.start', '08:00');
      result.current.form.setValue('timeEntries.0.end', '12:00');
    });

    await waitFor(() => {
      expect(result.current.autoSaveStatus.state).toBe('saved');
    });

    expect(mockQueueWorkLog).toHaveBeenCalled();
  });

  it('submits form successfully', async () => {
    const mockCreateMutation = vi.fn().mockResolvedValue({
      id: 'work-log-id',
      status: 'draft',
    });

    const mockOnSuccess = vi.fn();

    vi.mocked(api.api.workLogs.create.useMutation).mockReturnValue({
      mutateAsync: mockCreateMutation,
    } as never);

    const { result } = renderHook(() =>
      useWorkLogForm({
        onSubmitSuccess: mockOnSuccess,
      }),
    );

    act(() => {
      result.current.form.setValue('projectId', VALID_PROJECT_ID);
      result.current.form.setValue('workDescription', 'Test work');
      result.current.form.setValue('timeEntries.0.start', '08:00');
      result.current.form.setValue('timeEntries.0.end', '12:00');
    });

    await act(async () => {
      await result.current.submit();
    });

    expect(mockCreateMutation).toHaveBeenCalled();
    expect(mockOnSuccess).toHaveBeenCalledWith('work-log-id');
  });
});

