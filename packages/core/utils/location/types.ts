export const LOCATION_PERMISSION_STATUS_VALUES = [
  'notDetermined',
  'restricted',
  'denied',
  'authorizedAlways',
  'authorizedWhenInUse',
  'granted',
  'grantedForeground',
  'grantedBackground',
  'undetermined',
] as const;

export type LocationPermissionStatus =
  (typeof LOCATION_PERMISSION_STATUS_VALUES)[number];

export type WorkLogDeviceType = 'ios' | 'android' | 'web';

export interface WorkLogLocation {
  latitude: number;
  longitude: number;
  accuracyMeters: number | null;
  capturedAt: string;
  deviceType: WorkLogDeviceType;
  permissionStatus: LocationPermissionStatus;
}

export interface WorkLogLocationState {
  location: WorkLogLocation | null;
  permissionStatus: LocationPermissionStatus | null;
  isLoading: boolean;
  error: string | null;
}

