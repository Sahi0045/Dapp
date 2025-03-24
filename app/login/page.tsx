"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import WalletConnect from "../components/WalletConnect"
import PaymentLogo from "../components/PaymentLogo"
import Cookies from "js-cookie"

const brandingVariants = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { 
    opacity: 1, 
    scale: 1,
    transition: {
      duration: 0.5
    }
  },
  exit: { 
    opacity: 0,
    scale: 0.8,
    transition: {
      duration: 0.3
    }
  }
}

const loginVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.5
    }
  }
}

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [showBranding, setShowBranding] = useState(true)

  useEffect(() => {
    // Check if already connected
    const walletAddr = Cookies.get("wallet-address")
    if (walletAddr) {
      router.replace("/dashboard")
      return
    }

    // Show branding for 2.5 seconds
    const timer = setTimeout(() => {
      setShowBranding(false)
    }, 2500)

    return () => clearTimeout(timer)
  }, [router])

  const handleWalletConnect = (address: string) => {
    Cookies.set("wallet-address", address, { expires: 7 })
    Cookies.set("auth-status", "complete", { expires: 7 })
    
    setTimeout(() => {
      router.replace("/dashboard")
      toast({
        title: "Wallet Connected",
        description: "Welcome to Aptos Pay",
      })
    }, 500)
  }

  const handleWalletDisconnect = () => {
    Cookies.remove("wallet-address")
    Cookies.remove("auth-status")
    
    toast({
      title: "Wallet disconnected",
      description: "Please connect your wallet to continue",
      variant: "destructive",
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A] p-4">
      <AnimatePresence mode="wait">
        {showBranding ? (
          <motion.div
            key="branding"
            variants={brandingVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="text-center"
          >
            <PaymentLogo />
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-3xl font-bold text-white mt-6"
            >
              Aptos Pay
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-gray-400 mt-2"
            >
              Fast & Secure Payments
            </motion.p>
          </motion.div>
        ) : (
          <motion.div
            key="login"
            variants={loginVariants}
            initial="initial"
            animate="animate"
          >
            <Card className="bg-[#1A1A1A] border border-gray-800 w-full max-w-md">
              <CardContent className="p-6">
                <div className="text-center mb-8">
                  <div className="mx-auto w-16 h-16 mb-4">
                    <PaymentLogo />
                  </div>
                  <h1 className="text-2xl font-bold text-white">Welcome to Aptos Pay</h1>
                  <p className="text-gray-400 mt-2">Connect your wallet to continue</p>
                </div>
                <WalletConnect
                  onConnect={handleWalletConnect}
                  onDisconnect={handleWalletDisconnect}
                />
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

