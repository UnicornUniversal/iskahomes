import { NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt'

export async function middleware(req) {
  // ALL ROUTE PROTECTION TEMPORARILY DISABLED FOR DEVELOPMENT
  // Uncomment the sections below when you want to re-enable authentication

  // Protect developer routes
  // if (req.nextUrl.pathname.startsWith('/developer/')) {
  //   const token = req.cookies.get('developer_token')?.value
  //   if (!token) {
  //     return NextResponse.redirect(new URL('/signin', req.url))
  //   }
  //   
  //   const decoded = verifyToken(token)
  //   if (!decoded) {
  //     return NextResponse.redirect(new URL('/signin', req.url))
  //   }
  // }

  // Protect agent routes
  // if (req.nextUrl.pathname.startsWith('/agents/')) {
  //   const token = req.cookies.get('agent_token')?.value
  //   if (!token) {
  //     return NextResponse.redirect(new URL('/signin', req.url))
  //   }
  // }

  // Protect homeowner routes
  // if (req.nextUrl.pathname.startsWith('/homeowner/')) {
  //   const token = req.cookies.get('homeowner_token')?.value
  //   if (!token) {
  //     return NextResponse.redirect(new URL('/signin', req.url))
  //   }
  // }

  // Protect home seeker routes
  // if (req.nextUrl.pathname.startsWith('/homeSeeker/')) {
  //   const token = req.cookies.get('homeseeker_token')?.value
  //   if (!token) {
  //     return NextResponse.redirect(new URL('/signin', req.url))
  //   }
  // }

  // Protect admin routes
  // if (req.nextUrl.pathname.startsWith('/admin/')) {
  //   const token = req.cookies.get('admin_token')?.value
  //   if (!token) {
  //     return NextResponse.redirect(new URL('/signin', req.url))
  //   }
  // }

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
