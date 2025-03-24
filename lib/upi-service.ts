export interface BankAccount {
  id: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  accountHolderName: string;
  isDefault: boolean;
  balance: number;
  lastUpdated: Date;
}

export interface UPITransaction {
  id: string;
  type: 'CREDIT' | 'DEBIT';
  amount: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  timestamp: Date;
  senderAccount: string;
  receiverAccount: string;
  description: string;
  referenceId: string;
}

export interface UPIProfile {
  upiId: string;
  name: string;
  phoneNumber: string;
  email: string;
  defaultAccount: string;
  accounts: BankAccount[];
  transactions: UPITransaction[];
}

class UPIService {
  private upiProfile: UPIProfile | null = null;
  private static instance: UPIService;

  private constructor() {
    this.loadUPIProfile();
  }

  static getInstance(): UPIService {
    if (!UPIService.instance) {
      UPIService.instance = new UPIService();
    }
    return UPIService.instance;
  }

  private loadUPIProfile(): void {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('upiProfile');
      if (stored) {
        try {
          this.upiProfile = JSON.parse(stored);
        } catch (error) {
          console.error('Failed to load UPI profile:', error);
        }
      }
    }
  }

  private saveUPIProfile(): void {
    if (typeof localStorage !== 'undefined' && this.upiProfile) {
      localStorage.setItem('upiProfile', JSON.stringify(this.upiProfile));
    }
  }

  async createUPIProfile(data: {
    name: string;
    phoneNumber: string;
    email: string;
    defaultAccount: BankAccount;
  }): Promise<UPIProfile> {
    const upiId = `${data.phoneNumber}@aptospay`;
    this.upiProfile = {
      upiId,
      name: data.name,
      phoneNumber: data.phoneNumber,
      email: data.email,
      defaultAccount: data.defaultAccount.id,
      accounts: [data.defaultAccount],
      transactions: [],
    };
    this.saveUPIProfile();
    return this.upiProfile;
  }

  async addBankAccount(account: BankAccount): Promise<void> {
    if (!this.upiProfile) {
      throw new Error('UPI profile not initialized');
    }
    this.upiProfile.accounts.push(account);
    this.saveUPIProfile();
  }

  async setDefaultAccount(accountId: string): Promise<void> {
    if (!this.upiProfile) {
      throw new Error('UPI profile not initialized');
    }
    this.upiProfile.defaultAccount = accountId;
    this.saveUPIProfile();
  }

  async initiatePayment(data: {
    amount: number;
    receiverUPIId: string;
    description: string;
    accountId: string;
  }): Promise<UPITransaction> {
    if (!this.upiProfile) {
      throw new Error('UPI profile not initialized');
    }

    const senderAccount = this.upiProfile.accounts.find(acc => acc.id === data.accountId);
    if (!senderAccount) {
      throw new Error('Sender account not found');
    }

    if (senderAccount.balance < data.amount) {
      throw new Error('Insufficient balance');
    }

    const transaction: UPITransaction = {
      id: `TXN_${Date.now()}`,
      type: 'DEBIT',
      amount: data.amount,
      status: 'PENDING',
      timestamp: new Date(),
      senderAccount: data.accountId,
      receiverAccount: data.receiverUPIId,
      description: data.description,
      referenceId: `REF_${Date.now()}`,
    };

    // In a real implementation, this would communicate with the bank's API
    // For now, we'll simulate the transaction
    await this.simulateTransaction(transaction);

    this.upiProfile.transactions.push(transaction);
    senderAccount.balance -= data.amount;
    senderAccount.lastUpdated = new Date();
    this.saveUPIProfile();

    return transaction;
  }

  async initiateCollect(data: {
    amount: number;
    payerUPIId: string;
    description: string;
    accountId: string;
  }): Promise<UPITransaction> {
    if (!this.upiProfile) {
      throw new Error('UPI profile not initialized');
    }

    const receiverAccount = this.upiProfile.accounts.find(acc => acc.id === data.accountId);
    if (!receiverAccount) {
      throw new Error('Receiver account not found');
    }

    const transaction: UPITransaction = {
      id: `TXN_${Date.now()}`,
      type: 'CREDIT',
      amount: data.amount,
      status: 'PENDING',
      timestamp: new Date(),
      senderAccount: data.payerUPIId,
      receiverAccount: data.accountId,
      description: data.description,
      referenceId: `REF_${Date.now()}`,
    };

    // In a real implementation, this would create a collect request
    // For now, we'll simulate the transaction
    await this.simulateTransaction(transaction);

    this.upiProfile.transactions.push(transaction);
    receiverAccount.balance += data.amount;
    receiverAccount.lastUpdated = new Date();
    this.saveUPIProfile();

    return transaction;
  }

  private async simulateTransaction(transaction: UPITransaction): Promise<void> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    transaction.status = 'COMPLETED';
  }

  getUPIProfile(): UPIProfile | null {
    return this.upiProfile;
  }

  getBankAccounts(): BankAccount[] {
    return this.upiProfile?.accounts || [];
  }

  getTransactions(): UPITransaction[] {
    return this.upiProfile?.transactions || [];
  }

  getAccountBalance(accountId: string): number {
    const account = this.upiProfile?.accounts.find(acc => acc.id === accountId);
    return account?.balance || 0;
  }
}

export const upiService = UPIService.getInstance(); 