#!/usr/bin/env node

/**
 * Sentry Setup Script
 * 
 * Automates Sentry configuration for iOS and Android after expo prebuild.
 * This script is idempotent and can be run multiple times safely.
 * 
 * Usage:
 *   node scripts/setup-sentry.mjs
 *   pnpm setup-sentry
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT_DIR = path.resolve(__dirname, '..')
const EXPO_DIR = path.join(ROOT_DIR, 'apps', 'scaffald')

// ANSI color codes for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
}

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`)
}

function success(message) {
  log(`✅ ${message}`, colors.green)
}

function warning(message) {
  log(`⚠️  ${message}`, colors.yellow)
}

function error(message) {
  log(`❌ ${message}`, colors.red)
}

function info(message) {
  log(`ℹ️  ${message}`, colors.blue)
}

// Check if iOS/Android folders exist
function checkPrerequisites() {
  const iosDir = path.join(EXPO_DIR, 'ios')
  const androidDir = path.join(EXPO_DIR, 'android')

  if (!fs.existsSync(iosDir) && !fs.existsSync(androidDir)) {
    error('iOS and Android folders not found.')
    info('Run "pnpm prebuild" first to generate native folders.')
    process.exit(1)
  }

  return {
    hasIos: fs.existsSync(iosDir),
    hasAndroid: fs.existsSync(androidDir),
  }
}

// Create sentry.properties file
function createSentryProperties(platform) {
  const platformDir = path.join(EXPO_DIR, platform)
  const propertiesPath = path.join(platformDir, 'sentry.properties')

  // Read auth token from environment
  const authToken = process.env.SENTRY_AUTH_TOKEN || '___REPLACE_WITH_YOUR_SENTRY_AUTH_TOKEN___'

  const content = `defaults.url=https://sentry.io/
defaults.org=unicorn-labs
defaults.project=scaffald-native
auth.token=${authToken}
`

  fs.writeFileSync(propertiesPath, content, 'utf8')

  if (authToken.includes('REPLACE')) {
    warning(`${platform}/sentry.properties created with placeholder token`)
    info(`Set SENTRY_AUTH_TOKEN environment variable or edit ${propertiesPath}`)
  } else {
    success(`${platform}/sentry.properties created`)
  }

  return propertiesPath
}

// Setup Android Sentry configuration
function setupAndroid() {
  info('Configuring Android...')

  // 1. Create sentry.properties
  createSentryProperties('android')

  // 2. Patch app/build.gradle to add Sentry Gradle integration
  const appBuildGradlePath = path.join(EXPO_DIR, 'android', 'app', 'build.gradle')

  if (!fs.existsSync(appBuildGradlePath)) {
    error('android/app/build.gradle not found')
    return false
  }

  let appBuildGradle = fs.readFileSync(appBuildGradlePath, 'utf8')

  // Check if Sentry Gradle integration is already added
  if (appBuildGradle.includes('sentry.gradle')) {
    info('Sentry Gradle integration already configured in app/build.gradle')
  } else {
    // Find the first line with "apply plugin" and add before it
    const applyPluginMatch = appBuildGradle.match(/^apply\s+plugin:/m)
    if (applyPluginMatch) {
      const insertIndex = appBuildGradle.indexOf(applyPluginMatch[0])
      const sentryGradleImport = 'apply from: "../../node_modules/@sentry/react-native/sentry.gradle"\n\n'
      appBuildGradle = appBuildGradle.slice(0, insertIndex) + sentryGradleImport + appBuildGradle.slice(insertIndex)
      fs.writeFileSync(appBuildGradlePath, appBuildGradle, 'utf8')
      success('Added Sentry Gradle integration to app/build.gradle')
    } else {
      warning('Could not find insertion point in app/build.gradle')
      info('Manually add: apply from: "../../node_modules/@sentry/react-native/sentry.gradle"')
    }
  }

  // 3. Patch build.gradle to add Sentry Android Gradle Plugin
  const buildGradlePath = path.join(EXPO_DIR, 'android', 'build.gradle')

  if (!fs.existsSync(buildGradlePath)) {
    error('android/build.gradle not found')
    return false
  }

  let buildGradle = fs.readFileSync(buildGradlePath, 'utf8')

  // Check if Sentry AGP is already added
  if (buildGradle.includes('sentry-android-gradle-plugin')) {
    info('Sentry Android Gradle Plugin already configured in build.gradle')
  } else {
    // Add to buildscript dependencies
    const dependenciesMatch = buildGradle.match(/buildscript\s*\{[\s\S]*?dependencies\s*\{/)
    if (dependenciesMatch) {
      const insertIndex = buildGradle.indexOf(dependenciesMatch[0]) + dependenciesMatch[0].length
      const sentryAgpDependency = '\n        classpath("io.sentry:sentry-android-gradle-plugin:4.17.0")'
      buildGradle = buildGradle.slice(0, insertIndex) + sentryAgpDependency + buildGradle.slice(insertIndex)
      fs.writeFileSync(buildGradlePath, buildGradle, 'utf8')
      success('Added Sentry Android Gradle Plugin to build.gradle')
    } else {
      warning('Could not find buildscript dependencies in build.gradle')
      info('Manually add: classpath("io.sentry:sentry-android-gradle-plugin:4.17.0")')
    }
  }

  // 4. Patch app/build.gradle to apply and configure Sentry plugin
  appBuildGradle = fs.readFileSync(appBuildGradlePath, 'utf8')

  if (appBuildGradle.includes('apply plugin: "io.sentry.android.gradle"')) {
    info('Sentry plugin already applied in app/build.gradle')
  } else {
    // Add after other apply plugin statements
    const lastApplyPlugin = appBuildGradle.lastIndexOf('apply plugin:')
    if (lastApplyPlugin !== -1) {
      const lineEnd = appBuildGradle.indexOf('\n', lastApplyPlugin) + 1
      const sentryPluginConfig = `apply plugin: "io.sentry.android.gradle"

sentry {
    uploadNativeSymbols = true
    includeNativeSources = true
    autoInstallation {
        enabled = false
    }
}

`
      appBuildGradle = appBuildGradle.slice(0, lineEnd) + sentryPluginConfig + appBuildGradle.slice(lineEnd)
      fs.writeFileSync(appBuildGradlePath, appBuildGradle, 'utf8')
      success('Applied and configured Sentry plugin in app/build.gradle')
    }
  }

  success('Android configuration complete!')
  return true
}

// Setup iOS Sentry configuration
function setupIOS() {
  info('Configuring iOS...')

  // 1. Create sentry.properties
  createSentryProperties('ios')

  // 2. iOS Xcode configuration needs to be done via Sentry CLI or manually
  const pbxprojPath = path.join(EXPO_DIR, 'ios', fs.readdirSync(path.join(EXPO_DIR, 'ios')).find(f => f.endsWith('.xcodeproj')), 'project.pbxproj')

  if (!fs.existsSync(pbxprojPath)) {
    warning('Xcode project file not found')
    return false
  }

  warning('iOS Xcode build phases need to be configured manually or via Sentry CLI')
  info('')
  info('Option 1: Use Sentry CLI (recommended)')
  info('  npx @sentry/wizard@latest -i reactNative --saas --org unicorn-labs --project scaffald-native')
  info('')
  info('Option 2: Manual configuration')
  info('  See packages/core/utils/sentry/IOS_SETUP.md for detailed instructions')
  info('')
  info('Build phases to add:')
  info('  1. Modify "Bundle React Native code and images" to use sentry-xcode.sh')
  info('  2. Add "Upload Debug Symbols to Sentry" build phase')
  info('')

  success('iOS sentry.properties created')
  warning('iOS Xcode build phases require manual setup (see above)')

  return true
}

// Add .gitignore entries
function updateGitignore() {
  const gitignorePath = path.join(EXPO_DIR, '.gitignore')

  if (!fs.existsSync(gitignorePath)) {
    warning('.gitignore not found in apps/scaffald')
    return
  }

  let gitignore = fs.readFileSync(gitignorePath, 'utf8')

  const sentryEntries = [
    '# Sentry',
    'ios/sentry.properties',
    'android/sentry.properties',
  ]

  let needsUpdate = false
  for (const entry of sentryEntries) {
    if (!gitignore.includes(entry)) {
      needsUpdate = true
      break
    }
  }

  if (needsUpdate) {
    if (!gitignore.endsWith('\n')) {
      gitignore += '\n'
    }
    gitignore += '\n' + sentryEntries.join('\n') + '\n'
    fs.writeFileSync(gitignorePath, gitignore, 'utf8')
    success('Updated .gitignore with Sentry entries')
  } else {
    info('Sentry entries already in .gitignore')
  }
}

// Main execution
async function main() {
  log('\n' + '='.repeat(60), colors.bright)
  log('  Sentry Configuration Setup', colors.bright)
  log('='.repeat(60) + '\n', colors.bright)

  // Check prerequisites
  const { hasIos, hasAndroid } = checkPrerequisites()

  if (!hasIos && !hasAndroid) {
    error('No iOS or Android folders found')
    process.exit(1)
  }

  // Setup platforms
  if (hasAndroid) {
    try {
      setupAndroid()
    } catch (err) {
      error(`Android setup failed: ${err.message}`)
      console.error(err)
    }
  }

  if (hasIos) {
    try {
      setupIOS()
    } catch (err) {
      error(`iOS setup failed: ${err.message}`)
      console.error(err)
    }
  }

  // Update .gitignore
  updateGitignore()

  // Final instructions
  log('\n' + '='.repeat(60), colors.bright)
  log('  Setup Complete', colors.bright)
  log('='.repeat(60) + '\n', colors.bright)

  info('Next steps:')
  info('1. Set SENTRY_AUTH_TOKEN environment variable')
  info('2. For iOS: Configure Xcode build phases (see above)')
  info('3. Build the app to verify Sentry integration')
  info('4. Check Sentry dashboard for events')
  info('')
  info('Documentation:')
  info('  - packages/core/utils/sentry/README.md')
  info('  - packages/core/utils/sentry/IOS_SETUP.md')
  info('  - packages/core/utils/sentry/ANDROID_SETUP.md')
  info('')
}

// Run the script
main().catch((err) => {
  error('Script failed:')
  console.error(err)
  process.exit(1)
})

