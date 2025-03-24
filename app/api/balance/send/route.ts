import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const walletAddress = cookieStore.get("wallet-address")?.value

    if (!walletAddress) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { recipientAddress, amount, note } = body

    if (!recipientAddress || !amount) {
      return NextResponse.json(
        { error: "Recipient address and amount are required" },
        { status: 400 }
      )
    }

    // Mock transaction - replace with actual blockchain transaction
    const transaction = {
      id: Math.random().toString(36).substring(7),
      type: "sent",
      amount: parseFloat(amount),
      recipientOrSender: recipientAddress,
      date: new Date().toISOString(),
      status: "completed",
      note: note || ""
    }

    return NextResponse.json(transaction)
  } catch (error) {
    console.error("Send transaction error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
