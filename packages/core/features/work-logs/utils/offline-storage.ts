import AsyncStorage from "@react-native-async-storage/async-storage";

import type { OfflineWorkLog, SyncSettings } from "../types/offline";
import { DEFAULT_SYNC_SETTINGS } from "../types/offline";

const OFFLINE_WORK_LOGS_KEY = "scf.workLogs.offlineQueue";
const WORK_LOG_SYNC_SETTINGS_KEY = "scf.workLogs.syncSettings";

const parseJson = <T>(rawValue: string | null): T | null => {
  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as T;
  } catch (error) {
    console.warn(
      "[work-logs/offline-storage] Failed to parse JSON value",
      error,
    );
    return null;
  }
};

export const loadOfflineWorkLogs = async (): Promise<OfflineWorkLog[]> => {
  try {
    const rawValue = await AsyncStorage.getItem(OFFLINE_WORK_LOGS_KEY);
    const parsed = parseJson<OfflineWorkLog[]>(rawValue);
    if (!parsed) {
      return [];
    }

    return parsed.map((log) => ({
      ...log,
      photos: log.photos ?? [],
      retryCount: log.retryCount ?? 0,
      nextRetryAt: log.nextRetryAt ?? null,
      syncStatus: log.syncStatus ?? "pending",
    }));
  } catch (error) {
    console.warn(
      "[work-logs/offline-storage] Unable to read offline work logs",
      error,
    );
    return [];
  }
};

export const saveOfflineWorkLogs = async (
  workLogs: OfflineWorkLog[],
): Promise<void> => {
  try {
    await AsyncStorage.setItem(OFFLINE_WORK_LOGS_KEY, JSON.stringify(workLogs));
  } catch (error) {
    console.warn(
      "[work-logs/offline-storage] Unable to persist offline work logs",
      error,
    );
  }
};

export const clearOfflineWorkLogs = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(OFFLINE_WORK_LOGS_KEY);
  } catch (error) {
    console.warn(
      "[work-logs/offline-storage] Unable to clear offline work logs",
      error,
    );
  }
};

export const loadSyncSettings = async (): Promise<SyncSettings> => {
  try {
    const rawValue = await AsyncStorage.getItem(WORK_LOG_SYNC_SETTINGS_KEY);
    const parsed = parseJson<Partial<SyncSettings>>(rawValue);
    return {
      ...DEFAULT_SYNC_SETTINGS,
      ...(parsed ?? {}),
    };
  } catch (error) {
    console.warn(
      "[work-logs/offline-storage] Unable to read sync settings",
      error,
    );
    return { ...DEFAULT_SYNC_SETTINGS };
  }
};

export const saveSyncSettings = async (
  settings: SyncSettings,
): Promise<void> => {
  try {
    await AsyncStorage.setItem(
      WORK_LOG_SYNC_SETTINGS_KEY,
      JSON.stringify(settings),
    );
  } catch (error) {
    console.warn(
      "[work-logs/offline-storage] Unable to persist sync settings",
      error,
    );
  }
};
