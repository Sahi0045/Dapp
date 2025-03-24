import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Get wallet connection status from cookies
  const walletAddress = request.cookies.get('wallet-address')?.value
  
  // Get the current path
  const path = request.nextUrl.pathname
  
  // Public paths that don't require wallet connection
  const publicPaths = ['/login']
  
  // If trying to access login page while wallet is connected, redirect to dashboard
  if (path === '/login' && walletAddress) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  
  // Allow access to public paths
  if (publicPaths.includes(path)) {
    return NextResponse.next()
  }
  
  // If no wallet connected, redirect to login
  if (!walletAddress) {
    const url = new URL('/login', request.url)
    url.searchParams.set('from', path)
    return NextResponse.redirect(url)
  }
  
  // If wallet is connected, allow access
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * 1. /api/ (API routes)
     * 2. /_next/ (Next.js internals)
     * 3. /.well-known (Well-known URIs)
     * 4. /public (public files)
     * 5. /_vercel (Vercel internals)
     * 6. Static files (e.g. /favicon.ico, /sitemap.xml, /robots.txt)
     */
    '/((?!api|_next|.well-known|public|_vercel|[\\w-]+\\.\\w+).*)',
  ],
} 