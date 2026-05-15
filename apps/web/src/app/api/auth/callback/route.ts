import { cookies } from 'next/headers'
import { type NextRequest, NextResponse } from 'next/server'

import { signInWithGoogle } from '@/http/users/sign-in-with-google'

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')

  if (!code) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/sign-in'
    url.search = '?error=google_missing_code'
    return NextResponse.redirect(url)
  }

  try {
    const { token } = await signInWithGoogle({ code })
    const cookiesStore = await cookies()
    cookiesStore.set('token', token, {
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })

    const url = request.nextUrl.clone()
    url.pathname = '/select-organization'
    url.search = ''
    return NextResponse.redirect(url)
  } catch {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/sign-in'
    url.search = '?error=google_auth_failed'
    return NextResponse.redirect(url)
  }
}
