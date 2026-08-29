import { Account, Transaction, Budget, Goal, Category, UserProfile, Notification, SmartInsight } from '../types';

export const initialProfile: UserProfile = {
  id: '',
  fullName: '',
  email: '',
  currency: 'USD',
  currencySymbol: '$',
  isEmailVerified: false,
  joinedDate: new Date().toISOString().split('T')[0],
};

export const defaultCategories: Category[] = [
  // Income
  { id: 'cat_inc_1', name: 'Salary', type: 'income', icon: 'Briefcase', color: '#22c55e' },
  { id: 'cat_inc_2', name: 'Freelance', type: 'income', icon: 'Code', color: '#06b6d4' },
  { id: 'cat_inc_3', name: 'Business', type: 'income', icon: 'Building', color: '#a855f7' },
  { id: 'cat_inc_4', name: 'Investment', type: 'income', icon: 'TrendingUp', color: '#eab308' },
  { id: 'cat_inc_5', name: 'Gift', type: 'income', icon: 'Gift', color: '#ec4899' },
  { id: 'cat_inc_6', name: 'Other Income', type: 'income', icon: 'PlusCircle', color: '#64748b' },

  // Expense
  { id: 'cat_exp_1', name: 'Food & Dining', type: 'expense', icon: 'Utensils', color: '#ef4444' },
  { id: 'cat_exp_2', name: 'Transport', type: 'expense', icon: 'Car', color: '#f97316' },
  { id: 'cat_exp_3', name: 'Housing', type: 'expense', icon: 'Home', color: '#3b82f6' },
  { id: 'cat_exp_4', name: 'Bills & Utilities', type: 'expense', icon: 'Zap', color: '#eab308' },
  { id: 'cat_exp_5', name: 'Shopping', type: 'expense', icon: 'ShoppingBag', color: '#ec4899' },
  { id: 'cat_exp_6', name: 'Healthcare', type: 'expense', icon: 'HeartPulse', color: '#14b8a6' },
  { id: 'cat_exp_7', name: 'Entertainment', type: 'expense', icon: 'Gamepad2', color: '#8b5cf6' },
  { id: 'cat_exp_8', name: 'Education', type: 'expense', icon: 'GraduationCap', color: '#0284c7' },
  { id: 'cat_exp_9', name: 'Travel', type: 'expense', icon: 'Plane', color: '#06b6d4' },
  { id: 'cat_exp_10', name: 'Miscellaneous', type: 'expense', icon: 'MoreHorizontal', color: '#64748b' },
];

export const initialAccounts: Account[] = [];

export const initialTransactions: Transaction[] = [];

export const initialBudgets: Budget[] = [];

export const initialGoals: Goal[] = [];

export const initialNotifications: Notification[] = [];

export const initialSmartInsights: SmartInsight[] = [];

