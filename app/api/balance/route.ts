import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const cookieStore = await cookies()
    const walletAddress = cookieStore.get("wallet-address")?.value

    if (!walletAddress) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      )
    }

    // Mock balance for demo
    const balance = Math.floor(Math.random() * 10000)

    return NextResponse.json({ available: balance })
  } catch (error) {
    console.error("Balance fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch balance" },
      { status: 500 }
    )
  }
}
