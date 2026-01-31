import { signInWithGoogle } from "@/http/sign-in-with-google";
import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get("code")

  if (!code) {
    return NextResponse.json({ error: "Google OAuth code was note found." }, { status: 400 })
  }

  const { token } = await signInWithGoogle({ code })
  const cookiesStore = await cookies()
  cookiesStore.set('token', token, {
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7days
  })

  const redirectUrl = request.nextUrl.clone()
  redirectUrl.pathname = '/select-organization'
  redirectUrl.search = ''
  return NextResponse.redirect(redirectUrl)
}

