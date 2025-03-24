"use client"

import { useEffect, useRef } from "react"
import QRCodeStyling from "qr-code-styling"
import { useTheme } from "next-themes"

interface QRCodeProps {
  data: string
  size?: number
  logo?: string
  logoSize?: number
  className?: string
}

export function QRCode({ data, size = 300, logo, logoSize = 80, className }: QRCodeProps) {
  const ref = useRef<HTMLDivElement>(null)
  const qrCodeRef = useRef<QRCodeStyling | null>(null)
  const { theme } = useTheme()

  useEffect(() => {
    if (!ref.current) return

    const isDark = theme === "dark"

    if (!qrCodeRef.current) {
      qrCodeRef.current = new QRCodeStyling({
        width: size,
        height: size,
        type: "svg",
        data,
        dotsOptions: {
          color: isDark ? "#ffffff" : "#000000",
          type: "rounded",
        },
        cornersSquareOptions: {
          type: "extra-rounded",
          color: isDark ? "#ffffff" : "#000000",
        },
        cornersDotOptions: {
          type: "dot",
          color: isDark ? "#ffffff" : "#000000",
        },
        backgroundOptions: {
          color: isDark ? "#000000" : "#ffffff",
        },
        imageOptions: {
          crossOrigin: "anonymous",
          margin: 10,
        },
      })

      qrCodeRef.current.append(ref.current)
    } else {
      qrCodeRef.current.update({
        data,
        dotsOptions: {
          color: isDark ? "#ffffff" : "#000000",
        },
        cornersSquareOptions: {
          color: isDark ? "#ffffff" : "#000000",
        },
        cornersDotOptions: {
          color: isDark ? "#ffffff" : "#000000",
        },
        backgroundOptions: {
          color: isDark ? "#000000" : "#ffffff",
        },
      })
    }

    // Add logo if provided
    if (logo) {
      qrCodeRef.current.update({
        image: logo,
        imageOptions: {
          crossOrigin: "anonymous",
          margin: 10,
          imageSize: logoSize,
        },
      })
    }
  }, [data, size, logo, logoSize, theme])

  return <div ref={ref} className={className} />
}

