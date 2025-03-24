import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  const cookieStore = await cookies()
  const authStatus = cookieStore.get("auth-status")

  return NextResponse.json({
    authenticated: authStatus?.value === "authenticated",
  })
}