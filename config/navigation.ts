import {
  Home,
  Send,
  Wallet,
  ArrowDownToLine,
  User,
  Settings,
  History,
  CreditCard
} from "lucide-react"
import Cookies from "js-cookie"
import type { NavigationItem } from "@/types/bank"

const handleAuthenticatedNavigation = (path: string) => {
  const authStatus = Cookies.get("auth-status")
  if (authStatus === "authenticated") {
    window.location.href = path
  } else {
    window.location.href = "/login"
  }
}

export const dashboardNavItems: NavigationItem[] = [
  {
    href: "/dashboard",
    icon: Home,
    label: "Home",
    active: true,
    onClick: () => handleAuthenticatedNavigation("/dashboard")
  },
  {
    href: "/balance",
    icon: Wallet,
    label: "Balance",
    active: false,
    onClick: () => handleAuthenticatedNavigation("/balance")
  },
  {
    href: "/balance/send",
    icon: Send,
    label: "Send",
    active: false,
    onClick: () => handleAuthenticatedNavigation("/balance/send")
  },
  {
    href: "/balance/receive",
    icon: ArrowDownToLine,
    label: "Receive",
    active: false,
    onClick: () => handleAuthenticatedNavigation("/balance/receive")
  },
  {
    href: "/profileboard",
    icon: User,
    label: "Profile",
    active: false,
    onClick: () => handleAuthenticatedNavigation("/profileboard")
  }
]
