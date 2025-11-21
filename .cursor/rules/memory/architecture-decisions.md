# Architecture Decisions

## Core Architectural Choices

### 1. Monorepo with pnpm Workspaces
**Decision**: Use pnpm workspace monorepo instead of separate repositories

**Rationale**:
- Shared code between web and mobile applications
- Consistent dependency management across packages
- Simplified development workflow
- Better code reuse and type safety

**Trade-offs**:
- ✅ Easier code sharing and refactoring
- ✅ Consistent tooling and dependencies
- ❌ Larger repository size
- ❌ More complex build orchestration

### 2. React Native (Expo) as Primary Platform
**Decision**: Focus on React Native with Expo as the primary platform

**Rationale**:
- Cross-platform development (iOS, Android, Web)
- Faster development cycle with Expo tools
- Better mobile experience than web-first approach
- Unified codebase for all platforms

**Trade-offs**:
- ✅ Single codebase for multiple platforms
- ✅ Native mobile performance
- ❌ Some web-specific features may be limited
- ❌ Dependency on Expo ecosystem

### 3. Supabase for Backend Services
**Decision**: Use Supabase instead of custom backend or other BaaS

**Rationale**:
- PostgreSQL database with real-time capabilities
- Built-in authentication and authorization
- Edge Functions for serverless compute
- Row Level Security (RLS) for data protection
- Type-safe database operations

**Trade-offs**:
- ✅ Rapid development and deployment
- ✅ Built-in security and auth
- ✅ Real-time capabilities
- ❌ Vendor lock-in
- ❌ Limited customization compared to custom backend

### 4. tRPC for API Layer
**Decision**: Use tRPC for type-safe API communication

**Rationale**:
- End-to-end type safety from database to client
- Excellent TypeScript integration
- Automatic API documentation
- Reduced boilerplate compared to REST

**Trade-offs**:
- ✅ Full type safety across the stack
- ✅ Excellent developer experience
- ❌ TypeScript-only (not language agnostic)
- ❌ Learning curve for team members

### 5. Tamagui for UI Components
**Decision**: Use Tamagui instead of other UI libraries

**Rationale**:
- Cross-platform components (web, iOS, Android)
- Excellent performance with compile-time optimizations
- Consistent design system
- Built-in theming and responsive design

**Trade-offs**:
- ✅ Cross-platform consistency
- ✅ Performance optimizations
- ✅ Comprehensive component library
- ❌ Smaller ecosystem compared to alternatives
- ❌ Learning curve for custom styling

### 6. Feature-Based Code Organization
**Decision**: Organize code by features rather than technical layers

**Rationale**:
- Better code locality and maintainability
- Easier to understand business logic
- Supports team scaling and ownership
- Reduces coupling between features

**Structure**:
```
packages/core/features/
├── auth/           # Authentication feature
├── dashboard/      # Dashboard feature
├── profile/        # Profile management
└── workers/        # Worker management
```

### 7. Route Naming Convention
**Decision**: Standardized naming pattern for dashboard routes

**Pattern**: `<parent>-<child>-{left|right|screen}.tsx`

**Rationale**:
- Consistent file structure across features
- Clear separation of concerns (left/right columns)
- Predictable file locations
- Easier code navigation and maintenance

### 8. Avoid Barrel Files
**Decision**: Use direct imports instead of barrel files (index.ts re-exports)

**Rationale**:
- Better build performance and tree-shaking
- Faster hot reload in development
- Reduced bundle size
- Clearer dependency relationships

**Implementation**:
```typescript
// ❌ Avoid
import { ComponentA, ComponentB } from './components'

// ✅ Prefer
import { ComponentA } from './components/ComponentA'
import { ComponentB } from './components/ComponentB'
```

### 9. CI/CD with GitHub Actions
**Decision**: Use GitHub Actions for continuous integration

**Rationale**:
- Integrated with GitHub repository
- Comprehensive workflow capabilities
- Good performance and reliability
- Cost-effective for open source projects

**Workflow**:
- Code quality checks (format, lint, type check)
- Build verification
- Monorepo integrity checks
- Dependency validation

### 10. Biome for Code Quality
**Decision**: Use Biome instead of ESLint + Prettier

**Rationale**:
- Single tool for formatting and linting
- Better performance than separate tools
- Consistent configuration
- Good TypeScript support

**Trade-offs**:
- ✅ Faster execution
- ✅ Unified configuration
- ❌ Smaller ecosystem of plugins
- ❌ Less mature than ESLint/Prettier

**Rationale**:
- Single codebase for all platforms
- Consistent development experience
- Better code sharing between mobile and web
- Simplified deployment and maintenance

## Data Architecture

### Database Design
- **PostgreSQL** with Supabase for relational data
- **Row Level Security (RLS)** for data protection
- **Real-time subscriptions** for live updates
- **Migrations** for schema versioning

### API Design
- **tRPC procedures** for type-safe operations
- **Zod schemas** for validation
- **Edge Functions** for serverless compute
- **Client-safe types** to avoid bundling server code

## Security Decisions

### Authentication Strategy
- **Supabase Auth** for user management
- **JWT tokens** for session management
- **Row Level Security** for data access control
- **Role-based permissions** for authorization

### Data Protection
- **RLS policies** on all tables
- **Service role** for admin operations
- **Authenticated user** context in policies
- **Input validation** with Zod schemas

## Recent Architecture Updates

### AWS Notifications Bootstrap (Nov 18, 2025)
- **Decision**: Stand up AWS-native notification backend for alerts (email + SMS) to decouple from third-party SaaS tools and keep infra under direct control.
- **Scope**:
  - SES domain `alerts.scaffald.com` verified with configuration set `scf-alerts` and SNS topic for bounce/complaint events.
  - SNS + Pinpoint SMS foundation with transactional defaults and future analytics via Pinpoint project `alerts-barebones`.
  - Lambda dispatchers (`alerts-email-dispatcher`, `alerts-sms-dispatcher`) deployed with IAM role `alerts-lambda-notifications`; temporary open function URLs enable quick integration from Supabase/Edge Functions.
  - Route53 hosted zone `scaffald.com` created to eventually host DNS; SES TXT/DKIM records preprovisioned for a seamless move.
- **Rationale**: Gain a low-cost, first-party path for transactional notifications while preserving the ability to layer marketing tooling later.
- **Future Enhancements**: add retries/DLQs, secure the Lambda endpoints (IAM/API Gateway), port existing DNS records before switching name servers, integrate with Supabase queues.

## Performance Decisions

### Build Optimization
- **Turbo** for monorepo build orchestration
- **Direct imports** instead of barrel files
- **Tree-shaking** for smaller bundles
- **Caching** for faster builds

### Runtime Performance
- **Tamagui optimizations** for UI rendering
- **React Query** for efficient data fetching
- **Lazy loading** for code splitting
- **Image optimization** for faster loading
