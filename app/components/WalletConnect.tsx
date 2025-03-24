"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Wallet, Check } from "lucide-react"

// Define types for Petra wallet
declare global {
  interface Window {
    aptos: any
  }
}

interface WalletConnectProps {
  onConnect: (address: string) => void
  onDisconnect: () => void
}

const buttonVariants = {
  initial: { scale: 1 },
  hover: { scale: 1.05 },
  tap: { scale: 0.95 }
}

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5
    }
  }
}

export default function WalletConnect({ onConnect, onDisconnect }: WalletConnectProps) {
  const [isConnecting, setIsConnecting] = useState(false)
  const [walletAddress, setWalletAddress] = useState("")
  const { toast } = useToast()

  // Check if Petra wallet is installed
  const checkIfWalletIsInstalled = () => {
    const isPetraInstalled = window.aptos
    if (!isPetraInstalled) {
      toast({
        title: "Petra Wallet Not Found",
        description: "Please install Petra wallet to continue",
        variant: "destructive",
      })
      return false
    }
    return true
  }

  // Check for existing connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      if (!checkIfWalletIsInstalled()) return

      try {
        const response = await window.aptos.isConnected()
        if (response) {
          const account = await window.aptos.account()
          setWalletAddress(account.address)
          onConnect(account.address)
        }
      } catch (error) {
        console.error("Error checking connection:", error)
      }
    }

    checkConnection()
  }, [onConnect])

  const connectWallet = async () => {
    if (!checkIfWalletIsInstalled()) return

    setIsConnecting(true)
    try {
      await window.aptos.connect()
      const account = await window.aptos.account()
      setWalletAddress(account.address)
      onConnect(account.address)
      toast({
        title: "Wallet Connected",
        description: "Successfully connected to Petra wallet",
      })
    } catch (error: any) {
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect wallet",
        variant: "destructive",
      })
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnectWallet = async () => {
    if (!checkIfWalletIsInstalled()) return

    try {
      await window.aptos.disconnect()
      setWalletAddress("")
      onDisconnect()
      toast({
        title: "Wallet Disconnected",
        description: "Successfully disconnected from Petra wallet",
      })
    } catch (error: any) {
      toast({
        title: "Disconnection Failed",
        description: error.message || "Failed to disconnect wallet",
        variant: "destructive",
      })
    }
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6 border border-white/5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500/10 p-2 rounded-lg">
              <Wallet className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <h3 className="text-white font-medium">Wallet Connection</h3>
              <p className="text-gray-400 text-sm">
                {walletAddress ? (
                  `Connected: ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
                ) : "Connect your Petra wallet"}
              </p>
            </div>
          </div>
          <motion.div
            animate={walletAddress ? { scale: [1, 1.2, 1], rotate: [0, 360] } : {}}
            transition={{ duration: 0.5 }}
          >
            {walletAddress && <Check className="h-6 w-6 text-green-500" />}
          </motion.div>
        </div>

        <motion.div
          variants={buttonVariants}
          initial="initial"
          whileHover="hover"
          whileTap="tap"
        >
          <Button
            onClick={walletAddress ? disconnectWallet : connectWallet}
            className={`w-full h-12 relative ${
              walletAddress 
                ? 'bg-red-500 hover:bg-red-600' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
            disabled={isConnecting}
          >
            {isConnecting ? (
              <motion.div
                className="flex items-center gap-2"
                animate={{ opacity: [0.5, 1] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              >
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Connecting...
              </motion.div>
            ) : walletAddress ? (
              "Disconnect Wallet"
            ) : (
              "Connect Petra Wallet"
            )}
          </Button>
        </motion.div>

        {walletAddress && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 bg-green-500/10 rounded-lg border border-green-500/20"
          >
            <p className="text-green-400 text-sm text-center">
              Wallet connected successfully!
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
} 