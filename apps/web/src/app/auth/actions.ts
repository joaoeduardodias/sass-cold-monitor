"use server"

import { env } from "@cold-monitor/env"
import { redirect } from "next/navigation"

export async function signInWithGoogle() {
  const googleSignInUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth")

  googleSignInUrl.searchParams.set("client_id", env.GOOGLE_OAUTH_CLIENT_ID)
  googleSignInUrl.searchParams.set("redirect_uri", env.GOOGLE_OAUTH_CLIENT_REDIRECT_URI)
  googleSignInUrl.searchParams.set("response_type", "code")
  googleSignInUrl.searchParams.set("scope", "https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile")
  googleSignInUrl.searchParams.set("access_type", "offline")
  googleSignInUrl.searchParams.set("prompt", "consent")

  redirect(googleSignInUrl.toString())
}