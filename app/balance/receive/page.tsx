"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowLeft, Copy, Share, Download, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { QRCode } from "@/components/qr-code"
import { aptosClient } from "@/lib/aptos-client"
import { useRouter } from "next/navigation"
import { ChevronLeft, QrCode } from "lucide-react"

export default function ReceiveMoneyPage() {
  const router = useRouter()
  const [walletAddress, setWalletAddress] = useState<string>("")
  const [upiId, setUpiId] = useState<string>("")
  const [amount, setAmount] = useState<string>("")
  const [qrData, setQrData] = useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const { toast } = useToast()

  useEffect(() => {
    // Load wallet address from local storage
    const storedWallet = localStorage.getItem("walletAddress")
    if (storedWallet) {
      setWalletAddress(storedWallet)
    }

    // Load UPI ID from local storage
    const storedUpi = localStorage.getItem("upiId")
    if (storedUpi) {
      setUpiId(storedUpi)
    } else {
      setUpiId("user@aptospay")
    }
  }, [])

  useEffect(() => {
    // Generate QR code data
    generateQrData()
  }, [walletAddress, upiId, amount])

  const generateQrData = () => {
    if (!walletAddress && !upiId) return

    // Create payment data for QR code
    const paymentData = {
      type: "aptos_pay",
      version: "1.0",
      recipient: walletAddress || upiId,
      amount: amount ? Number.parseFloat(amount) : undefined,
      currency: "APT",
      timestamp: Date.now(),
    }

    setQrData(JSON.stringify(paymentData))
  }

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied to clipboard",
      description: `Your ${type} has been copied to clipboard`,
    })
  }

  const shareDetails = (text: string) => {
    if (navigator.share) {
      navigator.share({
        title: "My Aptos Pay Details",
        text: `Here are my payment details: ${text}`,
      })
    } else {
      copyToClipboard(text, "payment details")
    }
  }

  const downloadQrCode = () => {
    const qrElement = document.querySelector(".qr-code-container svg") as SVGElement
    if (!qrElement) return

    // Create a data URL from the SVG
    const svgData = new XMLSerializer().serializeToString(qrElement)
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" })
    const svgUrl = URL.createObjectURL(svgBlob)

    // Create a link and trigger download
    const downloadLink = document.createElement("a")
    downloadLink.href = svgUrl
    downloadLink.download = "aptos-pay-qr.svg"
    document.body.appendChild(downloadLink)
    downloadLink.click()
    document.body.removeChild(downloadLink)
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
    } catch (error) {
      console.error("Failed to connect wallet:", error)
      toast({
        title: "Connection failed",
        description: "Failed to connect to Aptos wallet",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(upiId)
    toast({
      title: "Copied!",
      description: "UPI ID copied to clipboard",
    })
  }

  const handleShare = async () => {
    try {
      await navigator.share({
        title: "My UPI ID",
        text: upiId,
      })
    } catch (error) {
      console.error("Error sharing:", error)
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <main className="container max-w-md mx-auto p-4">
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
          <h1 className="text-2xl font-bold text-white">Receive Money</h1>
        </div>

        {/* QR Code */}
        <Card className="bg-gradient-to-br from-purple-600/20 to-blue-600/20 backdrop-blur-xl border-white/5">
          <CardContent className="p-6 flex flex-col items-center">
            <div className="w-64 h-64 bg-white/10 rounded-lg flex items-center justify-center mb-6">
              <QrCode className="w-32 h-32 text-white" />
            </div>
            <p className="text-white/60 mb-2">Your UPI ID</p>
            <div className="flex items-center gap-2 mb-4">
              <code className="bg-white/10 px-3 py-1 rounded text-white">{upiId}</code>
              <Button
                variant="ghost"
                size="icon"
                className="text-white/60 hover:text-white"
                onClick={handleCopy}
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-white/60 hover:text-white"
                onClick={handleShare}
              >
                <Share className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <div className="mt-6 p-4 bg-white/5 rounded-lg">
          <h3 className="text-white font-medium mb-2">How to receive money</h3>
          <ol className="list-decimal list-inside text-sm text-white/60 space-y-2">
            <li>Share your UPI ID or QR code with the sender</li>
            <li>Ask them to scan the QR code or enter your UPI ID</li>
            <li>They can then enter the amount and send the money</li>
            <li>You'll receive a notification once the money is transferred</li>
          </ol>
        </div>
      </main>
    </div>
  )
}

