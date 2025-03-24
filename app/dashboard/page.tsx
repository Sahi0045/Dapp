"use client"

import { useState, useEffect, useCallback } from "react"
import { useTheme } from "next-themes"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { AptosClient } from "aptos"
import Cookies from "js-cookie"
import { dashboardNavItems } from "@/config/navigation"
import { Plus, ArrowUpRight, Download, User, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { NavigationItem } from "@/types/bank"

interface BankAccount {
  id: string
  bankName: string
  accountType: string
  balance: number
  lastUpdated: string
  isPrimary?: boolean
}

export default function DashboardPage() {
  const { theme } = useTheme()
  const router = useRouter()
  const { toast } = useToast()
  const [balance, setBalance] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [primaryAccount, setPrimaryAccount] = useState<BankAccount | null>(null)

  const fetchBalance = useCallback(async () => {
    try {
      const response = await fetch("/api/balance")
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch balance")
      }

      setBalance(data.available)
    } catch (error) {
      console.error("Error fetching balance:", error)
      toast({
        title: "Error",
        description: "Failed to fetch balance. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchBalance()
    
    // Load primary account from localStorage
    try {
      const savedAccounts = localStorage.getItem('bankAccounts')
      if (savedAccounts) {
        const accounts = JSON.parse(savedAccounts) as BankAccount[]
        const primary = accounts.find(account => account.isPrimary)
        if (primary) {
          setPrimaryAccount(primary)
          setBalance(primary.balance)
          setIsLoading(false)
        }
      }
    } catch (error) {
      console.error("Error loading primary account:", error)
    }
  }, [fetchBalance])

  const handleQuickAction = (action: string) => {
    switch (action) {
      case "send":
        router.push("/balance/send")
        break
      case "receive":
        router.push("/balance/receive")
        break
      case "profile":
        router.push("/profileboard")
        break
      default:
        break
    }
  }

  const linkBankAccount = () => {
    router.push("/balance/link-bank")
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#0e0e10] text-white">
      <header className="p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">My Bank</h1>
        <Button variant="ghost" className="rounded-full p-2 h-10 w-10 flex items-center justify-center" onClick={() => router.push("/profileboard")}> 
          <User className="h-5 w-5" />
        </Button>
      </header>
      
      <main className="flex-1 container mx-auto px-4 space-y-6 max-w-md pb-20">
        {/* Balance Card */}
        <Card className="bg-[#1a1a2e] border-none rounded-xl overflow-hidden shadow-lg">
          <CardContent className="p-6 text-center">
            <p className="text-gray-400 mb-2">Available Balance</p>
            <h2 className="text-4xl font-bold mb-1">
              ₹ {isLoading ? "Loading..." : (balance ?? 0).toLocaleString("en-US")}
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Primary Account: {primaryAccount ? primaryAccount.bankName : "State Bank"}
            </p>
            
            <div className="flex justify-center gap-2 mt-4">
              <Button 
                variant="outline" 
                className="bg-[#252542] border-[#3a3a5a] text-gray-300 hover:bg-[#2a2a4a]"
                onClick={linkBankAccount}
              >
                <Plus className="h-4 w-4 mr-2" />
                Link Bank Account
              </Button>
              <Button 
                variant="outline" 
                className="bg-[#252542] border-[#3a3a5a] text-gray-300 hover:bg-[#2a2a4a]"
                onClick={() => router.push("/balance")}
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                View All Accounts
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-gradient-to-br from-purple-700 to-purple-500 border-none rounded-xl overflow-hidden cursor-pointer shadow-lg"
                onClick={() => handleQuickAction("send")}
          >
            <CardContent className="p-4">
              <div className="flex flex-col h-full">
                <ArrowUpRight className="h-6 w-6 text-white mb-12" />
                <div>
                  <h3 className="font-semibold text-white">Send</h3>
                  <p className="text-sm text-white/70">To Bank/UPI</p>
                </div>
                <p className="text-xs text-white/50 mt-2">Instant Transfer</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-700 to-blue-500 border-none rounded-xl overflow-hidden cursor-pointer shadow-lg"
                onClick={() => handleQuickAction("receive")}
          >
            <CardContent className="p-4">
              <div className="flex flex-col h-full">
                <Download className="h-6 w-6 text-white mb-12" />
                <div>
                  <h3 className="font-semibold text-white">Receive</h3>
                  <p className="text-sm text-white/70">Get Paid</p>
                </div>
                <p className="text-xs text-white/50 mt-2">Show UPI/ID</p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Linked Banks */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold">Linked Banks</h3>
            <Button 
              variant="ghost" 
              className="text-sm text-gray-400 p-0"
              onClick={() => router.push("/balance")}
            >
              Manage
            </Button>
          </div>
          
          <Card className="bg-[#1a1a2e] border-none rounded-xl overflow-hidden shadow-lg">
            <CardContent className="p-4 flex justify-between items-center">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-[#252542] rounded-full flex items-center justify-center mr-3">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <div>
                  <h4 className="font-medium">{primaryAccount ? primaryAccount.bankName : "State Bank"}</h4>
                  <p className="text-xs text-gray-500">····6789</p>
                </div>
              </div>
              <Button variant="ghost" className="h-8 w-8 rounded-full p-0" onClick={linkBankAccount}>
                <User className="h-4 w-4 text-gray-400" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}