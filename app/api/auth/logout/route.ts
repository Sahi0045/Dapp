import { NextResponse } from "next/server"

export async function POST() {
  try {
    // Create a response
    const response = NextResponse.json({ success: true })

    // Delete all auth cookies
    response.cookies.delete("auth-status")
    response.cookies.delete("wallet-address")
    response.cookies.delete("user-name")

    return response
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json(
      { error: "Failed to logout" },
      { status: 500 }
    )
  }
}
