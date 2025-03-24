"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import {
  User,
  Shield,
  Wallet,
  ChevronRight,
  Bell,
  Settings,
  HelpCircle,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  Camera,
  Edit2,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import Cookies from "js-cookie"

// Mock transaction data - replace with real data later
interface Transaction {
  id: string
  type: "send" | "receive"
  amount: number
  address: string
  timestamp: string
}

export default function ProfilePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [userName, setUserName] = useState("John Doe")
  const [email, setEmail] = useState("john.doe@example.com")
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [kycStatus, setKycStatus] = useState<"pending" | "verified" | "not_started">("not_started")
  const [isLoading, setIsLoading] = useState(true)
  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: "1",
      type: "send",
      amount: 100,
      address: "0x1234...5678",
      timestamp: "2024-03-20T10:30:00Z"
    },
    {
      id: "2",
      type: "receive",
      amount: 50,
      address: "0x8765...4321",
      timestamp: "2024-03-19T15:45:00Z"
    },
    {
      id: "3",
      type: "send",
      amount: 75,
      address: "0x9876...1234",
      timestamp: "2024-03-18T09:20:00Z"
    }
  ])

  useEffect(() => {
    const checkWalletAndAuth = async () => {
      const walletAddr = Cookies.get("wallet-address")
      if (!walletAddr) {
        router.push("/login")
        return
      }

      try {
        if (window.aptos) {
          const isConnected = await window.aptos.isConnected()
          if (isConnected) {
            const account = await window.aptos.account()
            setWalletAddress(account.address)
          } else {
            router.push("/login")
            return
          }
        }
      } catch (error) {
        console.error("Error checking wallet connection:", error)
        router.push("/login")
        return
      }
      
      setIsLoading(false)
    }

    checkWalletAndAuth()
  }, [router])

  const handleCopyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress)
      toast({
        title: "Address Copied",
        description: "Wallet address copied to clipboard",
      })
    }
  }

  const handleLogout = async () => {
    try {
      if (window.aptos) {
        await window.aptos.disconnect()
      }
      Cookies.remove("wallet-address")
      router.push("/login")
      toast({
        title: "Logged Out",
        description: "Successfully disconnected wallet",
      })
    } catch (error) {
      console.error("Error during logout:", error)
      toast({
        title: "Logout Failed",
        description: "Failed to disconnect wallet",
        variant: "destructive",
      })
    }
  }

  // Format timestamp to relative time
  const getRelativeTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    if (minutes > 0) return `${minutes}m ago`
    return 'Just now'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <main className="container max-w-md mx-auto p-4 pb-20">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="bg-black/40 backdrop-blur-xl border border-white/5">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 p-[2px]">
                    <div className="w-full h-full rounded-full bg-black flex items-center justify-center text-white text-xl font-bold">
                      {userName.substring(0, 2).toUpperCase()}
                    </div>
                  </div>
                  <button className="absolute bottom-0 right-0 bg-white/10 p-1.5 rounded-full hover:bg-white/20 transition-colors">
                    <Camera className="h-3 w-3 text-white" />
                  </button>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-white">{userName}</h2>
                    <button className="text-white/60 hover:text-white">
                      <Edit2 className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-sm text-white/60">{email}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white/60 hover:text-white"
                  onClick={() => router.push('/settings')}
                >
                  <Settings className="h-5 w-5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4 mb-8"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Recent Activity</h2>
            <Button
              variant="ghost"
              className="text-sm text-white/60 hover:text-white"
              onClick={() => router.push('/history')}
            >
              View All
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          <Card className="bg-black/40 backdrop-blur-xl border border-white/5">
            <CardContent className="p-4">
              <div className="space-y-4">
                {transactions.length > 0 ? (
                  transactions.map((tx, index) => (
                    <motion.div
                      key={tx.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                      onClick={() => router.push(`/transaction/${tx.id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          tx.type === "send" 
                            ? "bg-red-500/10" 
                            : "bg-green-500/10"
                        }`}>
                          {tx.type === "send" ? (
                            <ArrowUpRight className="h-5 w-5 text-red-500" />
                          ) : (
                            <ArrowDownLeft className="h-5 w-5 text-green-500" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">
                            {tx.type === "send" ? "Sent" : "Received"} APT
                          </p>
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-white/60">
                              {tx.address}
                            </p>
                            <div className="flex items-center gap-1 text-xs text-white/40">
                              <Clock className="h-3 w-3" />
                              {getRelativeTime(tx.timestamp)}
                            </div>
                          </div>
                        </div>
                      </div>
                      <p className={`text-sm font-medium ${
                        tx.type === "send" 
                          ? "text-red-500" 
                          : "text-green-500"
                      }`}>
                        {tx.type === "send" ? "-" : "+"}
                        {tx.amount} APT
                      </p>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-white/60">No recent transactions</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-2"
        >
          <Button
            variant="ghost"
            className="w-full justify-between text-white hover:bg-white/5 p-4 h-auto"
            onClick={() => router.push('/notifications')}
          >
            <div className="flex items-center gap-3">
              <div className="bg-white/10 p-2 rounded-lg">
                <Bell className="h-5 w-5" />
              </div>
              <span>Notifications</span>
            </div>
            <ChevronRight className="h-5 w-5 text-white/40" />
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-between text-white hover:bg-white/5 p-4 h-auto"
            onClick={() => router.push('/help')}
          >
            <div className="flex items-center gap-3">
              <div className="bg-white/10 p-2 rounded-lg">
                <HelpCircle className="h-5 w-5" />
              </div>
              <span>Help & Support</span>
            </div>
            <ChevronRight className="h-5 w-5 text-white/40" />
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-between text-red-500 hover:bg-white/5 p-4 h-auto"
            onClick={handleLogout}
          >
            <div className="flex items-center gap-3">
              <div className="bg-red-500/10 p-2 rounded-lg">
                <LogOut className="h-5 w-5" />
              </div>
              <span>Logout</span>
            </div>
            <ChevronRight className="h-5 w-5 opacity-40" />
          </Button>
        </motion.div>
      </main>
    </div>
  )
} 