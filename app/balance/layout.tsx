"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Cookies from "js-cookie"
import { BottomNav } from "@/components/bottom-nav"

export default function BalanceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()

  useEffect(() => {
    const checkAuth = () => {
      const walletAddress = Cookies.get("wallet-address")
      const authStatus = Cookies.get("auth-status")

      if (!walletAddress || authStatus !== "authenticated") {
        router.replace("/login")
      }
    }

    checkAuth()
  }, [router])

  return (
    <div>
      {children}
      <BottomNav />
    </div>
  )
}
