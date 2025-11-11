import type {
  CreateWorkLogInput,
  UpdateWorkLogInput,
  UploadWorkLogPhotoInput,
} from "../schemas";

export type SyncStatus =
  | "pending"
  | "queued"
  | "syncing"
  | "synced"
  | "failed";

export interface OfflineWorkLogCreatePayload {
  kind: "create";
  input: CreateWorkLogInput;
}

export interface OfflineWorkLogUpdatePayload {
  kind: "update";
  input: UpdateWorkLogInput;
}

export type OfflineWorkLogPayload =
  | OfflineWorkLogCreatePayload
  | OfflineWorkLogUpdatePayload;

export interface OfflineWorkLogPhotoInput {
  uri: string;
  mimeType: string;
  fileName?: string;
  size?: number;
  caption?: string | null;
  photoType?: UploadWorkLogPhotoInput["photoType"];
  displayOrder?: number;
  showOnProfile?: boolean;
  takenAt?: string;
  gpsCapture?: UploadWorkLogPhotoInput["gpsCapture"];
}

export interface OfflineWorkLogPhoto {
  id: string;
  localUri: string;
  fileName: string;
  mimeType: string;
  size: number;
  caption?: string | null;
  photoType?: UploadWorkLogPhotoInput["photoType"];
  displayOrder?: number;
  showOnProfile?: boolean;
  takenAt?: string;
  gpsCapture?: UploadWorkLogPhotoInput["gpsCapture"];
  status: "pending" | "uploaded" | "failed";
  lastError?: string | null;
}

export interface OfflineWorkLog {
  id: string;
  createdAt: string;
  updatedAt: string;
  payload: OfflineWorkLogPayload;
  photos: OfflineWorkLogPhoto[];
  syncStatus: SyncStatus;
  retryCount: number;
  nextRetryAt: string | null;
  lastError?: string | null;
  lastSyncedAt?: string | null;
}

export interface SyncSettings {
  autoSync: boolean;
  syncOverWifiOnly: boolean;
  maxRetries: number;
  lastSyncedAt: string | null;
}

export interface QueueOfflineWorkLogOptions {
  payload: OfflineWorkLogPayload;
  photos?: OfflineWorkLogPhotoInput[];
  initialStatus?: SyncStatus;
}

export type OfflineWorkLogMutator = (
  id: string,
  updater: (current: OfflineWorkLog) => OfflineWorkLog | null,
) => Promise<OfflineWorkLog | null>;

export const DEFAULT_SYNC_SETTINGS: SyncSettings = {
  autoSync: true,
  syncOverWifiOnly: true,
  maxRetries: 3,
  lastSyncedAt: null,
};

