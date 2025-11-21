# SCF-Neue Project Overview

## Project Type
**pnpm Workspace Monorepo** - Cross-platform React Native application with Expo Web support and shared packages

## Tech Stack

### Core Technologies
- **React Native** (Expo SDK 54) - Mobile and web application
- **Expo Web** - Web platform (via Expo)
- **TypeScript** - Type safety across all packages
- **pnpm 10.20.0** - Package manager with workspaces
- **Turbo** - Monorepo build system and task runner

### UI & Styling
- **Tamagui** - Cross-platform UI components and styling
- **Bento** - Complex UI patterns and components
- **React Navigation** - Navigation for mobile

### Backend & Data
- **Supabase** - Backend as a service (database, auth, functions)
- **tRPC** - Type-safe API layer
- **Zod** - Schema validation

### Development Tools
- **Biome** - Code formatting and linting
- **TypeScript** - Type checking
- **Turbo** - Build orchestration
- **GitHub Actions** - CI/CD

## Monorepo Structure

```
SCF-Neue/
├── apps/
│   └── expo/           # React Native app (iOS, Android, Web via Expo)
├── packages/
│   ├── core/           # Shared business logic and features
│   ├── ui/             # Cross-platform UI components
│   ├── fonts/          # Font and icon management
│   └── supabase/       # Database, functions, and API layer
├── .cursor/rules/      # Cursor AI development rules
├── .github/workflows/  # CI/CD workflows
└── scripts/           # Build and deployment scripts
```

## Key Packages

### `apps/expo` (Primary App)
- React Native application using Expo
- Cross-platform (iOS, Android, Web)
- Uses Expo Router for navigation
- Consumes shared packages for UI and business logic

### `packages/core`
- Shared business logic and features
- Route-based feature organization
- React Query for data fetching
- Authentication and user management

### `packages/ui`
- Cross-platform UI component library
- Built with Tamagui for styling
- Reusable components for both web and mobile
- Design system and themes

### `packages/supabase`
- Database schema and migrations
- Supabase Edge Functions (tRPC endpoints)
- Type-safe database types
- Authentication and RLS policies

## Development Workflow

### Commands
- `pnpm dev` - Start Expo development server
- `pnpm web` - Start web development
- `pnpm check` - Format, lint, and type check
- `pnpm build` - Build all packages
- `pnpm supa` - Supabase operations

### Quality Checks
- **Formatting**: Biome auto-formatting
- **Linting**: Biome linting rules
- **Type Safety**: TypeScript across all packages
- **Build Verification**: All packages must build successfully
- **Dependency Management**: Consistent versions across workspaces

## Architecture Decisions

### Cross-Platform Strategy
- Shared business logic in `packages/core`
- Platform-specific implementations when needed
- Tamagui for consistent UI across platforms

### Data Layer
- Supabase for backend services
- tRPC for type-safe API calls
- React Query for client-side data management
- Zod schemas for validation

### Code Organization
- Feature-based organization in `packages/core/features/`
- Route naming convention: `<parent>-<child>-{left|right|screen}.tsx`
- Shared UI components in `packages/ui/`

## Current Status
- **Primary Platform**: React Native (Expo) with Expo Web
- **Database**: Supabase with comprehensive RLS policies
- **CI/CD**: GitHub Actions with quality checks
- **Development**: Active development with established patterns
