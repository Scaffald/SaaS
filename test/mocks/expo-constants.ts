const expoConfig = {
  version: '1.0.0',
  ios: { buildNumber: '1' },
  android: { versionCode: 1 },
  extra: {
    sentryRelease: 'test@1.0.0',
  },
}

export default {
  expoConfig,
  manifest: expoConfig,
}


