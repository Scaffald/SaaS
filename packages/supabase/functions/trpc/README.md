# tRPC Function Structure

This directory contains the modular tRPC API implementation for the SCF-Neue application.

## Directory Structure

```
trpc/
├── index.ts                          # Main entry point & Deno server setup
├── context.ts                        # Context creation & environment variables
├── middleware.ts                     # Authentication & authorization middlewares
└── routers/
    ├── _app.ts                      # Main app router (merges all routers)
    ├── auth.router.ts               # Auth operations (~20 lines)
    ├── office.router.ts             # Super admin operations (~50 lines)
    ├── jobs.router.ts               # Jobs operations (~80 lines)
    └── profile/
        ├── index.ts                # Profile router merger (~15 lines)
        ├── general.router.ts       # General profile info (~150 lines)
        ├── employment.router.ts    # Employment data (~130 lines)
        ├── skills.router.ts        # Skills management (~420 lines)
        ├── avatar.router.ts        # Avatar upload (~85 lines)
        └── completion.router.ts    # Profile completion (~170 lines)
```

## File Responsibilities

### Core Files

- **index.ts**: Deno server setup with CORS handling and request routing
- **context.ts**: Creates tRPC context with Supabase client and user authentication
- **middleware.ts**: Defines tRPC instance, authentication middleware, and procedure types

### Router Files

- **routers/_app.ts**: Main application router that merges all feature routers
- **routers/auth.router.ts**: User authentication and role management
- **routers/office.router.ts**: Super admin-only operations (user management)
- **routers/jobs.router.ts**: External jobs listing and management

### Profile Sub-Routers

All profile-related operations are organized under `routers/profile/`:

- **general.router.ts**: Basic profile info (name, email, phone, about, address)
- **employment.router.ts**: Employment preferences and work details
- **skills.router.ts**: Skills search, management, and user skill operations
- **avatar.router.ts**: Avatar upload and storage
- **completion.router.ts**: Profile completion status checking

## Key Features

### Modular Organization
- Each router focuses on a single domain
- Easy to locate and modify specific endpoints
- Better separation of concerns

### Type Safety
- Full TypeScript type inference
- Exported `AppRouter` type for client-side usage
- Shared schemas from `_shared/schemas/consolidated.ts`

### Security
- Row Level Security (RLS) respected throughout
- Proper authentication middleware
- Role-based access control (super admin)
- User-scoped Supabase clients where needed

### Maintainability
- Files are 15-420 lines (manageable size)
- Clear documentation in each file
- Consistent patterns across routers

## API Structure

All endpoints are namespaced by their router:

```typescript
// Profile endpoints
trpc.profile.getGeneral.query()
trpc.profile.updateGeneral.mutate()
trpc.profile.getEmployment.query()
trpc.profile.updateEmployment.mutate()
trpc.profile.getUserSkills.query()
trpc.profile.addUserSkill.mutate()
trpc.profile.uploadAvatar.mutate()
trpc.profile.getCompletionStatus.query()

// Auth endpoints
trpc.auth.getUserRoles.query()

// Office endpoints (super admin only)
trpc.office.listUsers.query()

// Jobs endpoints
trpc.jobs.getExternalJobs.query()
```

## Adding New Endpoints

### 1. Add to Existing Router

Edit the appropriate router file in `routers/`:

```typescript
// routers/profile/general.router.ts
export const profileGeneralRouter = t.router({
  // ... existing endpoints
  
  newEndpoint: protectedProcedure
    .input(newInputSchema)
    .mutation(async ({ ctx, input }) => {
      // Implementation
    }),
});
```

### 2. Create New Router

Create a new router file:

```typescript
// routers/new-feature.router.ts
import { protectedProcedure, t } from "../middleware.ts";

export const newFeatureRouter = t.router({
  endpoint: protectedProcedure.query(async ({ ctx }) => {
    // Implementation
  }),
});
```

Then add it to `_app.ts`:

```typescript
// routers/_app.ts
import { newFeatureRouter } from "./new-feature.router.ts";

export const appRouter = t.router({
  profile: profileRouter,
  auth: authRouter,
  office: officeRouter,
  jobs: jobsRouter,
  newFeature: newFeatureRouter, // Add here
});
```

## Development

### Running Locally

```bash
# Start Supabase local instance
pnpm supa start

# Functions are served at http://localhost:54321/functions/v1/trpc
```

### Testing

Test endpoints using:
- REST Client VS Code extension
- Thunder Client
- Postman
- curl commands

Example curl:
```bash
curl -X POST http://localhost:54321/functions/v1/trpc/profile.getGeneral \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

## Migration from Monolithic File

The original `index.ts` file (~1000 lines) has been refactored into this modular structure:

- ✅ All endpoints preserved
- ✅ Same API surface (no breaking changes)
- ✅ Improved organization
- ✅ Better maintainability
- ✅ Easier to test individual features

## Best Practices

1. **Keep routers focused**: Each router should handle one domain
2. **Use proper types**: Import schemas from `_shared/schemas/`
3. **Handle errors gracefully**: Use TRPCError for proper error responses
4. **Respect RLS**: Use context-provided Supabase client
5. **Document endpoints**: Add JSDoc comments for each procedure
6. **Test thoroughly**: Verify endpoints work after changes
