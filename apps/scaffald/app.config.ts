import appPackage from "./package.json";
import dotenv from "dotenv";
import path from "path";

// Mapbox configuration constants
// Note: Inlined here because Expo's config evaluation can't resolve TypeScript imports from packages
const MAP_STYLE_CONFIG = {
  light: "mapbox://styles/mapbox/standard",
  dark: "mapbox://styles/scaffald/cmhzad6vd001b01rs4rbn93p9",
} as const;

const MAPBOX_API_BASE_URL = "https://api.mapbox.com" as const;

const APP_ENV = process.env.APP_ENV || "development";
const ENV_FILE_MAP: Record<string, string> = {
  production: ".env.production",
  preview: ".env.preview",
  staging: ".env.staging",
  dev: ".env.dev",
  "dev-local": ".env.dev-local",
  development: ".env",
};

const envPath = path.resolve(
  __dirname,
  "..",
  "..",
  ENV_FILE_MAP[APP_ENV] || ".env",
);
dotenv.config({ path: envPath, override: true });

const IS_PRODUCTION = APP_ENV === "production";
const packageVersion = (appPackage.version as string | undefined) ?? "1.0.0";
const APP_VERSION = process.env.APP_VERSION || packageVersion;

// `1.17.0` -> `11700`: two digits for the minor, two for the patch. iOS reads
// it as CFBundleVersion, Android as versionCode; both want it unique per
// release and increasing.
//
// Kept inline deliberately. Expo evaluates this file by transpiling it to a
// single app.config.js, so it cannot resolve a relative import either — not
// just the package imports the note at the top of this file warns about.
// Extracting this to ./version-code.ts fails every build with
// "Cannot find module './version-code'". The tests import THIS file rather
// than a copy, so the rule stays pinned without being duplicated.
const deriveVersionCode = (version: string) => {
  const [major = 0, minor = 0, patch = 0] = version
    .split(".")
    .map((segment) => Number.parseInt(segment, 10))
    .map((segment) => (Number.isNaN(segment) ? 0 : segment));

  // Two digits each, so a minor or patch of 100+ collides: 1.100.0 and 2.0.0
  // would both give 20000. Fail the build rather than emit a duplicate — a
  // duplicate is only discovered at submission, after a build has been paid
  // for.
  if (minor > 99 || patch > 99) {
    throw new Error(
      `Version ${version} cannot be encoded as a build number: minor and patch ` +
        `must each be <= 99, or the code collides with another version. Widen ` +
        `the scheme in apps/scaffald/app.config.ts before releasing this version.`,
    );
  }

  return major * 10_000 + minor * 100 + patch;
};

const derivedVersionCode = deriveVersionCode(APP_VERSION);

// APP_IOS_BUILD_NUMBER is an OVERRIDE, for respinning a build of a version
// that has already been submitted. It is deliberately not set anywhere by
// default.
//
// It used to be pinned in eas.json's production profile. It was put there to
// respin 1.12.0 as 11201 — and then it stayed, so 1.14.0, 1.15.0 and 1.16.0
// all shipped as 11201 too, and the number stopped identifying anything
// (#513). Apple scopes uniqueness to the version string, so those did not
// collide at submission; what they did was make a TestFlight build
// unmappable back to a release.
//
// Deriving from the version is the original design and is what Android has
// always done, three lines down.
//
// To respin a version, prefer bumping the patch — 1.17.1 gives 11701 by this
// same rule. This variable is read wherever app.config.ts is evaluated, and an
// EAS cloud build evaluates it on the worker, which does not inherit your
// shell; a locally exported value is not known to reach the binary. If you
// need it on a cloud build use `eas env:create --environment production`, and
// delete it afterwards. Anywhere persistent, it becomes #513 again.
const IOS_BUILD_NUMBER =
  (process.env.APP_IOS_BUILD_NUMBER || `${derivedVersionCode}`).toString();
const ANDROID_VERSION_CODE = Number.parseInt(
  process.env.APP_ANDROID_VERSION_CODE || `${derivedVersionCode}`,
  10,
);

// SECURITY: Only use EXPO_PUBLIC_* variables in client bundle
// Non-public PostHog keys should be server-side only
const EXPO_PUBLIC_POSTHOG_API_KEY = process.env.EXPO_PUBLIC_POSTHOG_API_KEY;
const EXPO_PUBLIC_POSTHOG_HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST;
const EXPO_PUBLIC_POSTHOG_PROJECT = process.env.EXPO_PUBLIC_POSTHOG_PROJECT;
const EXPO_PUBLIC_SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const EXPO_PUBLIC_SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const EXPO_PUBLIC_SENTRY_DSN_NATIVE = process.env.EXPO_PUBLIC_SENTRY_DSN_NATIVE;
const EXPO_PUBLIC_SENTRY_DSN_WEB = process.env.EXPO_PUBLIC_SENTRY_DSN_WEB;

// Fallback for app.config.ts (only used during build, not in client bundle)
const POSTHOG_HOST = EXPO_PUBLIC_POSTHOG_HOST || "https://app.posthog.com";

const IOS_BUNDLE_BASE = "com.scaffald.app";
const ANDROID_PACKAGE_BASE = "com.scaffald.app";
const iosBundleIdentifier = IS_PRODUCTION
  ? IOS_BUNDLE_BASE
  : `${IOS_BUNDLE_BASE}.${APP_ENV}`;
const androidPackage = IS_PRODUCTION
  ? ANDROID_PACKAGE_BASE
  : `${ANDROID_PACKAGE_BASE}.${APP_ENV}`;

export default {
  expo: {
    name: IS_PRODUCTION ? "Scaffald" : `Scaffald (${APP_ENV})`,
    slug: "scf-scaffald",
    jsEngine: "hermes",
    scheme: "com.scaffald",
    version: APP_VERSION,
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "automatic",
    splash: {
      image: "./assets/splash.png",
      contentFit: "contain",
      backgroundColor: "#E9FCFF",
    },
    updates: {
      fallbackToCacheTimeout: 0,
      url: "https://u.expo.dev/your-project-id",
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true,
      bundleIdentifier: iosBundleIdentifier,
      buildNumber: IOS_BUILD_NUMBER,
      infoPlist: {
        // App uses standard HTTPS / no custom encryption. Setting this to
        // false skips Apple's per-upload encryption-export questionnaire.
        // If we ever ship custom crypto we'll need to flip this to true and
        // provide ECCN documentation.
        ITSAppUsesNonExemptEncryption: false,
        // "location" intentionally NOT declared: Apple App Store review will
        // reject apps that declare background-location capability without
        // actively using TaskManager / startLocationUpdatesAsync. Add it back
        // only when a real background-location feature ships.
        UIBackgroundModes: ["fetch", "remote-notification"],
        // Permission strings must match what's declared in App Store Connect →
        // App Privacy and explain WHY the data is collected. Apple frequently
        // rejects generic strings like "Allow access to your location."
        // Background-location strings (NSLocationAlways*) are intentionally
        // omitted: we use foreground location only. Re-add them only if a
        // real background-tracking feature ships.
        NSLocationWhenInUseUsageDescription:
          "Scaffald uses your location to show nearby trade jobs and workers on the map.",
        NSPhotoLibraryUsageDescription:
          "Scaffald accesses your photos so you can upload a profile picture and attach images to job listings.",
        NSCameraUsageDescription:
          "Scaffald uses the camera so you can take a profile photo or capture jobsite images for listings.",
        // No NSUserTrackingUsageDescription: Scaffald does not "track" under
        // Apple Guideline 5.1.2(i). PostHog (first-party product analytics,
        // geoip disabled) and Sentry (error monitoring) are first-party
        // service providers — no IDFA, no ad networks, no data brokers, no
        // cross-app linking. Analytics identity is gated on the in-app
        // performance/cookie consent, not ATT.
      },
      // Apple Privacy Manifest (PrivacyInfo.xcprivacy). Required since
      // May 2024 — Expo merges this dict into the file it generates at
      // prebuild time. Update whenever a new SDK or data category lands.
      // See app-store-assets/privacy-checklist.md for the source-of-truth
      // mapping.
      privacyManifests: {
        // Scaffald does not track (Apple Guideline 5.1.2(i)). Data goes only
        // to first-party service providers (PostHog product analytics with
        // geoip disabled, Sentry error monitoring) — never combined with
        // other companies' data for advertising and never shared with a data
        // broker. Therefore NSPrivacyTracking is false and there are no
        // NSPrivacyTrackingDomains. If a true cross-app/advertising tracker
        // is ever added, flip this to true, re-add NSPrivacyTrackingDomains,
        // re-add the ATT key + expo-tracking-transparency plugin, and flag
        // the relevant data types' NSPrivacyCollectedDataTypeTracking.
        NSPrivacyTracking: false,
        // Required-reason API declarations. Expo prebuild already populates
        // entries for APIs used by installed pods (UserDefaults, file
        // timestamps, system boot time, disk space). They are listed here
        // explicitly so this file remains the single source of truth and
        // doesn't silently regress if prebuild's detection misses a pod.
        NSPrivacyAccessedAPITypes: [
          {
            NSPrivacyAccessedAPIType: "NSPrivacyAccessedAPICategoryUserDefaults",
            NSPrivacyAccessedAPITypeReasons: ["CA92.1", "C56D.1"],
          },
          {
            NSPrivacyAccessedAPIType: "NSPrivacyAccessedAPICategoryFileTimestamp",
            NSPrivacyAccessedAPITypeReasons: ["C617.1", "0A2A.1", "3B52.1"],
          },
          {
            NSPrivacyAccessedAPIType: "NSPrivacyAccessedAPICategorySystemBootTime",
            NSPrivacyAccessedAPITypeReasons: ["35F9.1"],
          },
          {
            NSPrivacyAccessedAPIType: "NSPrivacyAccessedAPICategoryDiskSpace",
            NSPrivacyAccessedAPITypeReasons: ["E174.1", "85F4.1"],
          },
        ],
        // Data we collect. Each entry must match an answer in App Store
        // Connect → App Privacy or Apple will flag inconsistency.
        NSPrivacyCollectedDataTypes: [
          {
            NSPrivacyCollectedDataType: "NSPrivacyCollectedDataTypeEmailAddress",
            NSPrivacyCollectedDataTypeLinked: true,
            NSPrivacyCollectedDataTypeTracking: false,
            NSPrivacyCollectedDataTypePurposes: [
              "NSPrivacyCollectedDataTypePurposeAppFunctionality",
            ],
          },
          {
            NSPrivacyCollectedDataType: "NSPrivacyCollectedDataTypeName",
            NSPrivacyCollectedDataTypeLinked: true,
            NSPrivacyCollectedDataTypeTracking: false,
            NSPrivacyCollectedDataTypePurposes: [
              "NSPrivacyCollectedDataTypePurposeAppFunctionality",
            ],
          },
          {
            NSPrivacyCollectedDataType: "NSPrivacyCollectedDataTypePhoneNumber",
            NSPrivacyCollectedDataTypeLinked: true,
            NSPrivacyCollectedDataTypeTracking: false,
            NSPrivacyCollectedDataTypePurposes: [
              "NSPrivacyCollectedDataTypePurposeAppFunctionality",
            ],
          },
          {
            NSPrivacyCollectedDataType: "NSPrivacyCollectedDataTypePhotosorVideos",
            NSPrivacyCollectedDataTypeLinked: true,
            NSPrivacyCollectedDataTypeTracking: false,
            NSPrivacyCollectedDataTypePurposes: [
              "NSPrivacyCollectedDataTypePurposeAppFunctionality",
            ],
          },
          {
            NSPrivacyCollectedDataType: "NSPrivacyCollectedDataTypeCoarseLocation",
            NSPrivacyCollectedDataTypeLinked: true,
            NSPrivacyCollectedDataTypeTracking: false,
            NSPrivacyCollectedDataTypePurposes: [
              "NSPrivacyCollectedDataTypePurposeAppFunctionality",
            ],
          },
          {
            NSPrivacyCollectedDataType: "NSPrivacyCollectedDataTypePreciseLocation",
            NSPrivacyCollectedDataTypeLinked: true,
            NSPrivacyCollectedDataTypeTracking: false,
            NSPrivacyCollectedDataTypePurposes: [
              "NSPrivacyCollectedDataTypePurposeAppFunctionality",
            ],
          },
          {
            NSPrivacyCollectedDataType: "NSPrivacyCollectedDataTypeUserID",
            NSPrivacyCollectedDataTypeLinked: true,
            NSPrivacyCollectedDataTypeTracking: false,
            NSPrivacyCollectedDataTypePurposes: [
              "NSPrivacyCollectedDataTypePurposeAppFunctionality",
              "NSPrivacyCollectedDataTypePurposeAnalytics",
            ],
          },
          {
            NSPrivacyCollectedDataType: "NSPrivacyCollectedDataTypeDeviceID",
            NSPrivacyCollectedDataTypeLinked: true,
            NSPrivacyCollectedDataTypeTracking: false,
            NSPrivacyCollectedDataTypePurposes: [
              "NSPrivacyCollectedDataTypePurposeAnalytics",
            ],
          },
          {
            NSPrivacyCollectedDataType: "NSPrivacyCollectedDataTypeProductInteraction",
            NSPrivacyCollectedDataTypeLinked: true,
            NSPrivacyCollectedDataTypeTracking: false,
            NSPrivacyCollectedDataTypePurposes: [
              "NSPrivacyCollectedDataTypePurposeAnalytics",
              "NSPrivacyCollectedDataTypePurposeProductPersonalization",
            ],
          },
          {
            NSPrivacyCollectedDataType: "NSPrivacyCollectedDataTypeCrashData",
            NSPrivacyCollectedDataTypeLinked: false,
            NSPrivacyCollectedDataTypeTracking: false,
            NSPrivacyCollectedDataTypePurposes: [
              "NSPrivacyCollectedDataTypePurposeAppFunctionality",
              "NSPrivacyCollectedDataTypePurposeAnalytics",
            ],
          },
          {
            NSPrivacyCollectedDataType: "NSPrivacyCollectedDataTypePerformanceData",
            NSPrivacyCollectedDataTypeLinked: false,
            NSPrivacyCollectedDataTypeTracking: false,
            NSPrivacyCollectedDataTypePurposes: [
              "NSPrivacyCollectedDataTypePurposeAnalytics",
            ],
          },
        ],
      },
    },
    android: {
      softwareKeyboardLayoutMode: "pan",
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#FFFFFF",
      },
      package: androidPackage,
      // No `permissions` array on purpose — the plugins below declare what
      // they need, and anything listed here is *additional*.
      //
      // This used to carry android.permission.RECORD_AUDIO explicitly, added
      // incidentally in c6b40b5 ("Building without errors but styles are not
      // quite building correctly") rather than for a feature. Nothing in the
      // app records audio: no expo-av, no expo-audio, no WebRTC, no
      // getUserMedia, no mic-adjacent dependency of any kind.
      //
      // Deleting the entry alone did NOT remove it. expo-image-picker's plugin
      // adds RECORD_AUDIO on Android unless it is told not to, so the resolved
      // config still had it. `microphonePermission: false` on that plugin is
      // the real fix, and it additionally BLOCKS the permission so no other
      // package can put it back. See the plugin config below.
      //
      // Worth the trouble because Play lists declared permissions on the store
      // page — a hiring app appearing to want your microphone is an install
      // cost — and Data safety would otherwise have to declare "Voice or sound
      // recordings" for data the app never collects.
      versionCode: ANDROID_VERSION_CODE,
    },
    web: {
      favicon: "./assets/favicon.png",
      bundler: "metro",
      output: "server",
      name: "Scaffald",
      shortName: "Scaffald",
      description: "Modern hiring for technical trades",
      startUrl: "/",
      display: "standalone",
      orientation: "portrait",
      themeColor: "#ffffff",
      backgroundColor: "#ffffff",
      lang: "en",
      dir: "ltr",
      meta: {
        viewport: "width=device-width, initial-scale=1, shrink-to-fit=no",
        "theme-color": "#ffffff",
        "apple-mobile-web-app-capable": "yes",
        "apple-mobile-web-app-status-bar-style": "default",
        "apple-mobile-web-app-title": "Scaffald",
        "format-detection": "telephone=no",
        "mobile-web-app-capable": "yes",
        "msapplication-TileColor": "#ffffff",
        "msapplication-tap-highlight": "no",
      },
    },
    plugins: [
      [
        "expo-notifications",
        {
          icon: "./assets/icon.png",
          color: "#ffffff",
        },
      ],
      [
        "expo-image-picker",
        {
          photosPermission:
            "Scaffald accesses your photos so you can upload a profile picture and attach images to job listings.",
          cameraPermission:
            "Scaffald uses the camera so you can take a profile photo or capture jobsite images for listings.",
          // Nothing in the app records audio. `false` both removes
          // RECORD_AUDIO and blocks it, so a future dependency cannot
          // reintroduce it quietly.
          microphonePermission: false,
        },
      ],
      [
        "expo-location",
        {
          // Foreground-only — we do not use background location. Background
          // flags are intentionally false to match the App Privacy form and
          // avoid rejection for declaring unused capabilities.
          locationWhenInUsePermission:
            "Scaffald uses your location to show nearby trade jobs and workers on the map.",
          isIosBackgroundLocationEnabled: false,
          isAndroidBackgroundLocationEnabled: false,
        },
      ],
      [
        "@react-native-google-signin/google-signin",
        {
          // https://react-native-google-signin.github.io/docs/setting-up/expo
          iosUrlScheme: process.env.EXPO_PUBLIC_GOOGLE_IOS_SCHEME ||
            "com.googleusercontent.apps.163454683152-e4357cqnub2rg3vadkktap71i4nqea88",
        },
      ],
      "expo-apple-authentication",
      [
        "expo-router",
        {
          unstable_useServerRendering: true,
          unstable_useServerDataLoaders: true,
          // NOTE: asyncRoutes is disabled — see below.
        },
      ],
      [
        "expo-build-properties",
        {
          ios: {
            deploymentTarget: "16.4",
          },
        },
      ],
      // AppCheckCore (Swift pod, pulled in transitively via
      // @react-native-google-signin) needs its non-modular deps to generate
      // module maps when built as static libraries, or `pod install` fails:
      // "AppCheckCore depends upon GoogleUtilities and RecaptchaInterop, which
      // do not define modules". expo-build-properties@56 has no `extraPods`
      // option, so a local plugin patches the Podfile. Surfaces on EAS
      // (precompiled modules / static libs), not always locally.
      "./plugins/withModularHeaders",
      "expo-font",
      [
        "@rnmapbox/maps",
        {
          // ONLY the secret downloads token. No fallback to the public one.
          //
          // These are two different credentials for two different APIs.
          // MAPBOX_DOWNLOADS_TOKEN is an `sk.` token carrying DOWNLOADS:READ,
          // used by CocoaPods and Gradle to fetch the Mapbox SDK at build
          // time. EXPO_PUBLIC_MAPBOX_TOKEN is a `pk.` token used by the app at
          // runtime to draw maps. Handing the public one to the downloads API
          // does not degrade gracefully — it 403s and the build dies at
          // Install pods / Run gradlew.
          //
          // The fallback looked harmless for as long as EXPO_PUBLIC_MAPBOX_TOKEN
          // never reached an EAS worker. #686 fixed that, which turned an
          // absent download token into a *wrong* one and broke both platforms
          // at once (iOS beabeb27, Android 7eff37b0). Verified against Mapbox:
          // the pk token reports 0 scopes, no DOWNLOADS:READ, and the downloads
          // API answers 403.
          //
          // Undefined is the correct value when there is no secret token: the
          // 10.1.x SDK resolves without authenticating, which is how every
          // build up to 11700 succeeded. See #509 for why a real sk. token is
          // still wanted — without one, @rnmapbox/maps cannot move past 10.1.x.
          RNMapboxMapsDownloadToken: process.env.MAPBOX_DOWNLOADS_TOKEN,
        },
      ],
    ],
    extra: {
      router: {
        origin: false,
      },
      eas: {
        projectId: "ba0f9b47-eb78-494c-a03f-c33b9defa904",
      },
      mapbox: {
        accessToken: process.env.EXPO_PUBLIC_MAPBOX_TOKEN,
        styleURL: MAP_STYLE_CONFIG.light,
        styleURLDark: MAP_STYLE_CONFIG.dark,
        apiBaseUrl: MAPBOX_API_BASE_URL,
      },
      analytics: {
        posthog: {
          // Only use EXPO_PUBLIC variables - these are safe to expose to clients
          host: EXPO_PUBLIC_POSTHOG_HOST || POSTHOG_HOST ||
            "https://app.posthog.com",
          key: EXPO_PUBLIC_POSTHOG_API_KEY || "",
          env: APP_ENV,
          project: EXPO_PUBLIC_POSTHOG_PROJECT,
        },
      },
      sentry: {
        // Only use EXPO_PUBLIC variables - these are safe to expose to clients
        dsnNative: EXPO_PUBLIC_SENTRY_DSN_NATIVE || "",
        dsnWeb: EXPO_PUBLIC_SENTRY_DSN_WEB || "",
        env: APP_ENV,
      },
      supabase: {
        url: EXPO_PUBLIC_SUPABASE_URL,
        anonKey: EXPO_PUBLIC_SUPABASE_ANON_KEY,
      },
      appEnv: APP_ENV,
      // Only expose public PostHog config - non-public keys should be server-side only
      posthogHost: EXPO_PUBLIC_POSTHOG_HOST || "https://app.posthog.com",
      posthogKey: EXPO_PUBLIC_POSTHOG_API_KEY || "",
      posthogProject: EXPO_PUBLIC_POSTHOG_PROJECT,
    },
    runtimeVersion: {
      policy: "appVersion",
    },
    experiments: {
      autolinkingModuleResolution: true,
    },
    owner: "unicorn-love",
  },
};
