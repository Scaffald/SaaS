# OAuth Configuration Guide

This guide covers the setup required to fix OAuth authentication in production.

## Problem

You're seeing this error when trying to sign in with Google:

```
Access blocked: Scaffald's request is invalid
Error 400: redirect_uri_mismatch
```

This occurs because Google doesn't recognize the Supabase callback URL as an authorized redirect URI.

## Solution Overview

The OAuth flow works like this:
1. User clicks "Sign in with Google" on your app
2. User is redirected to Google OAuth
3. Google sends auth code back to **Supabase's callback endpoint**
4. Supabase processes auth and redirects to your app
5. User lands on your app's confirmation page

The issue is at step 3 - Google needs to know about the Supabase callback URL.

## Required Configuration Changes

### 1. Google Cloud Console Configuration

**URL:** https://console.cloud.google.com

1. Navigate to **APIs & Services → Credentials**
2. Find your OAuth 2.0 Client ID:
   - Client ID: `163454683152-gudal3itet70djlo5iv5a9fg51cvald3.apps.googleusercontent.com`
3. Click **Edit** on the client ID
4. Under **Authorized redirect URIs**, add:
   ```
   https://qmfmpcyxsihhfttvqpbw.supabase.co/auth/v1/callback
   ```
5. Click **Save**

**Note:** Changes may take 5-10 minutes to propagate.

### 2. Supabase Dashboard Configuration

**URL:** https://supabase.com/dashboard/project/qmfmpcyxsihhfttvqpbw

1. Navigate to **Authentication → URL Configuration**
2. Set **Site URL**:
   ```
   https://preview.scaffald.com
   ```
3. Under **Redirect URLs**, add these to the allowlist:
   ```
   https://preview.scaffald.com/**
   https://preview.scaffald.com/auth/confirm
   https://preview.scaffald.com/dashboard
   ```
4. Click **Save**

### 3. Code Changes (Already Completed)

The GoogleSignIn component has been updated to use a specific callback path:

```typescript
redirectTo: `${process.env.EXPO_PUBLIC_URL}/auth/confirm`
```

This ensures users land on the confirmation page after authentication.

## Verification Steps

After making these changes:

1. **Wait 5-10 minutes** for Google's changes to propagate
2. **Clear your browser cache** or use an incognito window
3. **Test the login flow**:
   - Go to https://preview.scaffald.com
   - Click "Sign in with Google"
   - Complete Google OAuth
   - You should be redirected to `/auth/confirm`
   - Then redirected to `/dashboard`

## Troubleshooting

### Still seeing redirect_uri_mismatch?

1. **Verify the exact callback URL** in Google Cloud Console matches:
   ```
   https://qmfmpcyxsihhfttvqpbw.supabase.co/auth/v1/callback
   ```
2. **Check for typos** - URLs are case-sensitive
3. **Wait longer** - Google can take up to 10 minutes to update

### Getting a different error?

1. **Check Supabase logs** for authentication errors
2. **Verify environment variables** in `.env.production`:
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - `EXPO_PUBLIC_URL`
3. **Check browser console** for JavaScript errors

### Users stuck on confirmation page?

1. **Verify the confirmation route** exists at `/auth/confirm`
2. **Check route configuration** in `apps/expo/app/auth/`
3. **Review redirect logic** in `useProtectedRoute` hook

## Environment Variables Reference

### Production (.env.production)
```bash
EXPO_PUBLIC_URL=https://preview.scaffald.com
EXPO_PUBLIC_SUPABASE_URL=https://qmfmpcyxsihhfttvqpbw.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=163454683152-gudal3itet70djlo5iv5a9fg51cvald3.apps.googleusercontent.com
```

### Development (.env)
```bash
EXPO_PUBLIC_URL=http://localhost:3000
EXPO_PUBLIC_SUPABASE_URL=http://localhost:54321
# ... other local variables
```

## Additional OAuth Providers

If you plan to add Apple Sign In or other providers, follow similar steps:

1. Register callback URL with the provider
2. Add callback URL to Supabase redirect allowlist
3. Update the sign-in component with specific redirect path

## Security Notes

- **Never commit** OAuth secrets to version control
- **Use environment variables** for all sensitive data
- **Restrict redirect URLs** to only your domains
- **Enable PKCE** in Supabase for additional security
- **Monitor failed login attempts** in Supabase dashboard

## Related Documentation

- [Supabase OAuth Documentation](https://supabase.com/docs/guides/auth/social-login)
- [Google OAuth Setup](https://developers.google.com/identity/protocols/oauth2)
- [Deployment Guide](./README.md)
- [Supabase Cloud Setup](./supabase-cloud-setup.md)
