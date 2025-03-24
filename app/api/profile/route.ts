import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const walletAddress = cookieStore.get("wallet-address")?.value
    const userName = cookieStore.get("user-name")?.value

    if (!walletAddress) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      )
    }

    // Mock profile data - replace with actual database query
    const profile = {
      name: userName || "John Doe",
      walletAddress,
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error("Profile fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    )
  }
}
