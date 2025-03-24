import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const walletAddress = cookieStore.get("wallet-address")?.value

    if (!walletAddress) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      )
    }

    // Generate UPI ID or QR code data
    const paymentInfo = {
      upiId: `${walletAddress.toLowerCase()}@aptos`,
      qrData: `upi://pay?pa=${walletAddress.toLowerCase()}@aptos&pn=AptosWallet&tn=Payment`,
      walletAddress
    }

    return NextResponse.json(paymentInfo)
  } catch (error) {
    console.error("Payment info fetch error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
