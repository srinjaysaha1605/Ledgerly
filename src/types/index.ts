export type AccountType = 
  | 'bank' 
  | 'savings' 
  | 'credit' 
  | 'debit' 
  | 'cash' 
  | 'investment' 
  | 'loan';

export type AccountStatus = 'active' | 'inactive';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  openingBalance: number;
  currentBalance: number;
  status: AccountStatus;
  color: string;
  icon: string;
  accountNumber?: string;
  isFavorite?: boolean;
}

export type TransactionType = 'income' | 'expense' | 'transfer';

export interface Transaction {
  id: string;
  date: string; // ISO string YYYY-MM-DD
  amount: number;
  type: TransactionType;
  title: string; // Merchant or Source
  merchant?: string;
  source?: string;
  category: string;
  subcategory?: string;
  accountId: string; // Payment or Destination Account ID
  toAccountId?: string; // For transfers
  notes?: string;
  tags: string[];
  receiptUrl?: string; // Base64 or image URL
  isRecurring?: boolean;
  recurringFrequency?: 'weekly' | 'monthly' | 'yearly';
}

export interface Budget {
  id: string;
  category: string;
  monthlyLimit: number;
  period: string; // e.g. "2026-07"
  alertThreshold: number; // e.g., 80 for 80%
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentProgress: number;
  deadline: string; // YYYY-MM-DD
  category?: string;
  color: string;
  icon: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
  isCustom?: boolean;
}

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  contactNumber: string;
  guardianContact?: string;
  currency: string;
  currencySymbol: string;
  avatarUrl?: string;
  isEmailVerified: boolean;
  joinedDate: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'alert' | 'success';
  date: string;
  read: boolean;
  actionUrl?: string;
}

export interface SmartInsight {
  id: string;
  title: string;
  description: string;
  type: 'positive' | 'warning' | 'tip' | 'milestone';
  icon: string;
  badge: string;
  impactValue?: string;
}

export interface UndoAction {
  id: string;
  transaction: Transaction;
  timestamp: number;
}

export type DashboardWidgetId = 
  | 'metrics' 
  | 'quickAdd' 
  | 'cashFlowChart' 
  | 'budgetProgress' 
  | 'recentTransactions' 
  | 'upcomingRecurring' 
  | 'insights' 
  | 'goalsOverview';
