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
  initialSmartInsights 
} from '../data/initialData';
import { arcadeAudio } from '../utils/audio';
import { getLocalYearMonth, getLocalDateString } from '../utils/dateUtils';
import { fetchGeminiInsights, generateRealLedgerInsights, askGeminiAdvisor } from '../services/aiAdvisor';
import { auth, db, isFirebaseConfigured } from '../lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, collection, onSnapshot, setDoc, deleteDoc } from 'firebase/firestore';

const generateId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'id_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
};

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

const STORAGE_KEY = 'cash_quest_v2_clean';

function cleanForFirestore<T extends Record<string, any>>(obj: T): T {
  if (!obj || typeof obj !== 'object') return obj;
  const cleaned: Record<string, any> = {};
  Object.keys(obj).forEach(key => {
    const val = obj[key];
    if (val !== undefined) {
      if (Array.isArray(val)) {
        cleaned[key] = val.map(item => (typeof item === 'object' && item !== null ? cleanForFirestore(item) : item));
      } else if (typeof val === 'object' && val !== null) {
        cleaned[key] = cleanForFirestore(val);
      } else {
        cleaned[key] = val;
      }
    }
  });
  return cleaned as T;
}

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Initial state from LocalStorage if available
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
        return parsed.filter(n => !['notif_1', 'notif_2', 'notif_3'].includes(n.id));
      } catch {
        return [];
      }
    }
    return [];
  });

  const [insights, setInsights] = useState<SmartInsight[]>(() => {
    return generateRealLedgerInsights(initialAccounts, initialTransactions, initialBudgets, initialGoals, initialProfile);
  });
  const [isGeneratingInsights, setIsGeneratingInsights] = useState<boolean>(false);
  const [undoStack, setUndoStack] = useState<UndoAction[]>([]);
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(true);
  const [isLoggedIn, setIsLoggedInState] = useState<boolean>(false);
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

  // Sync state from Firebase Auth when user authenticates
  useEffect(() => {
    if (!isFirebaseConfigured || !auth) return;

    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      if (authUser && authUser.emailVerified) {
        const userId = authUser.uid;
        setCurrentUserId(userId);
        setIsLoggedInState(true);

        // Instant local cache restore if present
        const cached = localStorage.getItem(`cq_user_cache_${userId}`);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (parsed.accounts) setAccounts(parsed.accounts);
            if (parsed.transactions) setTransactions(parsed.transactions);
            if (parsed.budgets) setBudgets(parsed.budgets);
            if (parsed.goals) setGoals(parsed.goals);
            if (parsed.notifications) setNotifications(parsed.notifications);
            if (parsed.user) setUser(parsed.user);
          } catch (e) {
            console.warn('Failed to parse user local cache:', e);
          }
        }

        setUser(prev => ({
          ...prev,
          id: userId,
          email: authUser.email || prev.email,
          fullName: prev.fullName || authUser.displayName || (authUser.email ? authUser.email.split('@')[0] : 'User'),
        }));
      } else {
        setCurrentUserId(null);
        setIsLoggedInState(false);
        setUser(initialProfile);
        setAccounts([]);
        setTransactions([]);
        setBudgets([]);
        setGoals([]);
        setNotifications([]);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Sync state to local cache per user
  useEffect(() => {
    if (currentUserId && isLoggedIn) {
      const cachePayload = {
        user,
        accounts,
        transactions,
        budgets,
        goals,
        notifications,
      };
      try {
        localStorage.setItem(`cq_user_cache_${currentUserId}`, JSON.stringify(cachePayload));
      } catch (e) {
        console.warn('Local storage write warning:', e);
      }
    }
  }, [currentUserId, isLoggedIn, user, accounts, transactions, budgets, goals, notifications]);

  // Real-time Firestore sync for authenticated user
  useEffect(() => {
    if (!currentUserId || !isFirebaseConfigured || !db) return;

    // 1. Profile Doc Listener
    const userDocRef = doc(db, 'users', currentUserId);
    const unsubUser = onSnapshot(userDocRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setUser(prev => ({
          ...prev,
          id: currentUserId,
          fullName: data.fullName || prev.fullName || 'User',
          email: data.email || prev.email || '',
          currency: data.currency || prev.currency || 'USD',
          currencySymbol: data.currencySymbol || prev.currencySymbol || '$',
          joinedDate: data.joinedDate || prev.joinedDate || new Date().toISOString().split('T')[0],
          isEmailVerified: true,
        }));
      }
    }, (err) => console.warn('User snap listener warning:', err));

    // 2. Accounts Subcollection Listener
    const accountsRef = collection(db, 'users', currentUserId, 'accounts');
    const unsubAccounts = onSnapshot(accountsRef, (snap) => {
      const list: Account[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() } as Account));
      setAccounts(list);
    }, (err) => console.warn('Accounts snap listener warning:', err));

    // 3. Transactions Subcollection Listener
    const txsRef = collection(db, 'users', currentUserId, 'transactions');
    const unsubTxs = onSnapshot(txsRef, (snap) => {
      const list: Transaction[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() } as Transaction));
      list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setTransactions(list);
    }, (err) => console.warn('Transactions snap listener warning:', err));

    // 4. Budgets Subcollection Listener
    const budgetsRef = collection(db, 'users', currentUserId, 'budgets');
    const unsubBudgets = onSnapshot(budgetsRef, (snap) => {
      const list: Budget[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() } as Budget));
      setBudgets(list);
    }, (err) => console.warn('Budgets snap listener warning:', err));

    // 5. Goals Subcollection Listener
    const goalsRef = collection(db, 'users', currentUserId, 'goals');
    const unsubGoals = onSnapshot(goalsRef, (snap) => {
      const list: Goal[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() } as Goal));
      setGoals(list);
    }, (err) => console.warn('Goals snap listener warning:', err));

    // 6. Custom Categories Listener
    const categoriesRef = collection(db, 'users', currentUserId, 'categories');
    const unsubCategories = onSnapshot(categoriesRef, (snap) => {
      const list: Category[] = [...defaultCategories];
      snap.forEach(d => {
        const cat = { id: d.id, ...d.data() } as Category;
        if (!list.some(c => c.id === cat.id)) {
          list.push(cat);
        }
      });
      setCategories(list);
    }, (err) => console.warn('Categories snap listener warning:', err));

    // 7. Notifications Listener
    const notifsRef = collection(db, 'users', currentUserId, 'notifications');
    const unsubNotifs = onSnapshot(notifsRef, (snap) => {
      const list: Notification[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() } as Notification));
      list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setNotifications(list);
    }, (err) => console.warn('Notifications snap listener warning:', err));

    return () => {
      unsubUser();
      unsubAccounts();
      unsubTxs();
      unsubBudgets();
      unsubGoals();
      unsubCategories();
      unsubNotifs();
    };
  }, [currentUserId]);

  const setIsLoggedIn = (loggedIn: boolean) => {
    setIsLoggedInState(loggedIn);
    if (!loggedIn) {
      setCurrentUserId(null);
      setUser(initialProfile);
      setAccounts([]);
      setTransactions([]);
      setBudgets([]);
      setGoals([]);
      setNotifications([]);
      if (isFirebaseConfigured && auth) {
        signOut(auth).catch(() => {});
      }
    }
  };

  // Local Storage Backups
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

  // Budget alert check
  const checkBudgetAlerts = (updatedTxs: Transaction[], category: string) => {
    const currentMonth = getLocalYearMonth();
    const budget = budgets.find(b => b.category === category);
    if (!budget) return;

    const monthSpent = updatedTxs
      .filter(t => t.type === 'expense' && t.category === category && t.date.startsWith(currentMonth))
      .reduce((sum, t) => sum + t.amount, 0);

    const utilizationPct = (monthSpent / budget.monthlyLimit) * 100;

    if (utilizationPct >= budget.alertThreshold) {
      const newNotif: Notification = {
        id: generateId(),
        title: `⚠️ BUDGET CAP WARNING: ${category.toUpperCase()}`,
        message: `You spent ${formatCurrency(monthSpent)} (${utilizationPct.toFixed(0)}%) of your ${formatCurrency(budget.monthlyLimit)} monthly limit!`,
        type: 'warning',
        date: getLocalDateString(),
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
      id: generateId(),
    };

    setTransactions(prev => [newTx, ...prev]);
    if (currentUserId && db) {
      setDoc(doc(db, 'users', currentUserId, 'transactions', newTx.id), cleanForFirestore(newTx)).catch(console.warn);
    }

    setAccounts(prev => {
      return prev.map(acc => {
        let delta = 0;
        let changed = false;
        if (acc.id === newTx.accountId) {
          if (newTx.type === 'income') delta = newTx.amount;
          else if (newTx.type === 'expense') delta = -newTx.amount;
          else if (newTx.type === 'transfer') delta = -newTx.amount;
          changed = true;
        }
        if (newTx.type === 'transfer' && acc.id === newTx.toAccountId) {
          delta = newTx.amount;
          changed = true;
        }
        if (changed) {
          const updatedAcc = { ...acc, currentBalance: acc.currentBalance + delta };
          if (currentUserId && db) {
            setDoc(doc(db, 'users', currentUserId, 'accounts', acc.id), cleanForFirestore(updatedAcc), { merge: true }).catch(console.warn);
          }
          return updatedAcc;
        }
        return acc;
      });
    });

    if (newTx.type === 'expense') {
      checkBudgetAlerts([newTx, ...transactions], newTx.category);
    }
  };

  // Edit Transaction
  const editTransaction = (updatedTx: Transaction) => {
    arcadeAudio.playClick();
    const oldTx = transactions.find(t => t.id === updatedTx.id);
    if (!oldTx) return;

    if (currentUserId && db) {
      setDoc(doc(db, 'users', currentUserId, 'transactions', updatedTx.id), cleanForFirestore(updatedTx), { merge: true }).catch(console.warn);
    }

    setAccounts(prev => {
      return prev.map(acc => {
        let balance = acc.currentBalance;
        if (acc.id === oldTx.accountId) {
          if (oldTx.type === 'income') balance -= oldTx.amount;
          else if (oldTx.type === 'expense') balance += oldTx.amount;
          else if (oldTx.type === 'transfer') balance += oldTx.amount;
        }
        if (oldTx.type === 'transfer' && acc.id === oldTx.toAccountId) {
          balance -= oldTx.amount;
        }
        if (acc.id === updatedTx.accountId) {
          if (updatedTx.type === 'income') balance += updatedTx.amount;
          else if (updatedTx.type === 'expense') balance -= updatedTx.amount;
          else if (updatedTx.type === 'transfer') balance -= updatedTx.amount;
        }
        if (updatedTx.type === 'transfer' && acc.id === updatedTx.toAccountId) {
          balance += updatedTx.amount;
        }
        const updatedAcc = { ...acc, currentBalance: balance };
        if (currentUserId && db) {
          setDoc(doc(db, 'users', currentUserId, 'accounts', acc.id), cleanForFirestore(updatedAcc), { merge: true }).catch(console.warn);
        }
        return updatedAcc;
      });
    });

    setTransactions(prev => prev.map(t => t.id === updatedTx.id ? updatedTx : t));
  };

  // Delete Transaction
  const deleteTransaction = (id: string) => {
    arcadeAudio.playDelete();
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;

    setUndoStack(prev => [{ id: 'undo_' + Date.now(), transaction: tx, timestamp: Date.now() }, ...prev]);

    if (currentUserId && db) {
      deleteDoc(doc(db, 'users', currentUserId, 'transactions', id)).catch(console.warn);
    }

    setAccounts(prev => {
      return prev.map(acc => {
        let delta = 0;
        let changed = false;
        if (acc.id === tx.accountId) {
          if (tx.type === 'income') delta = -tx.amount;
          else if (tx.type === 'expense') delta = tx.amount;
          else if (tx.type === 'transfer') delta = tx.amount;
          changed = true;
        }
        if (tx.type === 'transfer' && acc.id === tx.toAccountId) {
          delta = -tx.amount;
          changed = true;
        }
        if (changed) {
          const updatedAcc = { ...acc, currentBalance: acc.currentBalance + delta };
          if (currentUserId && db) {
            setDoc(doc(db, 'users', currentUserId, 'accounts', acc.id), updatedAcc, { merge: true }).catch(console.warn);
          }
          return updatedAcc;
        }
        return acc;
      });
    });

    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  // Undo & Dismiss
  const dismissUndoAction = (id?: string) => {
    if (id) {
      setUndoStack(prev => prev.filter(item => item.id !== id));
    } else {
      setUndoStack(prev => prev.slice(1));
    }
  };

  const undoLastDelete = () => {
    if (undoStack.length === 0) return;
    arcadeAudio.playCoin();
    const [lastAction, ...remainingStack] = undoStack;
    const tx = lastAction.transaction;

    setUndoStack(remainingStack);
    setTransactions(prev => [tx, ...prev]);

    setAccounts(prev => {
      return prev.map(acc => {
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
      });
    });
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
      notes: notes || `Direct account transfer`,
      tags: ['Transfer', 'Internal'],
    });
  };

  // Accounts CRUD
  const addAccount = (accData: Omit<Account, 'id' | 'currentBalance'>) => {
    arcadeAudio.playClick();
    const newAcc: Account = {
      ...accData,
      id: generateId(),
      currentBalance: accData.openingBalance,
    };
    setAccounts(prev => [...prev, newAcc]);
    if (currentUserId && db) {
      setDoc(doc(db, 'users', currentUserId, 'accounts', newAcc.id), cleanForFirestore(newAcc)).catch(console.warn);
    }
  };

  const editAccount = (updatedAcc: Account) => {
    arcadeAudio.playClick();
    setAccounts(prev => prev.map(a => a.id === updatedAcc.id ? updatedAcc : a));
    if (currentUserId && db) {
      setDoc(doc(db, 'users', currentUserId, 'accounts', updatedAcc.id), cleanForFirestore(updatedAcc), { merge: true }).catch(console.warn);
    }
  };

  const deleteAccount = (id: string) => {
    arcadeAudio.playDelete();
    setAccounts(prev => prev.filter(a => a.id !== id));
    if (currentUserId && db) {
      deleteDoc(doc(db, 'users', currentUserId, 'accounts', id)).catch(console.warn);
    }
  };

  // Budgets CRUD
  const addBudget = (bData: Omit<Budget, 'id'>) => {
    arcadeAudio.playClick();
    const newB: Budget = { ...bData, id: generateId() };
    setBudgets(prev => [...prev, newB]);
    if (currentUserId && db) {
      setDoc(doc(db, 'users', currentUserId, 'budgets', newB.id), cleanForFirestore(newB)).catch(console.warn);
    }
  };

  const editBudget = (b: Budget) => {
    arcadeAudio.playClick();
    setBudgets(prev => prev.map(item => item.id === b.id ? b : item));
    if (currentUserId && db) {
      setDoc(doc(db, 'users', currentUserId, 'budgets', b.id), cleanForFirestore(b), { merge: true }).catch(console.warn);
    }
  };

  const deleteBudget = (id: string) => {
    arcadeAudio.playDelete();
    setBudgets(prev => prev.filter(item => item.id !== id));
    if (currentUserId && db) {
      deleteDoc(doc(db, 'users', currentUserId, 'budgets', id)).catch(console.warn);
    }
  };

  // Goals CRUD
  const addGoal = (gData: Omit<Goal, 'id' | 'currentProgress'>) => {
    arcadeAudio.playClick();
    const newG: Goal = { ...gData, id: generateId(), currentProgress: 0 };
    setGoals(prev => [...prev, newG]);
    if (currentUserId && db) {
      setDoc(doc(db, 'users', currentUserId, 'goals', newG.id), cleanForFirestore(newG)).catch(console.warn);
    }
  };

  const editGoal = (g: Goal) => {
    arcadeAudio.playClick();
    setGoals(prev => prev.map(item => item.id === g.id ? g : item));
    if (currentUserId && db) {
      setDoc(doc(db, 'users', currentUserId, 'goals', g.id), cleanForFirestore(g), { merge: true }).catch(console.warn);
    }
  };

  const deleteGoal = (id: string) => {
    arcadeAudio.playDelete();
    setGoals(prev => prev.filter(item => item.id !== id));
    if (currentUserId && db) {
      deleteDoc(doc(db, 'users', currentUserId, 'goals', id)).catch(console.warn);
    }
  };

  const depositToGoal = (goalId: string, amount: number, accountId: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal || amount <= 0) return;

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

    const updatedGoal = { ...goal, currentProgress: updatedProgress };
    setGoals(prev => prev.map(g => g.id === goalId ? updatedGoal : g));
    if (currentUserId && db) {
      setDoc(doc(db, 'users', currentUserId, 'goals', goalId), cleanForFirestore(updatedGoal), { merge: true }).catch(console.warn);
    }

    if (isCompletedNow) {
      arcadeAudio.playLevelUp();
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      const newNotif: Notification = {
        id: generateId(),
        title: '🏆 GOAL ACHIEVED LEVEL UP!',
        message: `Congratulations! You unlocked 100% completion for '${goal.name}'!`,
        type: 'success',
        date: new Date().toISOString().split('T')[0],
        read: false,
      };
      setNotifications(prev => [newNotif, ...prev]);
      if (currentUserId && db) {
        setDoc(doc(db, 'users', currentUserId, 'notifications', newNotif.id), cleanForFirestore(newNotif)).catch(console.warn);
      }
    } else {
      arcadeAudio.playCoin();
    }
  };

  // Category Add
  const addCategory = (catData: Omit<Category, 'id'>) => {
    arcadeAudio.playClick();
    const newCat: Category = { ...catData, id: generateId(), isCustom: true };
    setCategories(prev => [...prev, newCat]);
    if (currentUserId && db) {
      setDoc(doc(db, 'users', currentUserId, 'categories', newCat.id), cleanForFirestore(newCat)).catch(console.warn);
    }
  };

  // Profile Update
  const updateUserProfile = (updated: Partial<UserProfile>) => {
    arcadeAudio.playClick();
    setUser(prev => {
      const newProfile = { ...prev, ...updated };
      if (currentUserId && db) {
        setDoc(doc(db, 'users', currentUserId), cleanForFirestore(updated), { merge: true }).catch(console.warn);
      }
      return newProfile;
    });
  };

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
    if (currentUserId && db) {
      setDoc(doc(db, 'users', currentUserId, 'notifications', id), { read: true }, { merge: true }).catch(console.warn);
    }
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => {
      if (currentUserId && db) {
        setDoc(doc(db, 'users', currentUserId, 'notifications', n.id), { read: true }, { merge: true }).catch(console.warn);
      }
      return { ...n, read: true };
    }));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    if (currentUserId && db) {
      deleteDoc(doc(db, 'users', currentUserId, 'notifications', id)).catch(console.warn);
    }
  };

  const clearAllNotifications = () => {
    notifications.forEach(n => {
      if (currentUserId && db) {
        deleteDoc(doc(db, 'users', currentUserId, 'notifications', n.id)).catch(console.warn);
      }
    });
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
