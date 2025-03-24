"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowLeft, Scan, User, Send, CreditCard, Wallet, RefreshCw, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { aptosClient } from "@/lib/aptos-client"
import { bluetoothService } from "@/lib/bluetooth-service"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useRouter } from "next/navigation"
import {
  ChevronLeft,
  Building2,
  Smartphone,
  ArrowRight,
} from "lucide-react"

export default function SendMoneyPage() {
  const router = useRouter()

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
          <h1 className="text-2xl font-bold text-white">Send Money</h1>
        </div>

        {/* Send Options */}
        <div className="space-y-4">
          <Button
            className="w-full bg-purple-600/20 hover:bg-purple-600/30 backdrop-blur-xl border border-white/5 p-6 h-auto"
            onClick={() => router.push('/balance/send/bank')}
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-4">
                <Building2 className="h-6 w-6 text-white" />
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-white">Bank Transfer</h3>
                  <p className="text-sm text-white/60">Send to bank account</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-white/60" />
            </div>
          </Button>

          <Button
            className="w-full bg-blue-600/20 hover:bg-blue-600/30 backdrop-blur-xl border border-white/5 p-6 h-auto"
            onClick={() => router.push('/balance/send/upi')}
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-4">
                <Smartphone className="h-6 w-6 text-white" />
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-white">UPI Transfer</h3>
                  <p className="text-sm text-white/60">Send using UPI ID</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-white/60" />
            </div>
          </Button>
        </div>
      </main>
    </div>
  )
}

