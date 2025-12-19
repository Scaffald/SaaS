# Forsured App Environment Variables Checklist

## Required Variables

### Client-Side (Vite) - Required
- [ ] `VITE_SUPABASE_URL` - Supabase URL (default: `http://127.0.0.1:54321` for local)
- [ ] `VITE_SUPABASE_ANON_KEY` - Supabase anon key (default local key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0`)
- [ ] `VITE_FORSURED_USE_OAUTH` - Authentication mode (`false` = magic link, `true` = OAuth)

### Server-Side (tRPC) - Required
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Same as VITE_SUPABASE_URL (for server-side tRPC)
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Same as VITE_SUPABASE_ANON_KEY (for server-side tRPC)
- [ ] `CORS_ORIGIN` - CORS allowed origin (e.g., `http://localhost:5173`)

### Environment
- [ ] `NODE_ENV` - Environment mode (`development`, `production`, `test`)

## Optional Variables

### Supabase (Optional)
- [ ] `VITE_SUPABASE_SERVICE_ROLE_KEY` - For service role operations (testing only)
  - Default local key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU`

### Scaffald OAuth (Only if VITE_FORSURED_USE_OAUTH=true)
- [ ] `VITE_SCAFFALD_CLIENT_ID` - Scaffald OAuth client ID
- [ ] `VITE_SCAFFALD_AUTH_URL` - Scaffald OAuth authorization URL (default: `https://scaffald.com/oauth/authorize`)
- [ ] `VITE_SCAFFALD_TOKEN_ENDPOINT` - Scaffald OAuth token endpoint (default: `https://scaffald.com/oauth/token`)
- [ ] `VITE_SCAFFALD_API_URL` - Scaffald API URL

### API Configuration (Optional)
- [ ] `VITE_API_URL` - API URL (defaults to `http://localhost:5173` in development)
- [ ] `NEXT_PUBLIC_API_URL` - Server-side API URL (optional)

## Example .env Configuration

```bash
# Environment
NODE_ENV=development

# Forsured Authentication Mode
# false = Magic link flow (Supabase Auth) - DEFAULT
# true = Scaffald OAuth flow
VITE_FORSURED_USE_OAUTH=false

# Supabase Configuration (Client-Side)
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0

# Supabase Configuration (Server-Side - tRPC)
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# Optional: Service Role Key (for testing only)
VITE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU

# Optional: Scaffald OAuth (only if VITE_FORSURED_USE_OAUTH=true)
# VITE_SCAFFALD_CLIENT_ID=your_client_id_here
# VITE_SCAFFALD_AUTH_URL=https://scaffald.com/oauth/authorize
# VITE_SCAFFALD_TOKEN_ENDPOINT=https://scaffald.com/oauth/token
# VITE_SCAFFALD_API_URL=https://api.scaffald.com
```

## Issues Found

1. **❌ OLD VARIABLE NAME**: Your `.env` file has `VITE_FORSURED_USE_REAL_AUTH=false` but it should be `VITE_FORSURED_USE_OAUTH=false`
2. **❌ MISSING**: `VITE_SUPABASE_URL` - Required for client-side Supabase connection
3. **❌ MISSING**: `VITE_SUPABASE_ANON_KEY` - Required for client-side Supabase connection
4. **❌ MISSING**: `NEXT_PUBLIC_SUPABASE_URL` - Required for server-side tRPC
5. **❌ MISSING**: `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Required for server-side tRPC
6. **❌ MISSING**: `CORS_ORIGIN` - Required for CORS configuration

