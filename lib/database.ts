// This is a simplified database client
// In a real app, you would use a proper database like Supabase or Firebase

import type { Transaction } from "./aptos-client"

export interface User {
  id: string
  email: string
  name: string
  password?: string // Hashed password for email login
  authProvider: 'email' | 'google'
  profilePicture?: string
  createdAt: Date
  lastLogin: Date
}

export interface Contact {
  id: string
  name: string
  walletAddress: string
  upiId?: string
  profilePicture?: string
}

class DatabaseClient {
  private storage: Storage | null = null
  private isInitialized = false
  private serverStorage: Map<string, string> = new Map()

  constructor() {
    // Initialize storage if in browser environment
    if (typeof window !== "undefined") {
      this.storage = window.localStorage
      this.isInitialized = true
    }
  }

  private getStorage(): Storage | Map<string, string> {
    return this.storage || this.serverStorage
  }

  private setItem(key: string, value: string): void {
    const storage = this.getStorage()
    if (storage instanceof Map) {
      storage.set(key, value)
    } else {
      storage.setItem(key, value)
    }
  }

  private getItem(key: string): string | null {
    const storage = this.getStorage()
    if (storage instanceof Map) {
      return storage.get(key) || null
    }
    return storage.getItem(key)
  }

  private removeItem(key: string): void {
    const storage = this.getStorage()
    if (storage instanceof Map) {
      storage.delete(key)
    } else {
      storage.removeItem(key)
    }
  }

  private clear(): void {
    const storage = this.getStorage()
    if (storage instanceof Map) {
      storage.clear()
    } else {
      storage.clear()
    }
  }

  // User Authentication Methods
  async createUser(user: Omit<User, 'id' | 'createdAt' | 'lastLogin'>): Promise<User> {
    const users = await this.getUsers()
    const existingUser = users.find(u => u.email === user.email)
    
    if (existingUser) {
      throw new Error("User already exists")
    }

    const newUser: User = {
      ...user,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      lastLogin: new Date()
    }

    users.push(newUser)
    this.setItem("users", JSON.stringify(users))
    return newUser
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const users = await this.getUsers()
    const user = users.find(u => u.email === email)
    if (!user) return null
    
    // Convert date strings back to Date objects
    return {
      ...user,
      createdAt: new Date(user.createdAt),
      lastLogin: new Date(user.lastLogin)
    }
  }

  async updateUser(userId: string, updates: Partial<Omit<User, 'id'>>): Promise<User> {
    const users = await this.getUsers()
    const userIndex = users.findIndex(u => u.id === userId)
    
    if (userIndex === -1) {
      throw new Error("User not found")
    }

    const updatedUser = {
      ...users[userIndex],
      ...updates,
      lastLogin: new Date()
    }

    users[userIndex] = updatedUser
    this.setItem("users", JSON.stringify(users))
    return updatedUser
  }

  async getUsers(): Promise<User[]> {
    const usersData = this.getItem("users")
    if (!usersData) return []

    const users = JSON.parse(usersData) as User[]
    return users.map(user => ({
      ...user,
      createdAt: new Date(user.createdAt),
      lastLogin: new Date(user.lastLogin)
    }))
  }

  // Save user profile
  async saveUserProfile(user: User): Promise<User> {
    const users = await this.getUsers()
    const userIndex = users.findIndex(u => u.id === user.id)
    
    if (userIndex === -1) {
      throw new Error("User not found")
    }

    users[userIndex] = user
    this.setItem("users", JSON.stringify(users))
    return user
  }

  // Get user profile
  async getUserProfile(userId: string): Promise<User | null> {
    const users = await this.getUsers()
    const user = users.find(u => u.id === userId)
    if (!user) return null

    return {
      ...user,
      createdAt: new Date(user.createdAt),
      lastLogin: new Date(user.lastLogin)
    }
  }

  // Contact Management
  async getContacts(userId: string): Promise<Contact[]> {
    const contactsData = this.getItem(`contacts_${userId}`)
    if (!contactsData) return []

    return JSON.parse(contactsData) as Contact[]
  }

  async addContact(userId: string, contact: Omit<Contact, 'id'>): Promise<Contact> {
    const contacts = await this.getContacts(userId)
    const newContact: Contact = {
      ...contact,
      id: crypto.randomUUID()
    }

    contacts.push(newContact)
    this.setItem(`contacts_${userId}`, JSON.stringify(contacts))
    return newContact
  }

  async updateContact(userId: string, contactId: string, updates: Partial<Contact>): Promise<Contact> {
    const contacts = await this.getContacts(userId)
    const contactIndex = contacts.findIndex(c => c.id === contactId)
    
    if (contactIndex === -1) {
      throw new Error("Contact not found")
    }

    contacts[contactIndex] = {
      ...contacts[contactIndex],
      ...updates
    }

    this.setItem(`contacts_${userId}`, JSON.stringify(contacts))
    return contacts[contactIndex]
  }

  async deleteContact(userId: string, contactId: string): Promise<void> {
    const contacts = await this.getContacts(userId)
    const filteredContacts = contacts.filter(c => c.id !== contactId)
    this.setItem(`contacts_${userId}`, JSON.stringify(filteredContacts))
  }

  // Save transaction locally (for offline mode)
  async saveTransaction(transaction: Transaction): Promise<Transaction> {
    const transactions = await this.getLocalTransactions()
    transactions.push(transaction)

    this.setItem("local_transactions", JSON.stringify(transactions))
    return transaction
  }

  // Get locally stored transactions
  async getLocalTransactions(): Promise<Transaction[]> {
    const transactionsData = this.getItem("local_transactions")
    if (!transactionsData) return []

    return JSON.parse(transactionsData) as Transaction[]
  }

  // Clear pending transactions
  async clearPendingTransactions(): Promise<void> {
    this.removeItem("local_transactions")
  }

  // Clear all local data
  async clearAllData(): Promise<void> {
    this.clear()
  }
}

export const db = new DatabaseClient()

