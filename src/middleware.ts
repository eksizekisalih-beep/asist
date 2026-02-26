import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const url = request.nextUrl.clone()

  // If session exists and user is on auth page, redirect to chat
  if (session && url.pathname === '/auth') {
    return NextResponse.redirect(new URL('/chat', request.url))
  }

  // If no session and user is on a protected route, redirect to auth
  if (!session && (
    url.pathname.startsWith('/chat') || 
    url.pathname.startsWith('/dashboard') || 
    url.pathname.startsWith('/documents') || 
    url.pathname.startsWith('/reminders') ||
    url.pathname.startsWith('/settings')
  )) {
    return NextResponse.redirect(new URL('/auth', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/chat/:path*', '/dashboard/:path*', '/documents/:path*', '/reminders/:path*', '/auth'],
}
