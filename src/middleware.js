import { NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt'

export async function middleware(req) {
  // Note: Since tokens are stored in localStorage (client-side), 
  // we can't access them directly in middleware.
  // The AuthContext will handle redirects on the client side.
  // This middleware is kept for potential future cookie-based auth.
  
  // For now, we'll let the client-side AuthContext handle authentication checks
  // The AuthContext will redirect to /home/signin if no valid token is found
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/developer/:path*',
    '/agent/:path*',
    '/homeowner/:path*',
    '/homeSeeker/:path*',
    '/admin/:path*'
  ]
}
