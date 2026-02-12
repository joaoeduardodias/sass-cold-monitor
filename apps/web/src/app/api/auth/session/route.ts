import { getProfile } from "@/http/users/get-profile"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  const cookiesStore = await cookies()
  const token = cookiesStore.get("token")?.value

  if (!token) {
    return NextResponse.json({ isAuthenticated: false, isAdmin: false })
  }
  const { user } = await getProfile()
  return NextResponse.json({
    isAuthenticated: true,
    user: user
  })
}
