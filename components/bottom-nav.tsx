"use client"

import { motion } from "framer-motion"
import { NavigationItem } from "@/types/bank"
import { useRouter } from "next/navigation"
import { Home, Send, Download, User, Wallet } from "lucide-react"

interface BottomNavProps {
  // No props needed
}

export function BottomNav() {
  const router = useRouter()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-10 bg-black/40 backdrop-blur-xl border-t border-white/5">
      <div className="container max-w-md mx-auto">
        <div className="grid grid-cols-5 gap-1">
          <div
            className="flex flex-col items-center py-3 cursor-pointer"
            onClick={() => router.push("/dashboard")}
          >
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="flex flex-col items-center"
            >
              <Home className="h-6 w-6 text-white" />
              <span className="text-sm text-white">Home</span>
            </motion.div>
          </div>
          <div
            className="flex flex-col items-center py-3 cursor-pointer"
            onClick={() => router.push("/balance")}
          >
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="flex flex-col items-center"
            >
              <Wallet className="h-6 w-6 text-white" />
              <span className="text-sm text-white">Balance</span>
            </motion.div>
          </div>
          <div
            className="flex flex-col items-center py-3 cursor-pointer"
            onClick={() => router.push("/balance/send")}
          >
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="flex flex-col items-center"
            >
              <Send className="h-6 w-6 text-white" />
              <span className="text-sm text-white">Send</span>
            </motion.div>
          </div>
          <div
            className="flex flex-col items-center py-3 cursor-pointer"
            onClick={() => router.push("/balance/receive")}
          >
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="flex flex-col items-center"
            >
              <Download className="h-6 w-6 text-white" />
              <span className="text-sm text-white">Receive</span>
            </motion.div>
          </div>
          <div
            className="flex flex-col items-center py-3 cursor-pointer"
            onClick={() => router.push("/profileboard")}
          >
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="flex flex-col items-center"
            >
              <User className="h-6 w-6 text-white" />
              <span className="text-sm text-white">Profile</span>
            </motion.div>
          </div>
        </div>
      </div>
    </nav>
  )
}
