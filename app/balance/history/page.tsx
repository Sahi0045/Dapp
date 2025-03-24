"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, ArrowUpRight, ArrowDownLeft, Filter, RefreshCw, ExternalLink } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { aptosClient } from "@/lib/aptos-client"
import type { Transaction } from "@/lib/aptos-client"
import { useToast } from "@/hooks/use-toast"

export default function HistoryPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [filter, setFilter] = useState<"all" | "send" | "receive">("all")
  const [isLoading, setIsLoading] = useState(true)
  const [walletAddress, setWalletAddress] = useState<string>("")
  const { toast } = useToast()

  useEffect(() => {
    // Initialize wallet and fetch transactions
    const initWallet = async () => {
      try {
        // Try to get wallet from local storage
        const storedWallet = localStorage.getItem("walletAddress")
        if (storedWallet) {
          setWalletAddress(storedWallet)
          fetchTransactions(storedWallet)
        } else {
          setIsLoading(false)
        }
      } catch (error) {
        console.error("Failed to initialize wallet:", error)
        setIsLoading(false)
      }
    }

    initWallet()
  }, [])

  const fetchTransactions = async (address: string) => {
    if (!address) return

    setIsLoading(true)
    try {
      // Fetch transactions from Aptos blockchain
      const txHistory = await aptosClient.getTransactionHistory(address)

      // Add some mock transactions for demo purposes
      const mockTransactions: Transaction[] = [
        {
          hash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
          sender: address,
          recipient: "0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba",
          amount: "250.00",
          timestamp: Date.now() - 3600000, // 1 hour ago
          status: "completed",
          note: "Payment to Rahul Sharma",
          paymentMethod: "wallet",
        },
        {
          hash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
          sender: "0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba",
          recipient: address,
          amount: "1,000.00",
          timestamp: Date.now() - 86400000, // 1 day ago
          status: "completed",
          note: "Payment from Priya Patel",
          paymentMethod: "wallet",
        },
        {
          hash: "0x7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef123456",
          sender: address,
          recipient: "0x5432109876fedcba5432109876fedcba5432109876fedcba5432109876fedcba",
          amount: "75.50",
          timestamp: Date.now() - 172800000, // 2 days ago
          status: "pending",
          note: "Payment to Amit Kumar",
          paymentMethod: "wallet",
        },
      ]

      // Combine real and mock transactions
      const allTransactions = [...txHistory, ...mockTransactions]

      // Sort by timestamp (newest first)
      allTransactions.sort((a, b) => b.timestamp - a.timestamp)

      setTransactions(allTransactions)
    } catch (error) {
      console.error("Failed to fetch transactions:", error)
      toast({
        title: "Failed to fetch transactions",
        description: "Could not retrieve your transaction history",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const connectWallet = async () => {
    setIsLoading(true)
    try {
      const walletInfo = await aptosClient.connectPetraWallet()
      setWalletAddress(walletInfo.address)
      localStorage.setItem("walletAddress", walletInfo.address)

      toast({
        title: "Wallet connected",
        description: "Successfully connected to Aptos wallet",
      })

      fetchTransactions(walletInfo.address)
    } catch (error) {
      console.error("Failed to connect wallet:", error)
      toast({
        title: "Connection failed",
        description: "Failed to connect to Aptos wallet",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  const filteredTransactions = transactions.filter((tx) => {
    if (filter === "all") return true
    if (filter === "send") return tx.sender === walletAddress
    return tx.recipient === walletAddress
  })

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffInDays === 0) {
      return `Today, ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
    } else if (diffInDays === 1) {
      return `Yesterday, ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })
    }
  }

  const openExplorer = (txHash: string) => {
    const explorerUrl = aptosClient.getExplorerURL(txHash)
    window.open(explorerUrl, "_blank")
  }

  const truncateAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="sticky top-0 z-10 border-b border-gray-800 bg-black/95 backdrop-blur supports-[backdrop-filter]:bg-black/60">
        <div className="flex h-14 items-center px-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="mr-2 text-white hover:bg-gray-800">
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Back</span>
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Transaction History</h1>

          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => walletAddress && fetchTransactions(walletAddress)}
              disabled={isLoading || !walletAddress}
              className="text-gray-400 hover:bg-gray-800"
            >
              <RefreshCw className={`h-5 w-5 ${isLoading ? "animate-spin" : ""}`} />
              <span className="sr-only">Refresh</span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="border-gray-700 text-white hover:bg-gray-800">
                  <Filter className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
                <DropdownMenuItem onClick={() => setFilter("all")} className="text-white hover:bg-gray-700">
                  All Transactions
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter("send")} className="text-white hover:bg-gray-700">
                  Sent Only
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter("receive")} className="text-white hover:bg-gray-700">
                  Received Only
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="container max-w-md mx-auto p-4">
        {!walletAddress ? (
          <Card className="bg-gray-900 border-gray-800 mb-4">
            <CardContent className="pt-6 text-center py-8">
              <p className="text-sm text-gray-400 mb-4">Connect your Aptos wallet to view transaction history</p>
              <Button onClick={connectWallet} disabled={isLoading} className="bg-white text-black hover:bg-gray-200">
                {isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  "Connect Wallet"
                )}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <Tabs defaultValue="all">
              <TabsList className="grid grid-cols-3 mb-4 bg-gray-800">
                <TabsTrigger value="all" onClick={() => setFilter("all")} className="data-[state=active]:bg-gray-700">
                  All
                </TabsTrigger>
                <TabsTrigger value="send" onClick={() => setFilter("send")} className="data-[state=active]:bg-gray-700">
                  Sent
                </TabsTrigger>
                <TabsTrigger
                  value="receive"
                  onClick={() => setFilter("receive")}
                  className="data-[state=active]:bg-gray-700"
                >
                  Received
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-0">
                <Card className="bg-gray-900 border-gray-800">
                  <CardContent className="p-0">
                    {isLoading ? (
                      <div className="divide-y divide-gray-800">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <Skeleton className="h-10 w-10 rounded-full bg-gray-800" />
                                <div className="ml-3">
                                  <Skeleton className="h-4 w-24 bg-gray-800" />
                                  <Skeleton className="h-3 w-16 mt-1 bg-gray-800" />
                                </div>
                              </div>
                              <Skeleton className="h-4 w-16 bg-gray-800" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : filteredTransactions.length > 0 ? (
                      <div className="divide-y divide-gray-800">
                        {filteredTransactions.map((tx) => (
                          <div
                            key={tx.hash}
                            className="flex items-center justify-between p-4 hover:bg-gray-800/50 cursor-pointer"
                            onClick={() => openExplorer(tx.hash)}
                          >
                            <div className="flex items-center">
                              <div
                                className={`rounded-full p-2 mr-3 ${
                                  tx.sender === walletAddress ? "bg-red-900/50" : "bg-green-900/50"
                                }`}
                              >
                                {tx.sender === walletAddress ? (
                                  <ArrowUpRight
                                    className={`h-5 w-5 ${tx.status === "failed" ? "text-gray-400" : "text-red-400"}`}
                                  />
                                ) : (
                                  <ArrowDownLeft className="h-5 w-5 text-green-400" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium text-white">
                                  {tx.sender === walletAddress
                                    ? `To: ${truncateAddress(tx.recipient)}`
                                    : `From: ${truncateAddress(tx.sender)}`}
                                </p>
                                <p className="text-xs text-gray-400">{formatDate(tx.timestamp)}</p>
                                {tx.status === "failed" && <p className="text-xs text-red-400">Failed</p>}
                                {tx.status === "pending" && <p className="text-xs text-amber-400">Pending</p>}
                                {tx.note && <p className="text-xs text-gray-500 mt-1">{tx.note}</p>}
                              </div>
                            </div>
                            <div className="text-right flex items-center">
                              <p
                                className={`font-medium ${
                                  tx.sender === walletAddress ? "text-red-400" : "text-green-400"
                                } ${tx.status === "failed" ? "text-gray-400" : ""}`}
                              >
                                {tx.sender === walletAddress ? "-" : "+"}
                                {tx.amount} APT
                              </p>
                              <ExternalLink className="h-4 w-4 ml-2 text-gray-500" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center">
                        <p className="text-gray-400">No transactions found</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="send" className="mt-0">
                {/* This content is handled by the filter state */}
              </TabsContent>

              <TabsContent value="receive" className="mt-0">
                {/* This content is handled by the filter state */}
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>
    </div>
  )
}

