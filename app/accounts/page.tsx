"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowLeft, Plus, CreditCard, Building, Landmark } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BankAccountsList } from "@/components/bank-accounts-list"
import { useToast } from "@/hooks/use-toast"

export default function AccountsPage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("accounts")
  const [accountNumber, setAccountNumber] = useState("")
  const [ifscCode, setIfscCode] = useState("")
  const [accountHolderName, setAccountHolderName] = useState("")
  const [loading, setLoading] = useState(false)

  const handleAddAccount = () => {
    if (!accountNumber || !ifscCode || !accountHolderName) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    // Simulate account linking
    setTimeout(() => {
      toast({
        title: "Account linked successfully",
        description: "Your bank account has been linked to your wallet",
      })

      // Reset form and switch to accounts tab
      setAccountNumber("")
      setIfscCode("")
      setAccountHolderName("")
      setActiveTab("accounts")
      setLoading(false)
    }, 2000)
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
          <h1 className="text-lg font-semibold">Bank Accounts</h1>
        </div>
      </header>

      <main className="container max-w-md mx-auto p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-800">
              <TabsTrigger value="accounts" className="data-[state=active]:bg-gray-700">
                My Accounts
              </TabsTrigger>
              <TabsTrigger value="add" className="data-[state=active]:bg-gray-700">
                Add Account
              </TabsTrigger>
            </TabsList>

            <TabsContent value="accounts" className="mt-4">
              <BankAccountsList />
              <Button
                variant="outline"
                className="w-full mt-4 border-gray-700 text-white hover:bg-gray-800"
                onClick={() => setActiveTab("add")}
              >
                <Plus className="h-4 w-4 mr-2" />
                Link New Bank Account
              </Button>
            </TabsContent>

            <TabsContent value="add" className="mt-4">
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-xl text-white">Link Bank Account</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <Card className="col-span-1 cursor-pointer hover:border-white bg-gray-800 border-gray-700">
                      <CardContent className="p-4 flex flex-col items-center justify-center h-full">
                        <Building className="h-8 w-8 mb-2 text-white" />
                        <p className="text-xs text-center text-gray-300">Private Banks</p>
                      </CardContent>
                    </Card>
                    <Card className="col-span-1 cursor-pointer hover:border-white bg-gray-800 border-gray-700">
                      <CardContent className="p-4 flex flex-col items-center justify-center h-full">
                        <Landmark className="h-8 w-8 mb-2 text-white" />
                        <p className="text-xs text-center text-gray-300">Public Banks</p>
                      </CardContent>
                    </Card>
                    <Card className="col-span-1 cursor-pointer hover:border-white bg-gray-800 border-gray-700">
                      <CardContent className="p-4 flex flex-col items-center justify-center h-full">
                        <CreditCard className="h-8 w-8 mb-2 text-white" />
                        <p className="text-xs text-center text-gray-300">Other Banks</p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="account-holder" className="text-gray-300">
                      Account Holder Name
                    </Label>
                    <Input
                      id="account-holder"
                      placeholder="Enter account holder name"
                      value={accountHolderName}
                      onChange={(e) => setAccountHolderName(e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="account-number" className="text-gray-300">
                      Account Number
                    </Label>
                    <Input
                      id="account-number"
                      placeholder="Enter account number"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ifsc" className="text-gray-300">
                      IFSC Code
                    </Label>
                    <Input
                      id="ifsc"
                      placeholder="Enter IFSC code"
                      value={ifscCode}
                      onChange={(e) => setIfscCode(e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  </div>

                  <Button
                    className="w-full mt-6 bg-white text-black hover:bg-gray-200"
                    onClick={handleAddAccount}
                    disabled={loading}
                  >
                    {loading ? "Linking Account..." : "Link Account"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>
    </div>
  )
}

