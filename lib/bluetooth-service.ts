import { useState, useEffect } from "react"

export interface BluetoothDevice {
  id: string
  name?: string
  address?: string // Aptos wallet address if available
  gatt?: {
    connected: boolean
    connect(): Promise<BluetoothRemoteGATTServer>
    disconnect(): void
  }
}

export interface BluetoothTransactionPayload {
  type: "payment" | "request" | "sync"
  sender: string
  recipient: string
  amount: string
  note?: string
  timestamp: number
  nonce: number
  signature?: string
  paymentMethod: string
}

export interface BluetoothRemoteGATTServer {
  getPrimaryService(service: string): Promise<BluetoothRemoteGATTService>
}

export interface BluetoothRemoteGATTService {
  getCharacteristic(characteristic: string): Promise<BluetoothRemoteGATTCharacteristic>
}

export interface BluetoothRemoteGATTCharacteristic {
  value: DataView | null
  startNotifications(): Promise<BluetoothRemoteGATTCharacteristic>
  writeValue(data: Uint8Array): Promise<void>
  addEventListener(type: string, listener: (event: Event) => void): void
  removeEventListener(type: string, listener: (event: Event) => void): void
}

declare global {
  interface Navigator {
    bluetooth: {
      requestDevice(options: {
        filters: Array<{ services: string[] }>
      }): Promise<BluetoothDevice>
    }
  }
}

export class BluetoothService {
  private device: BluetoothDevice | null = null;
  private characteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private isEnabled: boolean = false;
  private pendingTransactions: BluetoothTransactionPayload[] = []
  private discoveredDevices: BluetoothDevice[] = []
  private listeners: Map<string, ((data: any) => void)[]> = new Map()
  private transactionCallback: ((data: any) => void) | null = null;
  private successfulTransactions: BluetoothTransactionPayload[] = []

  constructor() {
    // Check if Bluetooth is available
    if (!navigator.bluetooth) {
      console.warn('Bluetooth is not supported in this browser');
    }

    // Load pending transactions from local storage
    this.loadPendingTransactions()
  }

  async enable(): Promise<boolean> {
    try {
      if (!navigator.bluetooth) {
        throw new Error("Bluetooth not supported");
      }

      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: ["0000180f-0000-1000-8000-00805f9b34fb"] }], // Replace with your service UUID
      });

      this.device = device;
      if (!device.gatt) {
        throw new Error("GATT server not available");
      }

      const server = await device.gatt.connect();
      const service = await server.getPrimaryService("0000180f-0000-1000-8000-00805f9b34fb");
      this.characteristic = await service.getCharacteristic("00002a19-0000-1000-8000-00805f9b34fb");

      if (this.characteristic) {
        await this.characteristic.startNotifications();
        this.setupTransactionListener();
        this.isEnabled = true;
        return true;
      }

      return false;
    } catch (error) {
      console.error("Failed to enable Bluetooth:", error);
      return false;
    }
  }

  disable(): void {
    if (this.characteristic) {
      this.characteristic.removeEventListener("characteristicvaluechanged", this.handleTransaction);
      this.characteristic = null;
    }
    if (this.device?.gatt) {
      this.device.gatt.disconnect();
      this.device = null;
    }
    this.isEnabled = false;
    this.transactionCallback = null;
  }

  isBluetoothEnabled(): boolean {
    return this.isEnabled;
  }

  async scanForDevices(): Promise<BluetoothDevice[]> {
    if (!this.isEnabled) {
      await this.enable()
    }

    if (!this.isEnabled) {
      throw new Error("Bluetooth is not enabled")
    }

    try {
      // In a real implementation, this would scan for nearby Bluetooth devices
      // For now, we'll simulate discovered devices
      this.discoveredDevices = [
        { id: "device1", name: "iPhone 13" },
        { id: "device2", name: "Samsung Galaxy S21" },
        { id: "device3", name: "Google Pixel 6" },
        { id: "device4", name: "Aptos Wallet", address: "0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t" },
      ]

      return this.discoveredDevices
    } catch (error) {
      console.error("Failed to scan for devices:", error)
      return []
    }
  }

  async connectToDevice(deviceId: string): Promise<BluetoothDevice | null> {
    if (!this.isEnabled) {
      throw new Error("Bluetooth is not enabled")
    }

    try {
      // Find the device in discovered devices
      const device = this.discoveredDevices.find((d) => d.id === deviceId)

      if (!device) {
        throw new Error("Device not found")
      }

      // In a real implementation, this would establish a Bluetooth connection
      this.device = device

      // Emit connection event
      this.emit("connected", device)

      return device
    } catch (error) {
      console.error("Failed to connect to device:", error)
      return null
    }
  }

  async sendTransaction(data: any): Promise<boolean> {
    if (!this.characteristic || !this.isEnabled) {
      return false;
    }

    try {
      const encoder = new TextEncoder();
      const buffer = encoder.encode(JSON.stringify(data));
      await this.characteristic.writeValue(new Uint8Array(buffer));
      return true;
    } catch (error) {
      console.error("Failed to send transaction:", error);
      return false;
    }
  }

  listenForTransactions(callback: (data: any) => void): void {
    this.transactionCallback = callback;
  }

  private setupTransactionListener(): void {
    if (this.characteristic) {
      this.characteristic.addEventListener("characteristicvaluechanged", this.handleTransaction);
    }
  }

  private handleTransaction = (event: Event): void => {
    const target = event.target as unknown as BluetoothRemoteGATTCharacteristic;
    if (!target?.value) {
      console.error("Invalid transaction data received");
      return;
    }

    try {
      const data = JSON.parse(new TextDecoder().decode(new Uint8Array(target.value.buffer)));
      if (this.transactionCallback) {
        this.transactionCallback(data);
      }
    } catch (error) {
      console.error("Failed to parse transaction data:", error);
    }
  };

  // Process pending transactions
  async processPendingTransactions(): Promise<number> {
    if (!this.isEnabled || !this.device) {
      return 0
    }

    const initialCount = this.pendingTransactions.length
    const successfulTransactions: BluetoothTransactionPayload[] = []

    for (const transaction of this.pendingTransactions) {
      try {
        // Attempt to send the transaction
        const success = await this.sendTransaction(transaction)

        if (success) {
          successfulTransactions.push(transaction)
        }
      } catch (error) {
        console.error("Failed to process pending transaction:", error)
      }
    }

    // Remove successful transactions from pending list
    this.pendingTransactions = this.pendingTransactions.filter((tx) => !successfulTransactions.includes(tx))

    this.savePendingTransactions(successfulTransactions)

    return successfulTransactions.length
  }

  // Get pending transactions
  getPendingTransactions(): BluetoothTransactionPayload[] {
    return [...this.pendingTransactions]
  }

  // Clear pending transactions
  clearPendingTransactions(): void {
    this.pendingTransactions = []
    this.savePendingTransactions([])
  }

  private savePendingTransactions(transactions: BluetoothTransactionPayload[]) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('bluetooth_pending_transactions', JSON.stringify(transactions))
      }
    } catch (error) {
      console.error('Failed to save pending transactions:', error)
    }
  }

  private loadPendingTransactions(): BluetoothTransactionPayload[] {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = localStorage.getItem('bluetooth_pending_transactions')
        return saved ? JSON.parse(saved) : []
      }
      return []
    } catch (error) {
      console.error('Failed to load pending transactions:', error)
      return []
    }
  }

  on(event: string, callback: (data: any) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event)?.push(callback)
  }

  off(event: string, callback: (data: any) => void): void {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      const index = callbacks.indexOf(callback)
      if (index !== -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  private emit(event: string, data: any): void {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      callbacks.forEach((callback) => callback(data))
    }
  }

  getSuccessfulTransactions(): BluetoothTransactionPayload[] {
    return [...this.successfulTransactions]
  }

  addSuccessfulTransaction(transaction: BluetoothTransactionPayload): void {
    this.successfulTransactions.push(transaction)
  }
}

// Create a singleton instance
export const bluetoothService = new BluetoothService()

export function useBluetooth() {
  const [isEnabled, setIsEnabled] = useState(false)

  useEffect(() => {
    const checkBluetoothStatus = () => {
      setIsEnabled(bluetoothService.isBluetoothEnabled())
    }

    checkBluetoothStatus()
    const interval = setInterval(checkBluetoothStatus, 1000)

    return () => clearInterval(interval)
  }, [])

  const enable = async () => {
    const enabled = await bluetoothService.enable()
    setIsEnabled(enabled)
    return enabled
  }

  const disable = () => {
    bluetoothService.disable()
    setIsEnabled(false)
  }

  return {
    isEnabled,
    enable,
    disable,
    scanForDevices: bluetoothService.scanForDevices.bind(bluetoothService),
    connectToDevice: bluetoothService.connectToDevice.bind(bluetoothService),
    sendTransaction: bluetoothService.sendTransaction.bind(bluetoothService),
    listenForTransactions: bluetoothService.listenForTransactions.bind(bluetoothService),
  }
}

