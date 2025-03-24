"use client"

import { motion } from "framer-motion"

export default function PaymentLogo() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative w-20 h-20"
    >
      {/* Main circle */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
        animate={{
          scale: [1, 1.05, 1],
          boxShadow: [
            "0 0 0 0 rgba(59, 130, 246, 0.4)",
            "0 0 0 10px rgba(59, 130, 246, 0)",
          ],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      {/* Payment symbol */}
      <motion.svg
        viewBox="0 0 24 24"
        className="absolute inset-0 w-full h-full p-4"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        <motion.path
          d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z"
          fill="white"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{
            duration: 1.5,
            ease: "easeInOut",
          }}
        />
      </motion.svg>

      {/* Orbiting circles */}
      <motion.div
        className="absolute top-0 left-0 w-4 h-4 bg-green-400 rounded-full"
        animate={{
          rotate: 360,
          x: [0, 10, 0],
          y: [0, 10, 0],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "linear",
        }}
      />
      <motion.div
        className="absolute bottom-0 right-0 w-3 h-3 bg-purple-400 rounded-full"
        animate={{
          rotate: -360,
          x: [0, -10, 0],
          y: [0, -10, 0],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: "linear",
        }}
      />
    </motion.div>
  )
} 