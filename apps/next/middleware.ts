import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { ROUTES, getAuthRoutes, isAuthPath, isProtectedPath } from '@app/core/constants/routes'

// by default, all routes are protected

// put the public routes here - these will be accessed by both guests and users
const publicRoutes: string[] = ['/styleguide'] // Only styleguide is public now
// put the authentication routes here - these will only be accessed by guests
const authRoutes = getAuthRoutes().map((route) => route.fullPath)

export async function middleware(req: NextRequest) {
  // we need to create a response and hand it to the supabase client to be able to modify the response headers.
  const res = NextResponse.next()
  // public routes - no need for Supabase
  if (publicRoutes.some((route) => req.nextUrl.pathname.startsWith(route))) {
    return res
  }
  // create authenticated Supabase Client.
  const supabase = createMiddlewareClient({ req, res })
  // check if we have a session
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const isAuthRoute = authRoutes.some((route) => req.nextUrl.pathname.startsWith(route))
  // redirect if a logged in user is accessing an auth route (e.g. /auth/*)
  if (user && isAuthRoute) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = ROUTES.dashboard.fullPath
    return NextResponse.redirect(redirectUrl)
  }
  // show auth routes for guests
  if (!user && isAuthRoute) {
    return res
  }
  // restrict the user if trying to access protected routes
  if (!user) {
    console.log(`User not logged in. Attempted to access: ${req.nextUrl.pathname}`)
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = ROUTES.auth.fullPath
    // redirectUrl.searchParams.set(`redirected_from`, req.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }
  // show the protected page to logged in route
  return res
}

export const config = {
  // we're only interested in /pages, not assets or api routes
  // so we exclude those here
  matcher: '/((?!api|static|.*\\..*|_next).*)',
}
