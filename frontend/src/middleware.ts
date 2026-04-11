import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes that require a valid access token
const PROTECTED = ['/content', '/settings', '/admin']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isProtected = PROTECTED.some(p => pathname.startsWith(p))
  if (!isProtected) return NextResponse.next()

  // Check for token in cookie (we'll also set it there on login)
  const token = request.cookies.get('scsi_access_token')?.value

  if (!token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/content/:path*', '/settings/:path*', '/admin/:path*'],
}
