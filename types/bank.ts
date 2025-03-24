export interface BankAccount {
  id: string
  bankName: string
  accountType: string
  balance: number
  lastUpdated: string
  isPrimary?: boolean
}

export interface Transaction {
  id: string
  type: "sent" | "received"
  amount: number
  recipientOrSender: string
  date: string
  status: "completed" | "pending" | "failed"
}

export interface NavigationItem {
  href: string
  icon: any
  label: string
  active?: boolean
  special?: boolean
  onClick: () => void
}
