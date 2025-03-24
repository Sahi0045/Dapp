"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Search,
  Shield,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"

interface Bank {
  id: string
  name: string
  logo: string
}

const POPULAR_BANKS: Bank[] = [
  { id: "chase", name: "Chase", logo: "chase.png" },
  { id: "bofa", name: "Bank of America", logo: "bofa.png" },
  { id: "wells", name: "Wells Fargo", logo: "wells.png" },
  { id: "citi", name: "Citibank", logo: "citi.png" },
]

export default function LinkBankPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null)
  const [isLinking, setIsLinking] = useState(false)

  const filteredBanks = POPULAR_BANKS.filter(bank =>
    bank.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleBankSelect = (bank: Bank) => {
    setSelectedBank(bank)
  }

  const handleLinkBank = async () => {
    if (!selectedBank) return

    setIsLinking(true)
    try {
      // Simulate API call to link bank
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast({
        title: "Bank Connected",
        description: "Successfully linked your bank account",
      })
      
      router.push('/balance')
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Failed to link bank account. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLinking(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <main className="container max-w-md mx-auto p-4 pb-20">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            className="text-white/60 hover:text-white"
            onClick={() => router.back()}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-2xl font-bold text-white">Link Bank Account</h1>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
          <Input
            type="text"
            placeholder="Search for your bank"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40"
          />
        </div>

        {/* Popular Banks */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Popular Banks</h2>
          {filteredBanks.map((bank) => (
            <motion.div
              key={bank.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card 
                className={`bg-black/40 backdrop-blur-xl border transition-colors cursor-pointer ${
                  selectedBank?.id === bank.id
                    ? "border-blue-500"
                    : "border-white/5 hover:border-white/20"
                }`}
                onClick={() => handleBankSelect(bank)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-white/10 p-2 rounded-lg">
                        <Building2 className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          {bank.name}
                        </h3>
                      </div>
                    </div>
                    {selectedBank?.id === bank.id && (
                      <div className="h-2 w-2 rounded-full bg-blue-500" />
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Security Note */}
        <div className="mt-8 p-4 bg-white/5 rounded-lg border border-white/10">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-white/60 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-white mb-1">
                Secure Connection
              </h3>
              <p className="text-sm text-white/60">
                Your bank credentials are encrypted and never stored on our servers.
                We use industry-standard security practices to protect your data.
              </p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: selectedBank ? 1 : 0, y: selectedBank ? 0 : 20 }}
          className="fixed bottom-8 left-4 right-4 max-w-md mx-auto"
        >
          <Button
            className="w-full bg-blue-600 hover:bg-blue-700"
            onClick={handleLinkBank}
            disabled={!selectedBank || isLinking}
          >
            {isLinking ? (
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                />
                Connecting...
              </div>
            ) : (
              <>
                Connect {selectedBank?.name}
                <ChevronRight className="h-5 w-5 ml-2" />
              </>
            )}
          </Button>
        </motion.div>
      </main>
    </div>
  )
} 