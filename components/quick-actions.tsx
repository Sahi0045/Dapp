"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Send, Download, QrCode, Phone } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { upiService } from "@/lib/upi-service"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function QuickActions() {
  const { toast } = useToast()
  const [isSending, setIsSending] = useState(false)
  const [isCollecting, setIsCollecting] = useState(false)
  const [sendAmount, setSendAmount] = useState("")
  const [receiverUPIId, setReceiverUPIId] = useState("")
  const [collectAmount, setCollectAmount] = useState("")
  const [payerUPIId, setPayerUPIId] = useState("")
  const [selectedAccount, setSelectedAccount] = useState("")

  const accounts = upiService.getBankAccounts()
  const defaultAccount = accounts.find((acc) => acc.isDefault)

  const handleSendMoney = async () => {
    if (!selectedAccount || !sendAmount || !receiverUPIId) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    try {
      const transaction = await upiService.initiatePayment({
        amount: parseFloat(sendAmount),
        receiverUPIId,
        description: "Payment",
        accountId: selectedAccount,
      })

      toast({
        title: "Payment sent",
        description: `₹${sendAmount} sent to ${receiverUPIId}`,
      })

      setIsSending(false)
      setSendAmount("")
      setReceiverUPIId("")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send payment",
        variant: "destructive",
      })
    }
  }

  const handleCollectMoney = async () => {
    if (!selectedAccount || !collectAmount || !payerUPIId) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    try {
      const transaction = await upiService.initiateCollect({
        amount: parseFloat(collectAmount),
        payerUPIId,
        description: "Payment request",
        accountId: selectedAccount,
      })

      toast({
        title: "Payment request sent",
        description: `Requested ₹${collectAmount} from ${payerUPIId}`,
      })

      setIsCollecting(false)
      setCollectAmount("")
      setPayerUPIId("")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send payment request",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <Dialog open={isSending} onOpenChange={setIsSending}>
        <DialogTrigger asChild>
          <Card className="bg-gray-800 border-gray-700 cursor-pointer hover:bg-gray-700 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                  <Send className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-medium">Send Money</h3>
                  <p className="text-sm text-gray-400">Transfer to any UPI ID</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Money</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="account">From Account</Label>
              <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                <SelectTrigger>
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.bankName} - {account.accountNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="upiId">To UPI ID</Label>
              <Input
                id="upiId"
                placeholder="Enter UPI ID"
                value={receiverUPIId}
                onChange={(e) => setReceiverUPIId(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount"
                value={sendAmount}
                onChange={(e) => setSendAmount(e.target.value)}
              />
            </div>
            <Button onClick={handleSendMoney} className="w-full">
              Send Money
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isCollecting} onOpenChange={setIsCollecting}>
        <DialogTrigger asChild>
          <Card className="bg-gray-800 border-gray-700 cursor-pointer hover:bg-gray-700 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                  <Download className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-medium">Collect Money</h3>
                  <p className="text-sm text-gray-400">Request payment from anyone</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Collect Money</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="collectAccount">To Account</Label>
              <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                <SelectTrigger>
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.bankName} - {account.accountNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="payerUPIId">From UPI ID</Label>
              <Input
                id="payerUPIId"
                placeholder="Enter payer's UPI ID"
                value={payerUPIId}
                onChange={(e) => setPayerUPIId(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="collectAmount">Amount</Label>
              <Input
                id="collectAmount"
                type="number"
                placeholder="Enter amount"
                value={collectAmount}
                onChange={(e) => setCollectAmount(e.target.value)}
              />
            </div>
            <Button onClick={handleCollectMoney} className="w-full">
              Request Payment
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Card className="bg-gray-800 border-gray-700 cursor-pointer hover:bg-gray-700 transition-colors">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center">
              <QrCode className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-medium">Scan QR</h3>
              <p className="text-sm text-gray-400">Pay by scanning QR code</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-800 border-gray-700 cursor-pointer hover:bg-gray-700 transition-colors">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center">
              <Phone className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-medium">Pay by Number</h3>
              <p className="text-sm text-gray-400">Send money to phone number</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

