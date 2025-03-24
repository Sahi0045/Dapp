import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const walletAddress = cookies().get("wallet-address")?.value

    if (!walletAddress) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      )
    }

    // Mock transaction history - replace with actual blockchain query
    const transactions = [
      {
        id: "1",
        type: "sent",
        amount: 500,
        recipientOrSender: "0x123...456",
        date: "2025-03-24T08:00:00Z",
        status: "completed"
      },
      {
        id: "2",
        type: "received",
        amount: 1000,
        recipientOrSender: "0x789...012",
        date: "2025-03-23T15:30:00Z",
        status: "completed"
      }
    ]

    return NextResponse.json(transactions)
  } catch (error) {
    console.error("Transaction history fetch error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
