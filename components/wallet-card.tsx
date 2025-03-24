"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Eye, EyeOff, ChevronDown, RefreshCw, ExternalLink } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { aptosClient } from "@/lib/aptos-client"
import { useToast } from "@/hooks/use-toast"

interface WalletCardProps {
  balance: string
  isLoading?: boolean
  address?: string
}

export function WalletCard({ balance, isLoading = false, address }: WalletCardProps) {
  const [showBalance, setShowBalance] = useState(true)
  const [selectedCurrency, setSelectedCurrency] = useState("APT")
  const [refreshing, setRefreshing] = useState(false)
  const { toast } = useToast()

  const toggleBalance = () => {
    setShowBalance(!showBalance)
  }

  const refreshBalance = async () => {
    if (!address || refreshing) return

    setRefreshing(true)
    try {
      const newBalance = await aptosClient.getBalance(address)

      // This would update the balance in the parent component
      // For now, we'll just show a toast
      toast({
        title: "Balance refreshed",
        description: `Your current balance is ${newBalance} APT`,
      })
    } catch (error) {
      console.error("Failed to refresh balance:", error)
      toast({
        title: "Failed to refresh balance",
        description: "Could not connect to Aptos network",
        variant: "destructive",
      })
    } finally {
      setRefreshing(false)
    }
  }

  const openExplorer = () => {
    if (!address) return

    const explorerUrl = `https://explorer.aptoslabs.com/account/${address}?network=${aptosClient.networkType}`
    window.open(explorerUrl, "_blank")
  }

  // Calculate equivalent values in other currencies (mock conversion)
  const getEquivalentValue = (aptValue: string): string => {
    const value = Number.parseFloat(aptValue.replace(/,/g, ""))

    switch (selectedCurrency) {
      case "USD":
        return (value * 2).toFixed(2)
      case "INR":
        return (value * 148).toFixed(2)
      default:
        return aptValue
    }
  }

  return (
    <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
      <Card className="bg-gradient-to-br from-gray-800 to-gray-900 text-white border-none overflow-hidden">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-white text-xs font-bold">AP</span>
              </div>
              <span className="font-medium">Aptos Pay</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20"
                onClick={openExplorer}
                title="View in Explorer"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 text-white/80 hover:text-white hover:bg-white/10">
                    {selectedCurrency}
                    <ChevronDown className="ml-1 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
                  <DropdownMenuItem onClick={() => setSelectedCurrency("APT")} className="text-white hover:bg-gray-700">
                    APT (Aptos)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedCurrency("USD")} className="text-white hover:bg-gray-700">
                    USD (US Dollar)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedCurrency("INR")} className="text-white hover:bg-gray-700">
                    INR (Indian Rupee)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm text-white/80">Available Balance</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded-full bg-white/10 hover:bg-white/20"
                onClick={toggleBalance}
              >
                {showBalance ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </Button>
            </div>
            <div className="flex items-baseline">
              <span className="text-2xl font-bold mr-2">
                {selectedCurrency === "INR" ? "₹" : selectedCurrency === "USD" ? "$" : ""}
              </span>
              {isLoading || refreshing ? (
                <RefreshCw className="h-8 w-8 text-white animate-spin" />
              ) : (
                <span className="text-4xl font-bold">{showBalance ? getEquivalentValue(balance) : "••••••"}</span>
              )}
            </div>
            {address && (
              <p className="text-xs text-white/50 mt-1 truncate">
                {address.substring(0, 8)}...{address.substring(address.length - 6)}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="secondary" className="bg-white/10 hover:bg-white/20 text-white border-0">
              Add Money
            </Button>
            <Button
              variant="secondary"
              className="bg-white/10 hover:bg-white/20 text-white border-0"
              onClick={refreshBalance}
            >
              {refreshing ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : "Refresh"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

