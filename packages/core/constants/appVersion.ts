import Constants from 'expo-constants'
import * as Updates from 'expo-updates'

interface VersionSegments {
  major: number
  minor: number
  patch: number
  derivedBuildNumber: number
}

const DEFAULT_VERSION = '0.0.0'

const parseVersionSegments = (version: string): VersionSegments => {
  const [major = 0, minor = 0, patch = 0] = version
    .split('.')
    .map((segment) => Number.parseInt(segment, 10))
    .map((segment) => (Number.isNaN(segment) ? 0 : segment))

  const derivedBuildNumber = major * 10_000 + minor * 100 + patch

  return {
    major,
    minor,
    patch,
    derivedBuildNumber,
  }
}

const rawAppVersion = (
  Constants.expoConfig?.version ??
  process.env.APP_VERSION ??
  DEFAULT_VERSION
).toString()

const segments = parseVersionSegments(rawAppVersion)

const iosBuildNumber =
  Constants.expoConfig?.ios?.buildNumber ??
  Constants.nativeBuildVersion ??
  segments.derivedBuildNumber.toString()

const androidVersionCode =
  Constants.expoConfig?.android?.versionCode ?? segments.derivedBuildNumber

const runtimeVersion =
  typeof Updates.runtimeVersion === 'string'
    ? Updates.runtimeVersion
    : Updates.runtimeVersion
      ? JSON.stringify(Updates.runtimeVersion)
      : undefined

const updateChannel = Updates.channel ?? null

export const APP_VERSION = rawAppVersion
export const IOS_BUILD_NUMBER = iosBuildNumber
export const ANDROID_VERSION_CODE = androidVersionCode
export const RUNTIME_VERSION = runtimeVersion
export const UPDATE_CHANNEL = updateChannel

export const formatVersionLabel = () => {
  if (iosBuildNumber) {
    return `v${APP_VERSION} (${iosBuildNumber})`
  }

  if (androidVersionCode) {
    return `v${APP_VERSION} (${androidVersionCode})`
  }

  return `v${APP_VERSION}`
}

export const getVersionDebugPayload = () => ({
  version: APP_VERSION,
  iosBuildNumber,
  androidVersionCode,
  runtimeVersion,
  updateChannel,
})

