import { beforeEach, describe, expect, it, vi } from 'vitest';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  clearOfflineWorkLogs,
  loadOfflineWorkLogs,
  loadSyncSettings,
  saveOfflineWorkLogs,
  saveSyncSettings,
} from '../offline-storage';
import type { OfflineWorkLog, SyncSettings } from '../../types/offline';
import { DEFAULT_SYNC_SETTINGS } from '../../types/offline';
import type { CreateWorkLogInput } from '@scf/schemas';

const createWorkLogInput = (overrides: Partial<CreateWorkLogInput>): CreateWorkLogInput => ({
  projectId: 'project-1',
  entryType: 'daily',
  logDate: '2025-01-10',
  timeEntries: [{ start: '08:00', end: '12:00' }],
  workDescription: 'Test work',
  tasksCompleted: [],
  skillsUsed: [],
  visibility: 'private',
  showOnProfile: false,
  showDateRangeOnProfile: false,
  ...overrides,
});

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
}));

describe('offline-storage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loadOfflineWorkLogs', () => {
    it('returns empty array when no data exists', async () => {
      vi.mocked(AsyncStorage.getItem).mockResolvedValue(null);

      const result = await loadOfflineWorkLogs();

      expect(result).toEqual([]);
    });

    it('loads and parses work logs from storage', async () => {
      const workLogs: OfflineWorkLog[] = [
        {
          id: 'test-id-1',
          createdAt: '2025-01-10T00:00:00Z',
          updatedAt: '2025-01-10T00:00:00Z',
          payload: {
            kind: 'create',
            input: createWorkLogInput({ workDescription: 'Test work' }),
          },
          syncStatus: 'pending',
          photos: [],
          retryCount: 0,
          nextRetryAt: null,
        },
      ];

      vi.mocked(AsyncStorage.getItem).mockResolvedValue(JSON.stringify(workLogs));

      const result = await loadOfflineWorkLogs();

      expect(result).toEqual(workLogs);
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('scf.workLogs.offlineQueue');
    });

    it('applies defaults for missing fields', async () => {
      const partialLog = {
        id: 'test-id-1',
        createdAt: '2025-01-10T00:00:00Z',
        updatedAt: '2025-01-10T00:00:00Z',
        payload: {
          kind: 'create' as const,
          input: {
            projectId: 'project-1',
            entryType: 'daily' as const,
            logDate: '2025-01-10',
            timeEntries: [{ start: '08:00', end: '12:00' }],
            workDescription: 'Test work',
          },
        },
      };

      vi.mocked(AsyncStorage.getItem).mockResolvedValue(JSON.stringify([partialLog]));

      const result = await loadOfflineWorkLogs();

      expect(result[0]).toMatchObject({
        ...partialLog,
        photos: [],
        retryCount: 0,
        nextRetryAt: null,
        syncStatus: 'pending',
      });
    });

    it('handles invalid JSON gracefully', async () => {
      vi.mocked(AsyncStorage.getItem).mockResolvedValue('invalid json');

      const result = await loadOfflineWorkLogs();

      expect(result).toEqual([]);
    });

    it('handles storage errors gracefully', async () => {
      vi.mocked(AsyncStorage.getItem).mockRejectedValue(new Error('Storage error'));

      const result = await loadOfflineWorkLogs();

      expect(result).toEqual([]);
    });
  });

  describe('saveOfflineWorkLogs', () => {
    it('saves work logs to storage', async () => {
      const workLogs: OfflineWorkLog[] = [
        {
          id: 'test-id-1',
          createdAt: '2025-01-10T00:00:00Z',
          updatedAt: '2025-01-10T00:00:00Z',
          payload: {
            kind: 'create',
            input: createWorkLogInput({ workDescription: 'Test work' }),
          },
          syncStatus: 'pending',
          photos: [],
          retryCount: 0,
          nextRetryAt: null,
        },
      ];

      await saveOfflineWorkLogs(workLogs);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'scf.workLogs.offlineQueue',
        JSON.stringify(workLogs),
      );
    });

    it('handles storage errors gracefully', async () => {
      vi.mocked(AsyncStorage.setItem).mockRejectedValue(new Error('Storage error'));

      await expect(saveOfflineWorkLogs([])).resolves.not.toThrow();
    });
  });

  describe('clearOfflineWorkLogs', () => {
    it('removes work logs from storage', async () => {
      await clearOfflineWorkLogs();

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('scf.workLogs.offlineQueue');
    });

    it('handles storage errors gracefully', async () => {
      vi.mocked(AsyncStorage.removeItem).mockRejectedValue(new Error('Storage error'));

      await expect(clearOfflineWorkLogs()).resolves.not.toThrow();
    });
  });

  describe('loadSyncSettings', () => {
    it('returns default settings when no data exists', async () => {
      vi.mocked(AsyncStorage.getItem).mockResolvedValue(null);

      const result = await loadSyncSettings();

      expect(result).toEqual(DEFAULT_SYNC_SETTINGS);
    });

    it('loads and merges settings from storage', async () => {
      const customSettings: Partial<SyncSettings> = {
        syncOverWifiOnly: false,
        autoSync: true,
      };

      vi.mocked(AsyncStorage.getItem).mockResolvedValue(JSON.stringify(customSettings));

      const result = await loadSyncSettings();

      expect(result).toMatchObject({
        ...DEFAULT_SYNC_SETTINGS,
        ...customSettings,
      });
    });

    it('handles invalid JSON gracefully', async () => {
      vi.mocked(AsyncStorage.getItem).mockResolvedValue('invalid json');

      const result = await loadSyncSettings();

      expect(result).toEqual(DEFAULT_SYNC_SETTINGS);
    });

    it('handles storage errors gracefully', async () => {
      vi.mocked(AsyncStorage.getItem).mockRejectedValue(new Error('Storage error'));

      const result = await loadSyncSettings();

      expect(result).toEqual(DEFAULT_SYNC_SETTINGS);
    });
  });

  describe('saveSyncSettings', () => {
    it('saves settings to storage', async () => {
      const settings: SyncSettings = {
        syncOverWifiOnly: true,
        autoSync: false,
        maxRetries: 3,
        lastSyncedAt: null,
      };

      await saveSyncSettings(settings);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'scf.workLogs.syncSettings',
        JSON.stringify(settings),
      );
    });

    it('handles storage errors gracefully', async () => {
      vi.mocked(AsyncStorage.setItem).mockRejectedValue(new Error('Storage error'));

      await expect(
        saveSyncSettings({
          syncOverWifiOnly: true,
          autoSync: false,
          maxRetries: 3,
          lastSyncedAt: null,
        }),
      ).resolves.not.toThrow();
    });
  });
});

