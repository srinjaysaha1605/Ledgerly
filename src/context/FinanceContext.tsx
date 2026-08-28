import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  Account, 
  Transaction, 
  Budget, 
  Goal, 
  Category, 
  UserProfile, 
  Notification, 
  SmartInsight, 
  UndoAction,
  DashboardWidgetId
} from '../types';
import { 
  initialAccounts, 
  initialTransactions, 
  initialBudgets, 
  initialGoals, 
  defaultCategories, 
  initialProfile, 
  initialNotifications, 
  initialSmartInsights 
} from '../data/initialData';
import { arcadeAudio } from '../utils/audio';
import { fetchGeminiInsights, generateRealLedgerInsights, askGeminiAdvisor } from '../services/aiAdvisor';

interface FinanceContextType {
  // State
  user: UserProfile;
  accounts: Account[];
  transactions: Transaction[];
  budgets: Budget[];
  goals: Goal[];
  categories: Category[];
  notifications: Notification[];
  insights: SmartInsight[];
  isGeneratingInsights: boolean;
  undoStack: UndoAction[];
  soundEnabled: boolean;
  widgetOrder: DashboardWidgetId[];
  activeView: string;
  isLoggedIn: boolean;
  quickCommandOpen: boolean;
  authModalOpen: boolean;
  authTab: 'login' | 'register' | 'forgot' | 'reset' | 'verify';

  // Navigation & UI Controls
  setActiveView: (view: string) => void;
  setQuickCommandOpen: (open: boolean) => void;
  setAuthModalOpen: (open: boolean) => void;
  setAuthTab: (tab: 'login' | 'register' | 'forgot' | 'reset' | 'verify') => void;
  setIsLoggedIn: (loggedIn: boolean) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setWidgetOrder: (order: DashboardWidgetId[]) => void;

  // Actions
  addTransaction: (tx: Omit<Transaction, 'id'>) => void;
  editTransaction: (tx: Transaction) => void;
  deleteTransaction: (id: string) => void;
  undoLastDelete: () => void;
  dismissUndoAction: (id?: string) => void;

  addAccount: (acc: Omit<Account, 'id' | 'currentBalance'>) => void;
  editAccount: (acc: Account) => void;
  deleteAccount: (id: string) => void;
  transferBetweenAccounts: (fromId: string, toId: string, amount: number, notes?: string) => void;

  addBudget: (budget: Omit<Budget, 'id'>) => void;
  editBudget: (budget: Budget) => void;
  deleteBudget: (id: string) => void;

  addGoal: (goal: Omit<Goal, 'id' | 'currentProgress'>) => void;
  editGoal: (goal: Goal) => void;
  deleteGoal: (id: string) => void;
  depositToGoal: (goalId: string, amount: number, accountId: string) => void;

  addCategory: (cat: Omit<Category, 'id'>) => void;
  updateUserProfile: (profile: Partial<UserProfile>) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAllNotifications: () => void;

  // AI Insights & Advisor
  refreshInsights: () => Promise<void>;
  askAdvisor: (question: string) => Promise<string>;

  // Utility
  formatCurrency: (amount: number) => string;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const STORAGE_KEY = 'retro_arcade_finance_v1';

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load initial state from LocalStorage if available
  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_user`);
    return saved ? JSON.parse(saved) : initialProfile;
  });

  const [accounts, setAccounts] = useState<Account[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_accounts`);
    return saved ? JSON.parse(saved) : initialAccounts;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_transactions`);
    return saved ? JSON.parse(saved) : initialTransactions;
  });

  const [budgets, setBudgets] = useState<Budget[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_budgets`);
    return saved ? JSON.parse(saved) : initialBudgets;
  });

  const [goals, setGoals] = useState<Goal[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_goals`);
    return saved ? JSON.parse(saved) : initialGoals;
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_categories`);
    return saved ? JSON.parse(saved) : defaultCategories;
  });

  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_notifications`);
    if (saved) {
      try {
        const parsed: Notification[] = JSON.parse(saved);
        // Filter out legacy dummy notifications
        return parsed.filter(n => !['notif_1', 'notif_2', 'notif_3'].includes(n.id));
      } catch {
        return [];
      }
    }
    return [];
  });

  const [insights, setInsights] = useState<SmartInsight[]>(() => {
    // Generate mathematically real baseline insights from the actual accounts/transactions immediately
    return generateRealLedgerInsights(initialAccounts, initialTransactions, initialBudgets, initialGoals, initialProfile);
  });
  const [isGeneratingInsights, setIsGeneratingInsights] = useState<boolean>(false);
  const [undoStack, setUndoStack] = useState<UndoAction[]>([]);
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(true);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [activeView, setActiveView] = useState<string>('dashboard');
  const [quickCommandOpen, setQuickCommandOpen] = useState<boolean>(false);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authTab, setAuthTab] = useState<'login' | 'register' | 'forgot' | 'reset' | 'verify'>('login');

  const [widgetOrder, setWidgetOrder] = useState<DashboardWidgetId[]>([
    'metrics',
    'quickAdd',
    'cashFlowChart',
    'insights',
    'recentTransactions',
    'budgetProgress',
    'upcomingRecurring',
    'goalsOverview',
  ]);

  // Clean up any legacy persisted session flags for secure zero-cache authentication
  useEffect(() => {
    try {
      localStorage.removeItem(`${STORAGE_KEY}_isLoggedIn`);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_user`, JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_accounts`, JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_transactions`, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_budgets`, JSON.stringify(budgets));
  }, [budgets]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_goals`, JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_categories`, JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_notifications`, JSON.stringify(notifications));
  }, [notifications]);

  const setSoundEnabled = (enabled: boolean) => {
    setSoundEnabledState(enabled);
    arcadeAudio.enabled = enabled;
  };

  // Format currency helper
  const formatCurrency = (amount: number): string => {
    const symbol = user.currencySymbol || '$';
    const isNegative = amount < 0;
    const absVal = Math.abs(amount).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `${isNegative ? '-' : ''}${symbol}${absVal}`;
  };

  // Helper to re-evaluate insights & budget alerts
  const checkBudgetAlerts = (updatedTxs: Transaction[], category: string) => {
    const currentMonth = new Date().toISOString().substring(0, 7);
    const budget = budgets.find(b => b.category === category);
    if (!budget) return;

    const monthSpent = updatedTxs
      .filter(t => t.type === 'expense' && t.category === category && t.date.startsWith(currentMonth))
      .reduce((sum, t) => sum + t.amount, 0);

    const utilizationPct = (monthSpent / budget.monthlyLimit) * 100;

    if (utilizationPct >= budget.alertThreshold) {
      const newNotif: Notification = {
        id: 'notif_' + Date.now(),
        title: `⚠️ BUDGET CAP WARNING: ${category.toUpperCase()}`,
        message: `You spent ${formatCurrency(monthSpent)} (${utilizationPct.toFixed(0)}%) of your ${formatCurrency(budget.monthlyLimit)} monthly limit!`,
        type: 'warning',
        date: new Date().toISOString().split('T')[0],
        read: false,
      };

      setNotifications(prev => [newNotif, ...prev]);
    }
  };

  // Add Transaction
  const addTransaction = (txData: Omit<Transaction, 'id'>) => {
    arcadeAudio.playCoin();
    const newTx: Transaction = {
      ...txData,
      id: 'tx_' + Date.now(),
    };

    setTransactions(prev => [newTx, ...prev]);

    // Update Account Current Balance
    setAccounts(prev => prev.map(acc => {
      if (acc.id === newTx.accountId) {
        let delta = 0;
        if (newTx.type === 'income') delta = newTx.amount;
        else if (newTx.type === 'expense') delta = -newTx.amount;
        else if (newTx.type === 'transfer') delta = -newTx.amount;
        return { ...acc, currentBalance: acc.currentBalance + delta };
      }
      if (newTx.type === 'transfer' && acc.id === newTx.toAccountId) {
        return { ...acc, currentBalance: acc.currentBalance + newTx.amount };
      }
      return acc;
    }));

    // Trigger Budget Alert check if expense
    if (newTx.type === 'expense') {
      checkBudgetAlerts([newTx, ...transactions], newTx.category);
    }
  };

  // Edit Transaction
  const editTransaction = (updatedTx: Transaction) => {
    arcadeAudio.playClick();
    const oldTx = transactions.find(t => t.id === updatedTx.id);
    if (!oldTx) return;

    // Revert old transaction balance impact first
    setAccounts(prev => prev.map(acc => {
      let balance = acc.currentBalance;
      if (acc.id === oldTx.accountId) {
        if (oldTx.type === 'income') balance -= oldTx.amount;
        else if (oldTx.type === 'expense') balance += oldTx.amount;
        else if (oldTx.type === 'transfer') balance += oldTx.amount;
      }
      if (oldTx.type === 'transfer' && acc.id === oldTx.toAccountId) {
        balance -= oldTx.amount;
      }
      // Apply new transaction balance impact
      if (acc.id === updatedTx.accountId) {
        if (updatedTx.type === 'income') balance += updatedTx.amount;
        else if (updatedTx.type === 'expense') balance -= updatedTx.amount;
        else if (updatedTx.type === 'transfer') balance -= updatedTx.amount;
      }
      if (updatedTx.type === 'transfer' && acc.id === updatedTx.toAccountId) {
        balance += updatedTx.amount;
      }
      return { ...acc, currentBalance: balance };
    }));

    setTransactions(prev => prev.map(t => t.id === updatedTx.id ? updatedTx : t));
  };

  // Delete Transaction
  const deleteTransaction = (id: string) => {
    arcadeAudio.playDelete();
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;

    // Push to undo stack
    setUndoStack(prev => [{ id: 'undo_' + Date.now(), transaction: tx, timestamp: Date.now() }, ...prev]);

    // Reverse balance effect
    setAccounts(prev => prev.map(acc => {
      if (acc.id === tx.accountId) {
        let delta = 0;
        if (tx.type === 'income') delta = -tx.amount;
        else if (tx.type === 'expense') delta = tx.amount;
        else if (tx.type === 'transfer') delta = tx.amount;
        return { ...acc, currentBalance: acc.currentBalance + delta };
      }
      if (tx.type === 'transfer' && acc.id === tx.toAccountId) {
        return { ...acc, currentBalance: acc.currentBalance - tx.amount };
      }
      return acc;
    }));

    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  // Undo & Dismiss actions
  const dismissUndoAction = (id?: string) => {
    if (id) {
      setUndoStack(prev => prev.filter(item => item.id !== id));
    } else {
      setUndoStack(prev => prev.slice(1));
    }
  };

  // Undo Last Delete
  const undoLastDelete = () => {
    if (undoStack.length === 0) return;
    arcadeAudio.playCoin();
    const [lastAction, ...remainingStack] = undoStack;
    const tx = lastAction.transaction;

    setUndoStack(remainingStack);
    setTransactions(prev => [tx, ...prev]);

    // Re-apply balance effect
    setAccounts(prev => prev.map(acc => {
      if (acc.id === tx.accountId) {
        let delta = 0;
        if (tx.type === 'income') delta = tx.amount;
        else if (tx.type === 'expense') delta = -tx.amount;
        else if (tx.type === 'transfer') delta = -tx.amount;
        return { ...acc, currentBalance: acc.currentBalance + delta };
      }
      if (tx.type === 'transfer' && acc.id === tx.toAccountId) {
        return { ...acc, currentBalance: acc.currentBalance + tx.amount };
      }
      return acc;
    }));
  };

  // Transfer between accounts
  const transferBetweenAccounts = (fromId: string, toId: string, amount: number, notes?: string) => {
    const fromAcc = accounts.find(a => a.id === fromId);
    const toAcc = accounts.find(a => a.id === toId);
    if (!fromAcc || !toAcc || amount <= 0) return;

    addTransaction({
      date: new Date().toISOString().split('T')[0],
      amount,
      type: 'transfer',
      title: `Transfer: ${fromAcc.name} ➔ ${toAcc.name}`,
      category: 'Transfer',
      accountId: fromId,
      toAccountId: toId,
      notes: notes || `Direct arcade account transfer`,
      tags: ['Transfer', 'Internal'],
    });
  };

  // Accounts CRUD
  const addAccount = (accData: Omit<Account, 'id' | 'currentBalance'>) => {
    arcadeAudio.playClick();
    const newAcc: Account = {
      ...accData,
      id: 'acc_' + Date.now(),
      currentBalance: accData.openingBalance,
    };
    setAccounts(prev => [...prev, newAcc]);
  };

  const editAccount = (updatedAcc: Account) => {
    arcadeAudio.playClick();
    setAccounts(prev => prev.map(a => a.id === updatedAcc.id ? updatedAcc : a));
  };

  const deleteAccount = (id: string) => {
    arcadeAudio.playDelete();
    setAccounts(prev => prev.filter(a => a.id !== id));
  };

  // Budgets CRUD
  const addBudget = (bData: Omit<Budget, 'id'>) => {
    arcadeAudio.playClick();
    const newB: Budget = { ...bData, id: 'bgt_' + Date.now() };
    setBudgets(prev => [...prev, newB]);
  };

  const editBudget = (b: Budget) => {
    arcadeAudio.playClick();
    setBudgets(prev => prev.map(item => item.id === b.id ? b : item));
  };

  const deleteBudget = (id: string) => {
    arcadeAudio.playDelete();
    setBudgets(prev => prev.filter(item => item.id !== id));
  };

  // Goals CRUD
  const addGoal = (gData: Omit<Goal, 'id' | 'currentProgress'>) => {
    arcadeAudio.playClick();
    const newG: Goal = { ...gData, id: 'goal_' + Date.now(), currentProgress: 0 };
    setGoals(prev => [...prev, newG]);
  };

  const editGoal = (g: Goal) => {
    arcadeAudio.playClick();
    setGoals(prev => prev.map(item => item.id === g.id ? g : item));
  };

  const deleteGoal = (id: string) => {
    arcadeAudio.playDelete();
    setGoals(prev => prev.filter(item => item.id !== id));
  };

  const depositToGoal = (goalId: string, amount: number, accountId: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal || amount <= 0) return;

    // Create expense transaction for funding goal
    addTransaction({
      date: new Date().toISOString().split('T')[0],
      amount,
      type: 'expense',
      title: `Goal Fund: ${goal.name}`,
      category: 'Savings',
      accountId,
      notes: `Direct contribution to goal: ${goal.name}`,
      tags: ['Goal', 'Savings'],
    });

    const updatedProgress = goal.currentProgress + amount;
    const isCompletedNow = updatedProgress >= goal.targetAmount && goal.currentProgress < goal.targetAmount;

    setGoals(prev => prev.map(g => g.id === goalId ? { ...g, currentProgress: updatedProgress } : g));

    if (isCompletedNow) {
      arcadeAudio.playLevelUp();
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      const newNotif: Notification = {
        id: 'notif_' + Date.now(),
        title: '🏆 GOAL ACHIEVED LEVEL UP!',
        message: `Congratulations! You unlocked 100% completion for '${goal.name}'!`,
        type: 'success',
        date: new Date().toISOString().split('T')[0],
        read: false,
      };
      setNotifications(prev => [newNotif, ...prev]);
    } else {
      arcadeAudio.playCoin();
    }
  };

  // Category Add
  const addCategory = (catData: Omit<Category, 'id'>) => {
    arcadeAudio.playClick();
    const newCat: Category = { ...catData, id: 'cat_' + Date.now(), isCustom: true };
    setCategories(prev => [...prev, newCat]);
  };

  // Profile Update
  const updateUserProfile = (updated: Partial<UserProfile>) => {
    arcadeAudio.playClick();
    setUser(prev => ({ ...prev, ...updated }));
  };

  // Reference state to avoid stale closures in debounced auto-refresh
  const isRefreshingRef = useRef(false);

  // Refresh insights using Gemini API (with fallback)
  const refreshInsights = useCallback(async () => {
    if (isRefreshingRef.current) return;
    isRefreshingRef.current = true;
    setIsGeneratingInsights(true);
    try {
      const newInsights = await fetchGeminiInsights(accounts, transactions, budgets, goals, user);
      setInsights(newInsights);
    } catch (err) {
      console.error('Error refreshing insights:', err);
      // Fallback
      setInsights(generateRealLedgerInsights(accounts, transactions, budgets, goals, user));
    } finally {
      setIsGeneratingInsights(false);
      isRefreshingRef.current = false;
    }
  }, [accounts, transactions, budgets, goals, user]);

  // Interactive advisor query
  const askAdvisor = useCallback(async (question: string): Promise<string> => {
    return askGeminiAdvisor(question, accounts, transactions, budgets, goals, user);
  }, [accounts, transactions, budgets, goals, user]);

  // Initial load auto-refresh on login with a safe debounce
  useEffect(() => {
    if (!isLoggedIn) return;
    const timer = setTimeout(() => {
      refreshInsights();
    }, 1200);
    return () => clearTimeout(timer);
  }, [isLoggedIn, refreshInsights]);

  // Notifications
  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  return (
    <FinanceContext.Provider
      value={{
        user,
        accounts,
        transactions,
        budgets,
        goals,
        categories,
        notifications,
        insights,
        isGeneratingInsights,
        undoStack,
        soundEnabled,
        widgetOrder,
        activeView,
        isLoggedIn,
        quickCommandOpen,
        authModalOpen,
        authTab,

        setActiveView,
        setQuickCommandOpen,
        setAuthModalOpen,
        setAuthTab,
        setIsLoggedIn,
        setSoundEnabled,
        setWidgetOrder,

        addTransaction,
        editTransaction,
        deleteTransaction,
        undoLastDelete,
        dismissUndoAction,

        addAccount,
        editAccount,
        deleteAccount,
        transferBetweenAccounts,

        addBudget,
        editBudget,
        deleteBudget,

        addGoal,
        editGoal,
        deleteGoal,
        depositToGoal,

        addCategory,
        updateUserProfile,
        markNotificationRead,
        markAllNotificationsRead,
        deleteNotification,
        clearAllNotifications,

        refreshInsights,
        askAdvisor,

        formatCurrency,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
