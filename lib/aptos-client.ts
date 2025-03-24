import { AptosClient as AptosSDKClient, AptosAccount, HexString, type Types } from "aptos"

export type TransactionStatus = "pending" | "completed" | "failed"

export interface Transaction {
  hash: string
  sender: string
  recipient: string
  amount: string
  timestamp: number
  status: TransactionStatus
  note?: string
  paymentMethod?: string
}

export interface WalletInfo {
  address: string
  balance: string
  publicKey: string
}

export class AptosClient {
  private client: AptosSDKClient
  private account: AptosAccount | null = null
  private networkType: "mainnet" | "testnet" | "devnet" = "devnet"
  private endpoints = {
    mainnet: "https://fullnode.mainnet.aptoslabs.com/v1",
    testnet: "https://fullnode.testnet.aptoslabs.com/v1",
    devnet: "https://fullnode.devnet.aptoslabs.com/v1",
  }

  constructor(network: "mainnet" | "testnet" | "devnet" = "devnet") {
    this.networkType = network
    this.client = new AptosSDKClient(this.endpoints[network])
  }

  // Switch network
  switchNetwork(network: "mainnet" | "testnet" | "devnet") {
    this.networkType = network
    this.client = new AptosSDKClient(this.endpoints[network])
  }

  // Connect to wallet using private key (for development only)
  connectWithPrivateKey(privateKey: string): WalletInfo {
    try {
      const hexKey = new HexString(privateKey)
      this.account = new AptosAccount(hexKey.toUint8Array())

      return {
        address: this.account.address().hex(),
        balance: "0", // Will be fetched separately
        publicKey: this.account.pubKey().hex(),
      }
    } catch (error) {
      console.error("Failed to connect with private key:", error)
      throw new Error("Invalid private key")
    }
  }

  // Connect to Petra wallet
  async connectPetraWallet(): Promise<WalletInfo> {
    try {
      // @ts-ignore - Petra wallet types
      if (typeof window === "undefined" || !window.petra) {
        throw new Error("Petra wallet not found")
      }

      // @ts-ignore - Petra wallet types
      const wallet = window.petra
      await wallet.connect()
      const account = await wallet.account()

      return {
        address: account.address,
        balance: "0", // Will be fetched separately
        publicKey: account.publicKey,
      }
    } catch (error) {
      console.error("Failed to connect to Petra wallet:", error)
      throw error
    }
  }

  // Get wallet balance
  async getBalance(address: string): Promise<string> {
    try {
      const resources = await this.client.getAccountResources(address)
      const accountResource = resources.find((r) => r.type === "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>")

      if (!accountResource) return "0"
      // @ts-ignore - We know this exists
      const balance = accountResource.data.coin.value
      // Convert from octas (10^8) to APT
      return (Number.parseInt(balance) / 100000000).toFixed(2)
    } catch (error) {
      console.error("Failed to get balance:", error)
      return "0"
    }
  }

  // Send APT tokens
  async sendAPT(senderAddress: string, recipientAddress: string, amount: string, note?: string): Promise<Transaction> {
    try {
      // Convert amount to octas (APT * 10^8)
      const amountInOctas = (Number.parseFloat(amount) * 100000000).toString()

      // Create payload
      const payload = {
        type: "entry_function_payload",
        function: "0x1::coin::transfer",
        type_arguments: ["0x1::aptos_coin::AptosCoin"],
        arguments: [recipientAddress, amountInOctas],
      }

      // @ts-ignore - Petra wallet types
      if (typeof window !== "undefined" && window.petra) {
        // @ts-ignore - Petra wallet types
        const wallet = window.petra
        const response = await wallet.signAndSubmitTransaction(payload)

        // Wait for transaction
        const txnResult = await this.client.waitForTransactionWithResult(response.hash)

        return {
          hash: response.hash,
          sender: senderAddress,
          recipient: recipientAddress,
          amount,
          timestamp: Date.now(),
          status: txnResult.success ? "completed" : "failed",
          note,
          paymentMethod: "wallet",
        }
      } else if (this.account) {
        // Using local account (for development)
        const txnRequest = await this.client.generateTransaction(this.account.address(), payload)

        const signedTxn = await this.client.signTransaction(this.account, txnRequest)

        const txnResult = await this.client.submitTransaction(signedTxn)
        await this.client.waitForTransaction(txnResult.hash)

        return {
          hash: txnResult.hash,
          sender: senderAddress,
          recipient: recipientAddress,
          amount,
          timestamp: Date.now(),
          status: "completed",
          note,
          paymentMethod: "wallet",
        }
      } else {
        throw new Error("No wallet connected")
      }
    } catch (error) {
      console.error("Transaction failed:", error)
      throw error
    }
  }

  // Get transaction history
  async getTransactionHistory(address: string): Promise<Transaction[]> {
    try {
      const transactions = await this.client.getAccountTransactions(address)

      return transactions
        .filter((tx) => {
          // Filter for coin transfer transactions
          if (tx.type !== "user_transaction") return false

          const payload = tx.payload as Types.TransactionPayload_EntryFunctionPayload
          return payload.function === "0x1::coin::transfer"
        })
        .map((tx) => {
          const payload = tx.payload as Types.TransactionPayload_EntryFunctionPayload
          const recipient = payload.arguments[0] as string
          const amount = payload.arguments[1] as string

          // Convert from octas to APT
          const amountInAPT = (Number.parseInt(amount) / 100000000).toFixed(2)

          return {
            hash: tx.hash,
            sender: tx.sender,
            recipient,
            amount: amountInAPT,
            timestamp: Number.parseInt(tx.timestamp) * 1000, // Convert to milliseconds
            status: tx.success ? "completed" : "failed",
            paymentMethod: "wallet",
          }
        })
    } catch (error) {
      console.error("Failed to get transaction history:", error)
      return []
    }
  }

  // Create offline transaction payload
  async createOfflineTransaction(
    senderAddress: string,
    recipientAddress: string,
    amount: string,
    note?: string,
  ): Promise<string> {
    // Convert amount to octas (APT * 10^8)
    const amountInOctas = (Number.parseFloat(amount) * 100000000).toString()

    // Create transaction payload
    const payload = {
      type: "entry_function_payload",
      function: "0x1::coin::transfer",
      type_arguments: ["0x1::aptos_coin::AptosCoin"],
      arguments: [recipientAddress, amountInOctas],
    }

    // Add metadata for offline transaction
    const offlinePayload = {
      payload,
      sender: senderAddress,
      recipient: recipientAddress,
      amount,
      note,
      timestamp: Date.now(),
      nonce: Math.floor(Math.random() * 1000000),
    }

    return JSON.stringify(offlinePayload)
  }

  // Process received offline transaction
  async processOfflineTransaction(transactionData: string): Promise<Transaction> {
    const offlinePayload = JSON.parse(transactionData)

    // In a real implementation, we would verify the signature
    // and then submit the transaction to the blockchain

    // For now, we'll just return a pending transaction
    return {
      hash: "0x" + Math.random().toString(16).slice(2, 66),
      sender: offlinePayload.sender,
      recipient: offlinePayload.recipient,
      amount: offlinePayload.amount,
      timestamp: offlinePayload.timestamp,
      status: "pending",
      note: offlinePayload.note,
      paymentMethod: "wallet",
    }
  }

  // Get network explorer URL
  getExplorerURL(txHash: string): string {
    const explorers = {
      mainnet: "https://explorer.aptoslabs.com/txn/",
      testnet: "https://explorer.aptoslabs.com/txn/",
      devnet: "https://explorer.aptoslabs.com/txn/",
    }

    return `${explorers[this.networkType]}${txHash}?network=${this.networkType}`
  }
}

// Create a singleton instance
export const aptosClient = new AptosClient()

