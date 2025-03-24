"use client"

import { useState, useEffect } from "react"
import {
  ArrowLeft,
  ChevronRight,
  Shield,
  Smartphone,
  Bluetooth,
  Database,
  Globe,
  Network,
  Wallet,
  RefreshCw,
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { aptosClient } from "@/lib/aptos-client"
import { bluetoothService } from "@/lib/bluetooth-service"

export default function SettingsPage() {
  const [bluetoothEnabled, setBluetoothEnabled] = useState(false)
  const [offlineMode, setOfflineMode] = useState(false)
  const [biometricAuth, setBiometricAuth] = useState(true)
  const [dataSync, setDataSync] = useState(true)
  const [network, setNetwork] = useState<"mainnet" | "testnet" | "devnet">("devnet")
  const [walletAddress, setWalletAddress] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    // Initialize settings
    const initSettings = () => {
      // Check Bluetooth status
      setBluetoothEnabled(bluetoothService.isBluetoothEnabled())

      // Load wallet address from local storage
      const storedWallet = localStorage.getItem("walletAddress")
      if (storedWallet) {
        setWalletAddress(storedWallet)
      }

      // Load network from local storage
      const storedNetwork = localStorage.getItem("network") as "mainnet" | "testnet" | "devnet" | null
      if (storedNetwork) {
        setNetwork(storedNetwork)
      }

      // Load other settings from local storage
      const storedOfflineMode = localStorage.getItem("offlineMode")
      if (storedOfflineMode) {
        setOfflineMode(storedOfflineMode === "true")
      }

      const storedBiometricAuth = localStorage.getItem("biometricAuth")
      if (storedBiometricAuth) {
        setBiometricAuth(storedBiometricAuth === "true")
      }

      const storedDataSync = localStorage.getItem("dataSync")
      if (storedDataSync) {
        setDataSync(storedDataSync === "true")
      }
    }

    initSettings()
  }, [])

  const toggleBluetooth = async () => {
    if (bluetoothEnabled) {
      bluetoothService.disable()
      setBluetoothEnabled(false)
      toast({
        title: "Bluetooth disabled",
        description: "Bluetooth payments have been disabled",
      })
    } else {
      try {
        const enabled = await bluetoothService.enable()
        setBluetoothEnabled(enabled)

        if (enabled) {
          toast({
            title: "Bluetooth enabled",
            description: "You can now make offline transactions via Bluetooth",
          })
        } else {
          toast({
            title: "Bluetooth not enabled",
            description: "Failed to enable Bluetooth",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Failed to enable Bluetooth:", error)
        toast({
          title: "Bluetooth error",
          description: "Failed to enable Bluetooth: " + (error as Error).message,
          variant: "destructive",
        })
      }
    }
  }

  const toggleOfflineMode = (value: boolean) => {
    setOfflineMode(value)
    localStorage.setItem("offlineMode", value.toString())

    toast({
      title: value ? "Offline mode enabled" : "Offline mode disabled",
      description: value
        ? "Transactions will be stored locally when offline"
        : "Offline transactions have been disabled",
    })
  }

  const toggleBiometricAuth = (value: boolean) => {
    setBiometricAuth(value)
    localStorage.setItem("biometricAuth", value.toString())

    toast({
      title: value ? "Biometric authentication enabled" : "Biometric authentication disabled",
      description: value
        ? "You will now use biometric authentication for transactions"
        : "Biometric authentication has been disabled",
    })
  }

  const toggleDataSync = (value: boolean) => {
    setDataSync(value)
    localStorage.setItem("dataSync", value.toString())

    toast({
      title: value ? "Data sync enabled" : "Data sync disabled",
      description: value ? "Your transaction history will be synced across devices" : "Data sync has been disabled",
    })
  }

  const changeNetwork = (value: "mainnet" | "testnet" | "devnet") => {
    setNetwork(value)
    localStorage.setItem("network", value)
    aptosClient.switchNetwork(value)

    toast({
      title: "Network changed",
      description: `You are now connected to Aptos ${value}`,
    })
  }

  const clearCache = () => {
    setIsLoading(true)

    setTimeout(() => {
      // Clear local storage except for critical items
      const walletAddress = localStorage.getItem("walletAddress")
      const network = localStorage.getItem("network")

      localStorage.clear()

      if (walletAddress) localStorage.setItem("walletAddress", walletAddress)
      if (network) localStorage.setItem("network", network)

      // Clear pending transactions
      bluetoothService.clearPendingTransactions()

      toast({
        title: "Cache cleared",
        description: "Local cache has been cleared successfully",
      })

      setIsLoading(false)
    }, 1000)
  }

  const connectWallet = async () => {
    setIsLoading(true)
    try {
      const walletInfo = await aptosClient.connectPetraWallet()
      setWalletAddress(walletInfo.address)
      localStorage.setItem("walletAddress", walletInfo.address)

      toast({
        title: "Wallet connected",
        description: "Successfully connected to Petra wallet",
      })
    } catch (error) {
      console.error("Failed to connect wallet:", error)
      toast({
        title: "Connection failed",
        description: "Failed to connect to Petra wallet",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const disconnectWallet = () => {
    localStorage.removeItem("walletAddress")
    setWalletAddress("")

    toast({
      title: "Wallet disconnected",
      description: "Your wallet has been disconnected",
    })
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
          <h1 className="text-xl font-bold">Settings</h1>
        </div>
      </header>

      <main className="container max-w-md mx-auto p-4">
        <div className="space-y-4">
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-0">
              <div className="p-4">
                <h2 className="text-lg font-medium mb-2 text-white">Wallet</h2>
              </div>
              <Separator className="bg-gray-800" />

              {walletAddress ? (
                <>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <Wallet className="h-5 w-5 mr-3 text-blue-400" />
                        <p className="font-medium text-white">Connected Wallet</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mb-3 break-all">{walletAddress}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-gray-700 text-white hover:bg-gray-800"
                      onClick={disconnectWallet}
                    >
                      Disconnect Wallet
                    </Button>
                  </div>
                </>
              ) : (
                <div className="p-4">
                  <p className="text-sm text-gray-400 mb-3">Connect your Aptos wallet to use all features</p>
                  <Button
                    className="w-full bg-white text-black hover:bg-gray-200"
                    onClick={connectWallet}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Wallet className="mr-2 h-4 w-4" />
                        Connect Wallet
                      </>
                    )}
                  </Button>
                </div>
              )}

              <Separator className="bg-gray-800" />

              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center">
                  <Network className="h-5 w-5 mr-3 text-purple-400" />
                  <div>
                    <p className="font-medium text-white">Aptos Network</p>
                    <p className="text-xs text-gray-400">Select which network to connect to</p>
                  </div>
                </div>
                <Select
                  value={network}
                  onValueChange={(value: "mainnet" | "testnet" | "devnet") => changeNetwork(value)}
                >
                  <SelectTrigger className="w-[120px] bg-gray-800 border-gray-700 text-white">
                    <SelectValue placeholder="Network" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="mainnet" className="text-white focus:bg-gray-700 focus:text-white">
                      Mainnet
                    </SelectItem>
                    <SelectItem value="testnet" className="text-white focus:bg-gray-700 focus:text-white">
                      Testnet
                    </SelectItem>
                    <SelectItem value="devnet" className="text-white focus:bg-gray-700 focus:text-white">
                      Devnet
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-0">
              <div className="p-4">
                <h2 className="text-lg font-medium mb-2 text-white">Connection Settings</h2>
              </div>
              <Separator className="bg-gray-800" />

              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center">
                  <Bluetooth className="h-5 w-5 mr-3 text-blue-400" />
                  <div>
                    <p className="font-medium text-white">Bluetooth Payments</p>
                    <p className="text-xs text-gray-400">Enable offline payments via Bluetooth</p>
                  </div>
                </div>
                <Switch
                  checked={bluetoothEnabled}
                  onCheckedChange={toggleBluetooth}
                  className="data-[state=checked]:bg-blue-600"
                />
              </div>

              <Separator className="bg-gray-800" />

              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center">
                  <Globe className="h-5 w-5 mr-3 text-green-400" />
                  <div>
                    <p className="font-medium text-white">Offline Mode</p>
                    <p className="text-xs text-gray-400">Store transactions locally when offline</p>
                  </div>
                </div>
                <Switch
                  checked={offlineMode}
                  onCheckedChange={toggleOfflineMode}
                  className="data-[state=checked]:bg-green-600"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-0">
              <div className="p-4">
                <h2 className="text-lg font-medium mb-2 text-white">Security</h2>
              </div>
              <Separator className="bg-gray-800" />

              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center">
                  <Shield className="h-5 w-5 mr-3 text-red-400" />
                  <p className="font-medium text-white">Security Settings</p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>

              <Separator className="bg-gray-800" />

              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center">
                  <Smartphone className="h-5 w-5 mr-3 text-purple-400" />
                  <div>
                    <p className="font-medium text-white">Biometric Authentication</p>
                    <p className="text-xs text-gray-400">Use fingerprint or Face ID</p>
                  </div>
                </div>
                <Switch
                  checked={biometricAuth}
                  onCheckedChange={toggleBiometricAuth}
                  className="data-[state=checked]:bg-purple-600"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-0">
              <div className="p-4">
                <h2 className="text-lg font-medium mb-2 text-white">Data & Sync</h2>
              </div>
              <Separator className="bg-gray-800" />

              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center">
                  <Database className="h-5 w-5 mr-3 text-amber-400" />
                  <div>
                    <p className="font-medium text-white">Sync Transaction History</p>
                    <p className="text-xs text-gray-400">Keep transaction history in sync across devices</p>
                  </div>
                </div>
                <Switch
                  checked={dataSync}
                  onCheckedChange={toggleDataSync}
                  className="data-[state=checked]:bg-amber-600"
                />
              </div>

              <Separator className="bg-gray-800" />

              <div className="p-4">
                <Button
                  variant="outline"
                  className="w-full border-gray-700 text-white hover:bg-gray-800"
                  onClick={clearCache}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Clearing...
                    </>
                  ) : (
                    "Clear Local Cache"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="text-center mt-8">
            <p className="text-xs text-gray-400">Aptos Pay v1.0.0</p>
            <p className="text-xs text-gray-400">Running on Aptos {network}</p>
          </div>
        </div>
      </main>
    </div>
  )
}

