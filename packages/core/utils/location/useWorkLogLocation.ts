import * as Location from "expo-location";
import { useCallback, useState } from "react";
import { Platform } from "react-native";

import {
  LOCATION_PERMISSION_STATUS_VALUES,
  type LocationPermissionStatus,
  type WorkLogLocation,
  type WorkLogLocationState,
} from "@app/schemas";

const getDeviceType = () => {
  if (Platform.OS === "ios") {
    return "ios";
  }

  if (Platform.OS === "android") {
    return "android";
  }

  return "web";
};

type PermissionResponse = Location.LocationPermissionResponse;

const IOS_PERMISSION_MAP: Record<string, LocationPermissionStatus> = {
  always: "authorizedAlways",
  whenInUse: "authorizedWhenInUse",
  none: "denied",
};

const ANDROID_PERMISSION_GRANTED: Record<string, LocationPermissionStatus> = {
  fine: "grantedForeground",
  coarse: "granted",
  none: "denied",
};

const resolveLocationPermissionStatus = (
  response: PermissionResponse,
): LocationPermissionStatus => {
  if (response.ios?.scope) {
    const mapped = IOS_PERMISSION_MAP[response.ios.scope];
    if (mapped) {
      return mapped;
    }
  }

  if (response.android?.accuracy) {
    const mapped = ANDROID_PERMISSION_GRANTED[response.android.accuracy];
    if (mapped) {
      return mapped;
    }
  }

  switch (response.status) {
    case Location.PermissionStatus.GRANTED:
      return "granted";
    case Location.PermissionStatus.DENIED:
      return "denied";
    default:
      return "notDetermined";
  }
};

const isValidPermissionStatus = (
  status: LocationPermissionStatus | null,
): status is LocationPermissionStatus => {
  return status !== null && LOCATION_PERMISSION_STATUS_VALUES.includes(status);
};

const createWorkLogLocation = (
  coords: Location.LocationObjectCoords,
  timestamp: number,
  permissionStatus: LocationPermissionStatus,
): WorkLogLocation => {
  const accuracy =
    typeof coords.accuracy === "number" && Number.isFinite(coords.accuracy)
      ? coords.accuracy
      : null;

  return {
    latitude: coords.latitude,
    longitude: coords.longitude,
    accuracyMeters: accuracy,
    capturedAt: new Date(Number.isFinite(timestamp) ? timestamp : Date.now())
      .toISOString(),
    deviceType: getDeviceType(),
    permissionStatus,
  };
};

interface WorkLogLocationHook extends WorkLogLocationState {
  requestLocation: () => Promise<WorkLogLocation | null>;
  checkPermissionStatus: () => Promise<LocationPermissionStatus>;
}

export const useWorkLogLocation = (): WorkLogLocationHook => {
  const [state, setState] = useState<WorkLogLocationState>({
    location: null,
    permissionStatus: null,
    isLoading: false,
    error: null,
  });

  const checkPermissionStatus = useCallback(async () => {
    try {
      const response = await Location.getForegroundPermissionsAsync();
      const permissionStatus = resolveLocationPermissionStatus(response);
      setState((prev) => ({
        ...prev,
        permissionStatus,
      }));
      return permissionStatus;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        permissionStatus: "notDetermined",
        error: error instanceof Error
          ? error.message
          : "Failed to check permission status",
      }));
      return "notDetermined";
    }
  }, []);

  const requestLocation = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      const permissionResponse = await Location
        .requestForegroundPermissionsAsync();
      const permissionStatus = resolveLocationPermissionStatus(
        permissionResponse,
      );

      if (!isValidPermissionStatus(permissionStatus)) {
        throw new Error("Unable to determine location permission status.");
      }

      if (!permissionResponse.granted) {
        setState({
          location: null,
          permissionStatus,
          isLoading: false,
          error: null,
        });

        return null;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const location = createWorkLogLocation(
        position.coords,
        position.timestamp,
        permissionStatus,
      );

      setState({
        location,
        permissionStatus,
        isLoading: false,
        error: null,
      });

      return location;
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : "Unable to capture location.";

      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: message,
      }));

      return null;
    }
  }, []);

  return {
    ...state,
    requestLocation,
    checkPermissionStatus,
  };
};
