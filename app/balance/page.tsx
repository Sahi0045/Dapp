"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Plus,
  RefreshCcw,
  Trash2,
  Star,
  StarOff
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import Cookies from "js-cookie"

interface BankAccount {
  id: string
  bankName: string
  accountType: string
  balance: number
  lastUpdated: string
  isPrimary?: boolean
}

export default function BalancePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    // Check authentication first
    const authStatus = Cookies.get("auth-status")
    if (authStatus !== "authenticated") {
      router.push("/login")
      return
    }

    // Load accounts from localStorage
    try {
      const savedAccounts = localStorage.getItem('bankAccounts')
      if (savedAccounts) {
        setAccounts(JSON.parse(savedAccounts))
      } else {
        // Set initial accounts if none exist
        const initialAccounts: BankAccount[] = [
          {
            id: "chase-1",
            bankName: "Chase",
            accountType: "Checking",
            balance: 5420.50,
            lastUpdated: new Date().toISOString(),
            isPrimary: true
          },
          {
            id: "bofa-1",
            bankName: "Bank of America",
            accountType: "Savings",
            balance: 12750.75,
            lastUpdated: new Date().toISOString(),
            isPrimary: false
          },
        ]
        setAccounts(initialAccounts)
        localStorage.setItem('bankAccounts', JSON.stringify(initialAccounts))
      }
    } catch (error) {
      console.error("Error loading accounts:", error)
      toast({
        title: "Error",
        description: "Failed to load bank accounts",
        variant: "destructive",
      })
    }
  }, [router, toast])

  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0)

  const handleRefreshBalances = async () => {
    setIsRefreshing(true)
    try {
      // Simulate API call to refresh balances
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Update last updated timestamp
      const updatedAccounts = accounts.map(account => ({
        ...account,
        lastUpdated: new Date().toISOString()
      }))
      setAccounts(updatedAccounts)
      localStorage.setItem('bankAccounts', JSON.stringify(updatedAccounts))
      
      toast({
        title: "Balances Updated",
        description: "Your account balances have been refreshed",
      })
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to refresh balances. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleRemoveAccount = (accountId: string) => {
    const updatedAccounts = accounts.filter(account => account.id !== accountId)
    setAccounts(updatedAccounts)
    localStorage.setItem('bankAccounts', JSON.stringify(updatedAccounts))
    toast({
      title: "Account Removed",
      description: "Bank account has been unlinked",
    })
  }

  const handleSetPrimary = (accountId: string) => {
    const updatedAccounts = accounts.map(account => ({
      ...account,
      isPrimary: account.id === accountId
    }))
    setAccounts(updatedAccounts)
    localStorage.setItem('bankAccounts', JSON.stringify(updatedAccounts))
    
    const primaryAccount = updatedAccounts.find(account => account.id === accountId)
    toast({
      title: "Primary Account Updated",
      description: `${primaryAccount?.bankName} is now your primary account`,
    })
  }

  // Update the back button to use the correct URL
  const handleBack = () => {
    const authStatus = Cookies.get("auth-status")
    if (authStatus === "authenticated") {
      router.push('/dashboard')
    } else {
      router.push('/login')
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <main className="container max-w-md mx-auto p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="text-white/60 hover:text-white"
              onClick={handleBack}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <h1 className="text-2xl font-bold text-white">Bank Accounts</h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-white/60 hover:text-white"
            onClick={handleRefreshBalances}
            disabled={isRefreshing}
          >
            <motion.div
              animate={isRefreshing ? { rotate: 360 } : {}}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <RefreshCcw className="h-5 w-5" />
            </motion.div>
          </Button>
        </div>

        {/* Total Balance */}
        <Card className="bg-gradient-to-br from-blue-600 to-blue-800 border-0 mb-6">
          <CardContent className="p-6">
            <div className="text-white/60 text-sm mb-2">Total Balance</div>
            <div className="text-3xl font-bold text-white">
              ₹{totalBalance.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
          </CardContent>
        </Card>

        {/* Linked Accounts */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Linked Accounts</h2>
            <Button
              variant="ghost"
              size="sm"
              className="text-blue-500 hover:text-blue-400"
              onClick={() => router.push("/balance/link-bank")}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Bank
            </Button>
          </div>

          {accounts.map((account) => (
            <motion.div
              key={account.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className={`bg-black/40 backdrop-blur-xl border ${
                account.isPrimary ? 'border-blue-500' : 'border-white/5'
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-white/10 p-2 rounded-lg">
                        <Building2 className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-white">
                            {account.bankName}
                          </h3>
                          {account.isPrimary && (
                            <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">
                              Primary
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-white/60">
                          {account.accountType}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`${
                          account.isPrimary 
                            ? 'text-blue-400 hover:text-blue-300' 
                            : 'text-white/40 hover:text-white/60'
                        }`}
                        onClick={() => handleSetPrimary(account.id)}
                        disabled={account.isPrimary}
                      >
                        {account.isPrimary ? (
                          <Star className="h-4 w-4 fill-current" />
                        ) : (
                          <StarOff className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-white/40 hover:text-white/60"
                        onClick={() => handleRemoveAccount(account.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <div className="text-xl font-semibold text-white">
                      ₹{account.balance.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                    <p className="text-sm text-white/40 mt-1">
                      Last updated: {new Date(account.lastUpdated).toLocaleTimeString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}

          {accounts.length === 0 && (
            <div className="text-center py-8">
              <p className="text-white/40 mb-4">No bank accounts linked yet</p>
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => router.push("/balance/link-bank")}
              >
                Link Your First Bank
                <ChevronRight className="h-5 w-5 ml-2" />
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
} 