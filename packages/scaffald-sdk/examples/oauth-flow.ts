/**
 * OAuth 2.0 Authorization Code Flow with PKCE Example
 *
 * This example demonstrates a complete OAuth flow for a web application
 */

import { OAuthClient, Scaffald } from '@scaffald/sdk'

// ===== Configuration =====
const oauth = new OAuthClient({
  clientId: 'your_client_id',
  clientSecret: 'your_client_secret', // Optional for public clients
  redirectUri: 'https://yourapp.com/callback',
})

// ===== Step 1: Redirect user to authorization page =====
async function startOAuthFlow() {
  const { url, state, codeVerifier } = await oauth.getAuthorizationUrl({
    scope: ['read:jobs', 'write:applications', 'read:profile'],
  })

  // Store state and codeVerifier securely
  // In a real app, use secure session storage or encrypted cookies
  sessionStorage.setItem('oauth_state', state)
  sessionStorage.setItem('oauth_code_verifier', codeVerifier)

  // Redirect user to authorization URL
  window.location.href = url
}

// ===== Step 2: Handle callback from authorization server =====
async function handleCallback() {
  const urlParams = new URLSearchParams(window.location.search)
  const code = urlParams.get('code')
  const state = urlParams.get('state')
  const error = urlParams.get('error')

  // Check for errors
  if (error) {
    console.error('OAuth error:', error)
    console.error('Error description:', urlParams.get('error_description'))
    return
  }

  // Verify state to prevent CSRF attacks
  const storedState = sessionStorage.getItem('oauth_state')
  if (state !== storedState) {
    throw new Error('State mismatch - possible CSRF attack')
  }

  // Exchange authorization code for tokens
  const codeVerifier = sessionStorage.getItem('oauth_code_verifier')
  if (!code || !codeVerifier) {
    throw new Error('Missing code or code verifier')
  }

  try {
    const tokens = await oauth.exchangeCodeForToken({
      code,
      codeVerifier,
    })

    // Store tokens securely
    // In production, use HttpOnly cookies or secure token storage
    localStorage.setItem('access_token', tokens.access_token)
    if (tokens.refresh_token) {
      localStorage.setItem('refresh_token', tokens.refresh_token)
    }

    // Clean up temporary storage
    sessionStorage.removeItem('oauth_state')
    sessionStorage.removeItem('oauth_code_verifier')

    console.log('Authentication successful!')
    console.log('Access token expires in:', tokens.expires_in, 'seconds')

    // Redirect to app using your app's routing
    // (e.g., router.push('/dashboard') or navigate('/dashboard'))
  } catch (error) {
    console.error('Token exchange failed:', error)
  }
}

// ===== Step 3: Use access token to make API calls =====
async function makeAuthenticatedRequest() {
  const accessToken = localStorage.getItem('access_token')

  if (!accessToken) {
    console.error('No access token found')
    return
  }

  const client = new Scaffald({
    accessToken,
  })

  try {
    // Make API calls
    const jobs = await client.jobs.list({ status: 'published', limit: 10 })
    console.log('Jobs:', jobs)

    const profile = await client.profiles.getUser('johndoe')
    console.log('Profile:', profile)
  } catch (error) {
    console.error('API request failed:', error)

    // If token expired, try to refresh
    if (error.statusCode === 401) {
      await refreshAccessToken()
    }
  }
}

// ===== Step 4: Refresh expired tokens =====
async function refreshAccessToken() {
  const refreshToken = localStorage.getItem('refresh_token')

  if (!refreshToken) {
    console.error('No refresh token found - user needs to re-authenticate')
    // Redirect to login
    startOAuthFlow()
    return
  }

  try {
    const tokens = await oauth.refreshToken(refreshToken)

    // Update stored tokens
    localStorage.setItem('access_token', tokens.access_token)
    if (tokens.refresh_token) {
      localStorage.setItem('refresh_token', tokens.refresh_token)
    }

    console.log('Token refreshed successfully')
  } catch (error) {
    console.error('Token refresh failed:', error)
    // Clear tokens and redirect to login
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    startOAuthFlow()
  }
}

// ===== Step 5: Logout (revoke tokens) =====
async function logout() {
  const accessToken = localStorage.getItem('access_token')

  if (accessToken) {
    try {
      await oauth.revokeToken(accessToken, 'access_token')
      console.log('Token revoked successfully')
    } catch (error) {
      console.error('Token revocation failed:', error)
    }
  }

  // Clear stored tokens
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')

  // Redirect to home page using your app's routing
  // (e.g., router.push('/') or navigate('/'))
}

// ===== Example: React Hook for OAuth =====
/*
import { useState, useEffect } from 'react'
import { OAuthClient } from '@scaffald/sdk'

export function useScaffaldAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [accessToken, setAccessToken] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) {
      setAccessToken(token)
      setIsAuthenticated(true)
    }
  }, [])

  const login = async () => {
    const oauth = new OAuthClient({
      clientId: 'your_client_id',
      redirectUri: 'https://yourapp.com/callback',
    })

    const { url, state, codeVerifier } = await oauth.getAuthorizationUrl({
      scope: ['read:jobs', 'write:applications'],
    })

    sessionStorage.setItem('oauth_state', state)
    sessionStorage.setItem('oauth_code_verifier', codeVerifier)

    window.location.href = url
  }

  const logout = async () => {
    if (accessToken) {
      const oauth = new OAuthClient({
        clientId: 'your_client_id',
        redirectUri: 'https://yourapp.com/callback',
      })
      await oauth.revokeToken(accessToken)
    }

    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setAccessToken(null)
    setIsAuthenticated(false)
  }

  return {
    isAuthenticated,
    accessToken,
    login,
    logout,
  }
}
*/

export { startOAuthFlow, handleCallback, makeAuthenticatedRequest, refreshAccessToken, logout }
