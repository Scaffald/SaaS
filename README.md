## Getting Started

If you're getting issues with the /android or /ios directories when setting up the starter, you can safely remove them and re-generate them using `yarn ios` and `yarn android`.

In the expo folder, You can also run the `yarn start:dev-client` command which will start the dev client for you with a pre-built step that will re generate the native apps (recreate the ios and android folders) on the fly.

## Environment

### Supported Platforms and Versions

We don't provide priority support for Windows, and lesser to Linux, but we do aim to solve issues with them if you report them.

The following are the tested and supported versions of packages:

- Node.js: 18.17.0
- Yarn: 4.1.0
- npm: 9.6.7
- TypeScript: 5.3.3

- React Native: 0.76.5
- Expo SDK: 52.0.23

- Xcode: 16.2
- iOS SDK: 18.2
- Android Studio: 2024.3
- Android SDK: API Level 35
- CocoaPods: 1.14.3 (avoid 1.15 due to known issues)

- Supabase: Latest version
- PostgreSQL: 14.15
- Docker: 28.2.2

- macOS: 15.5 (Sequoia)
- iOS: 18.2
- Android: API Level 35

- Git: 2.46.2
- Java: 23.0.2 (for Android development)
- Ruby: 3.2.2 (for iOS development with CocoaPods)

### `.env`

Setup your environment variables in the `.env` file. See [`env.example`](.env.example) for the full list of environment variables.

https://react-native-google-signin.github.io/docs/setting-up/expo



### Setting up iOS

Note that Cocoapods 1.15 has a [breaking bug](https://github.com/CocoaPods/CocoaPods/issues/12226). We recommend using version 1.14.3.

You'll need to ensure you have the right NODE_BINARY environment variable set. 

We like `fnm` to manage node, and then ensure your `apps/expo/ios/.xcode.env` has the contents of `which node`. With `fnm` it looks like:

```bash
NODE_BINARY=/Users/n8/Library/Caches/fnm_multishells/69747_1653603955297/bin/node
```

You may need to run `yarn ios` once to have it generate the env file, and then re-run it once you set the NODE_BINARY properly.

## Included packages

- [Tamagui](https://tamagui.dev)
- [solito](https://solito.dev)
- [Expo SDK](https://expo.dev)
- [Expo Router](https://docs.expo.dev/router/introduction/)
- [Supabase](https://supabase.com)

## First-time Configuration

Note that you don't need to do this if you've already cloned this using `create tamagui`.

To configure the project, `cd` into the root of the project and run `yarn setup`.

## Supabase Authentication and Database

We use Supabase Auth, Storage, Database, and Client Libraries.

If you don't have one already, create an account with [Supabase](https://supabase.com).
If you're using Supabase, you can skip to the next section.

### Supabase Setup

Create a new Supabase project by following the [Supabase Project](https://supabase.com/docs/guides/project) guide.

Once you have a project, click "Connect" and select App Frameworks.

#### Supabase Auth

We use Supabase Auth for user authentication.

You can create a new Supabase Auth setup by following the [Supabase Auth](https://supabase.com/docs/guides/auth) guide.

If you'd like to add OAuth like Google Sign In, you can follow the [Supabase Auth OAuth](https://supabase.com/docs/guides/auth/social-login/auth-google) guide.

#### Supabase Storage

We use Supabase Storage for storing user avatars.

You can create a new Supabase Storage by following the [Supabase Storage](https://supabase.com/docs/guides/storage) guide.

#### Supabase Database

We use Supabase Database for storing user data.

You can create a new Supabase database by following the [Supabase Database](https://supabase.com/docs/guides/database) guide.

### Development with Supabase

It is possible to develop locally with Supabase. This is useful for development and testing.

#### Initial Supabase Setup Steps

After cloning the project and setting up your environment variables:

1. Navigate to the supabase folder:
   ```bash
   cd supabase
   ```

2. Link your Supabase project:
   ```bash
   yarn link-project
   ```

3. Deploy the initial database tables:
   ```bash
   yarn deploy
   ```

These steps will create the necessary tables in your online Supabase project.

<details>
  <summary>Self-hosting Supabase</summary>

Please reference [Supabase's documentation](https://supabase.com/docs/guides/self-hosting/docker) for docker configuration instructions.

## </details>

---

> Note: If you don't want to setup locally - some users have a second Supabase project that they use for development.

## Development

### Development scripts

- Web: `yarn web`
- iOS: `yarn ios`
- Android: `yarn android`

NOTE: When using tRPC, even if you just want to develop on native, you need to have the web server running to be able to make tRPC requests.

The iOS simulator will not make requests to localhost

```bash
yarn web -H $(yarn get-local-ip-mac | head -n 1)
```

### EAS dev builds

> [!IMPORTANT]  
> You need to update your `owner` inside `apps/expo/app.config.js` to your own username, along with your env variables for each EAS build environment.

```json
{
  "expo": {
    "owner": "your-username"
  }
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
      "env": {
        "APP_ENV": "development",
        "EXPO_PUBLIC_URL": "[YOUR_LOCAL_NEXTJS_URL]",
        "EXPO_PUBLIC_SUPABASE_URL": "https://[YOUR-PROJECT-ID].supabase.co",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "[YOUR-ANON-KEY]"
      }
    },
    "preview": {
      "distribution": "internal",
      "env": {
        "APP_ENV": "development",
        "EXPO_PUBLIC_URL": "[YOUR-PUBLIC_APP_URL]",
        "EXPO_PUBLIC_SUPABASE_URL": "https://[YOUR-PROJECT-ID].supabase.co",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "[YOUR-ANON-KEY]"
      }
    },
    "production": {
      "distribution": "store",
      "env": {
        "APP_ENV": "development",
        "EXPO_PUBLIC_URL": "[YOUR-PUBLIC_APP_URL]",
        "EXPO_PUBLIC_SUPABASE_URL": "https://[YOUR-PROJECT-ID].supabase.co",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "[YOUR-ANON-KEY]"
      }
    }
  }
}
```

In the `apps/expo` folder you can use EAS and a few helpful scripts:

- `yarn eas:build:dev:simulator:android` for android
- `yarn eas:build:dev:simulator:ios` for ios

Add `--local` to build locally.

### Code generation script

- Component: `yarn gen component`
- Screen: `yarn gen screen`
- tRPC Router: `yarn gen router`
- **Route: `yarn gen route`** (New! See Route Naming Convention below)

### Signup Flow

Supabase PKCE flow requires email confirmation on sign up. You fill in the sign up form with email and password. Local setup will let you confirm the email by:

1. Navigating to `http://localhost:54324`
2. Filling in the email on the top right corner
3. Clicking email
4. Clicking 'confirm your email address' link

![local development email confirmation](https://i.imgur.com/3r7TGfu.png)

## Folder layout

The main apps are:

- `apps`
  - `expo` (Native)
  - `next` (Web)
- `packages` Shared packages across apps
  - `ui` Includes your custom UI kit that will be optimized by Tamagui
  - `app` You'll be importing most files from `app/`
    - `features` Where most of your code lives.
    - `provider` All providers that wrap the app, sometimes forked by platform.
- `supabase` Supabase files, migrations, types, etc. + [scripts](/supabase/README.md)

Note that the main entry point for the Expo app is at `apps/expo/app/(drawer)/index.tsx`. This is because folders in parenthesis are flattened and Expo Router finds the first index.tsx file. For more on how Expo Router works, [check out their docs](https://docs.expo.dev/router/create-pages/).

## Route Naming Convention

We follow a consistent naming convention for dashboard routes to maintain clarity and scalability.

### File Structure Pattern

For every route in `app/dashboard/<parent>/<child>`:

```
packages/core/features/<parent>/
├── <parent>-<child>-left.tsx     # Left column content
├── <parent>-<child>-right.tsx    # Right column content  
├── <parent>-<child>-screen.tsx   # Main screen component
└── config/                       # Configuration files
```

### Component Naming Pattern

```tsx
// Left column component
export function ParentChildLeft() {
  return <div>Left content</div>
}

// Right column component  
export function ParentChildRight() {
  return <div>Right content</div>
}

// Main screen component
export function ParentChildScreen() {
  return (
    <>
      <ParentChildLeft />
      <ParentChildRight />
    </>
  )
}
```

### Examples

**Dashboard Index (`/dashboard/index`):**
- `packages/core/features/dashboard/dashboard-index-left.tsx`
- `packages/core/features/dashboard/dashboard-index-right.tsx`
- `packages/core/features/dashboard/dashboard-index-screen.tsx`
- Components: `DashboardIndexLeft`, `DashboardIndexRight`, `DashboardIndexScreen`

**Profile Overview (`/dashboard/profile/overview`):**
- `packages/core/features/profile/profile-overview-left.tsx`
- `packages/core/features/profile/profile-overview-right.tsx`
- `packages/core/features/profile/profile-overview-screen.tsx`
- Components: `ProfileOverviewLeft`, `ProfileOverviewRight`, `ProfileOverviewScreen`

### Using the Route Generator

The fastest way to create new routes is using the turbo generator:

```bash
yarn gen route
# Enter: profile/overview
```

This creates all necessary files:
- Left/right/screen components in the correct location
- Proper imports and component structure

### Manual Implementation

If you prefer to create routes manually:

**1. Create the feature components:**
```tsx
// packages/core/features/profile/profile-overview-left.tsx
export function ProfileOverviewLeft() {
  return <div>Profile navigation</div>
}

// packages/core/features/profile/profile-overview-right.tsx
export function ProfileOverviewRight() {
  return <div>Profile content</div>
}

// packages/core/features/profile/profile-overview-screen.tsx
export function ProfileOverviewScreen() {
  return (
    <>
      <ProfileOverviewLeft />
      <ProfileOverviewRight />
    </>
  )
}
```

**2. Create the app pages:**

**Next.js (`apps/next/pages/dashboard/profile/overview/index.tsx`):**
```tsx
import { DashboardLayout } from '@app/ui'
import { ProfileOverviewScreen } from '@app/core/features/profile/profile-overview-screen'
import Head from 'next/head'
import type { NextPageWithLayout } from '../_app'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Profile Overview</title>
      </Head>
      <ProfileOverviewScreen />
    </>
  )
}

Page.getLayout = (page) => (
  <DashboardLayout
    header={{ title: 'Profile Overview' }}
    rightContent={page}
  />
)

export default Page
```

**Expo (`apps/expo/app/dashboard/profile/overview/index.tsx`):**
```tsx
import { DashboardLayout } from '@app/ui'
import { ProfileOverviewScreen } from '@app/core/features/profile/profile-overview-screen'

export default function Screen() {
  return (
    <DashboardLayout
      header={{ title: 'Profile Overview' }}
      rightContent={<ProfileOverviewScreen />}
    />
  )
}
```

### Configuration Files

Place configuration files in the `config/` folder:
- `config/constants.ts` - Route-specific constants
- `config/types.ts` - TypeScript type definitions
- `config/data.ts` - Static data and mock data

### Benefits

1. **Visual Clarity** - Easy to identify file types and purposes
2. **Consistent Structure** - Predictable file structure
3. **Scalable** - Easy to add new routes following the same pattern
4. **Maintainable** - Clear separation of concerns
5. **Type Safety** - Consistent component naming for better TypeScript support
6. **Fast Development** - Turbo generator for quick setup

## Layouts

### Dashboard Layout System

We use a unified `DashboardLayout` component for all dashboard pages that provides:

- **Consistent 2-column layout** across all dashboard pages
- **Default header** with hamburger menu, search, and notifications
- **Full header override** support for special cases (like worker/map route)
- **Responsive behavior** for mobile and desktop
- **Independent scrolling** for each column

### Web

We've decided not to move to app dir just yet, but since layouts are crucial to most apps, we use [per-page layouts](https://nextjs.org/docs/pages/building-your-application/routing/pages-and-layouts#per-page-layouts).

**Standard Dashboard Page:**
```tsx
import { DashboardLayout } from '@app/ui'
import { MyPageScreen } from '@app/core/features/myfeat/my-page-screen'
import Head from 'next/head'
import { NextPageWithLayout } from './_app'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>My Page</title>
      </Head>
      <MyPageScreen />
    </>
  )
}

Page.getLayout = (page) => (
  <DashboardLayout
    header={{ title: 'My Page' }}
    rightContent={page}
  />
)

export default Page
```

**Two-Column Dashboard Page:**
```tsx
Page.getLayout = (page) => (
  <DashboardLayout
    header={{ title: 'Profile' }}
    leftContent={<ProfileNavigation />}
    rightContent={page}
    leftWidth={280}
  />
)
```

**Custom Header Override:**
```tsx
Page.getLayout = (page) => (
  <DashboardLayout
    header={null} // Complete override
    rightContent={<CustomMapWithFilters />}
  />
)
```

### Native

**Expo Dashboard Page:**
```tsx
import { DashboardLayout } from '@app/ui'
import { MyPageScreen } from '@app/core/features/myfeat/my-page-screen'

export default function Screen() {
  return (
    <DashboardLayout
      header={{ title: 'My Page' }}
      rightContent={<MyPageScreen />}
    />
  )
}
```

#### React Native Setup Expo

The simplest way to run a native project. A iOS or Android physical device is needed

- [Expo CLI Setup](https://docs.expo.dev/get-started/installation/)

#### Emulator Setup Expo

- [Android](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS](https://docs.expo.dev/workflow/ios-simulator/)

#### First-time Setup

- run a build for either native platform `yarn ios` or `yarn android`

To run an expo app on your machine locally:

- `yarn native` from the root of the project
- select `development` from the cli menu

## Native Builds

Native builds are needed if you're using custom native code in your project.

More documentation on adding your own native code can be found here in Expo's docs: [Adding Custom Native Code](https://docs.expo.dev/workflow/customizing/#adding-custom-native-code-with-development-builds)

To run a [native build](https://docs.expo.dev/develop/development-builds/introduction) of your application, which we recommend:

- `npx expo install expo-dev-client`
- in `apps/expo/package.json` update script `"start": "TAMAGUI_ENV=dev expo start --dev-client"`
- `yarn ios` or `yarn android`

## Expo Go

Expo Go works, but you may need to replace the imports from `@tamagui/animations-moti` to `@tamagui/animations-react-native`.

## Expo EAS Update

[EAS update](https://docs.expo.dev/eas-update/getting-started) makes updating and publishing your app's runtime js easy.

We use `expo-router` for the native side, so simply create `_layout.tsx` files inside `apps/expo` like you would normally do with an `expo-router` project.

- create an expo account and create an expo project.

- add your project id to `apps/expo/app.config.js` where it says `your-project-id`

- ensure that the `projectId`, `slug`, and `owner` values in `apps/expo/app.config.js` all have the same value as the name of your project, ie the name in `apps/expo/package.json`

![expo project id](https://github.com/tamagui/unistack/assets/2502947/8a4d3663-9eb2-4cb1-926f-0476a00ab078)

## How Authentication is Handled

Authentication is handled by Supabase Auth. Email and password auth is included in the starter but you can get OAuth to work too.

Check emails that are sent to you locally like the auth confirmation using InBucket at http://localhost:54324 once your Supabase is running `yarn supa start` from the root of the project.

Redirect URL for email signup needs to be configured in Supabase Auth dashboard on production located in sidebar `authentication / URL Configuration` `Redirect URLs` option.

Getting OAuth to work on web is as easy as it gets but on native, you will need to manually get the OAuth credentials, and then feed them to the Supabase session. See [this article](https://dev.to/fedorish/google-sign-in-using-supabase-and-react-native-expo-14jf) for more info on how to handle native OAuth with Supabase.

For a detailed guide about Supabase and all available script commands see [Supabase README](/supabase/README.md)

### Protecting Pages on Web

We use middlewares to protect routes on the web. See `apps/next/middleware.ts`.

### Protecting Screens on Native

We use a hook to check for auth and then redirect the user to auth pages, and also not let the authenticated users see auth pages. See `apps/expo/app/provider/auth/AuthProvider.ts`.

### Apple Sign In

You can use Sign in with Apple on native for iOS. Configuration on the Supabase side is straightforward as long as you have an Apple Developer account and an app ID. See this [article](https://supabase.com/docs/guides/auth/social-login/auth-apple#configuration-native-app) for more info. If you plan to use Sign in with Apple on the web, there are a few more steps which are explained in the article.

### Google Sign In

Sign in with Google is supported on iOS and Android native with via [react-native-google-signin](https://react-native-google-signin.github.io/docs/setting-up/expo)
See [supabase article](https://supabase.com/docs/guides/auth/social-login/auth-google#configuration-native-app) for more info.

**Note**
In [`env.example`](.env.example) I am putting the gcloud keys so you can test as quickly as possible.
In fact, use your Google Cloud.

```
EXPO_PUBLIC_GOOGLE_IOS_SCHEMEGOOGLE_IOS_SCHEME=YOUR_IOS_SCHEME
GOOGLE_IOS_CLIENT_ID=YOUR_IOS_CLIENT_ID
GOOGLE_WEB_CLIENT_ID=YOUR_WEB_CLIENT_ID #Note: This is the web client ID for Android
GOOGLE_SECRET=YOUR_SECRET
```

#### Troubleshooting

**Android**

`[com.google.android.gms.common.api.ApiException: DEVELOPER_ERROR]`
Read this [StackOverflow](https://stackoverflow.com/a/67705721/9891069) for more info.

## How Authorization is Handled

You can use Supabase's [Row-Level Security (RLS)](https://supabase.com/docs/guides/auth/row-level-security) to handle authorization of users.

## Environment Convention

For simplicities sake we recommend one `.env` file on your local machine for your entire project, in the root directory.

Each app in `apps` can use `with-env` to load the `.env` file.

You can `cp .env.example .env` to get started.

## Installing icons and fonts

To add an icon or font, use:

```sh
yarn add:font
yarn add:icon
```

The package is included in the `packages` workspace in this repo. You can tweak and adjust the icon and font usage and logic to your linking.

## Sync With The Starter

We actively maintain the starter and add new features and updates to it.

## UI Kit

Note we're following the [design systems guide](https://tamagui.dev/docs/guides/design-systems) and creating our own package for components.

See `packages/ui` named `@app/ui` for how this works.

### Layout Components

The UI package includes several layout components:

- **`DashboardLayout`** - Main dashboard layout with 2-column support
- **`ColumnWrapper`** - Scrollable column wrapper for independent scrolling
- **`AppHeader`** - Header component with hamburger menu, search, and notifications

### Component Development

When creating new UI components:

1. **Use Tamagui primitives** (`Button`, `Text`, `View`, `Stack`, etc.)
2. **Follow the design system** patterns established in the UI package
3. **Make components cross-platform** (web, iOS, Android)
4. **Document components** with JSDoc comments
5. **Export from index files** for easy importing

### Code Quality

Always run these commands after making changes:

```bash
yarn format:fix    # Fix formatting issues
yarn lint:fix      # Fix linting issues
yarn check:type    # Check TypeScript types (optional)
```

## Adding new dependencies

### Pure JS dependencies

If you're installing a JavaScript-only dependency that will be used across platforms, install it in `packages/core`:

```sh
cd packages/core
yarn add date-fns
cd ../..
yarn
```

### Native dependencies

If you're installing a library with any native code, you must install it in `expo`:

```sh
cd apps/expo
yarn add react-native-reanimated
cd ..
yarn
```

You can also install the native library inside of `packages/core` if you want to get autoimport for that package inside of the `app` folder. However, you need to be careful and install the _exact_ same version in both packages. If the versions mismatch at all, you'll potentially get terrible bugs. This is a classic monorepo issue. I use `lerna-update-wizard` to help with this (you don't need to use Lerna to use that lib).

You may potentially want to have the native module transpiled for the next app. If you get error messages with `Cannot use import statement outside a module`, you may need to use `transpilePackages` in your `next.config.js` and add the module to the array there.

## Deploying to Vercel

- Root: `apps/next`
- Build command: leave default setting
- Output dir: leave default setting

## Using With Expo Application Services (EAS)

EAS has already been configured for you, but you still need to do the following:

- `npm install --global eas-cli`
- `cd apps/expo`
- `eas build` - This will also add your EAS project ID to app.config.js

### Initial EAS Setup

1. edit `apps/expo/app.config.js` and update:
   1. `owner`
   1. `projectId`

## FAQ

- I get the error `network request failed` when trying to signin or signup for the app

This error is likely caused my not having Supabase setup correctly and running in docker.

- Where is the initial page that gets rendered on the Expo app?

We recommend you familiarize yourself with how Expo Router handles routing on [their docs](https://docs.expo.dev/router/introduction/). In a fresh project, the initial page would be on `apps/expo/app/(drawer)/index.tsx`.

## Cursor Rules

This project includes cursor rules to help maintain code quality and consistency. The rules are located in `.cursor/rules/` and include:

- **`route-naming-convention.mdc`** - Guidelines for dashboard route structure
- **`ui-development.mdc`** - UI component development standards
- **`nextjs.mdc`** - Next.js specific guidelines
- **`react-native.mdc`** - React Native development guidelines
- **`code-quality.mdc`** - Code quality and maintenance rules

### Using Generators

We provide several turbo generators to speed up development:

```bash
# Create a new component
yarn gen component

# Create a new screen
yarn gen screen

# Create a new tRPC router
yarn gen router

# Create a new dashboard route (recommended)
yarn gen route
```

### Generator Best Practices

1. **Use the route generator** for dashboard pages - it creates all necessary files
2. **Follow naming conventions** - generators enforce consistent patterns
3. **Review generated code** - customize as needed for your specific use case
4. **Run quality checks** after generation:
   ```bash
   yarn format:fix
   yarn lint:fix
   ```

## Troubleshooting

### Xcode cannot find 'node'

If building with xcode, or running `yarn ios/android` and you receive a wall of red errors - you may need to remove `.xcode.env.local` from the root of the project.

Alternative fix from [lerisse](https://github.com/lerisse):

> A more permanent solution I’ve found for node error would be to replace the temp path created in Xcode.env.local to your local node install path. Usually for Mac that would be defaulted to /usr/local/bin/node

Running `pod install` inside a yarn alias can create this broken file.

https://github.com/facebook/react-native/issues/43285

### App requests hanging when querying Next.js API

iOS simulator will not make requests to localhost, you will need to run the next.js server based on your local IP address.

```bash
yarn web -H $(yarn get-local-ip-mac)
```
