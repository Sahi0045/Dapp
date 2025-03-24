"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Cookies from "js-cookie"
import { Button } from "@/components/ui/button"
import { User } from "lucide-react"
import { BottomNav } from "@/components/bottom-nav"
import { dashboardNavItems } from "@/config/navigation"

export default function DashboardLayout({
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