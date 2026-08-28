import { SmartInsight, Account, Transaction, Budget, Goal, UserProfile } from '../types';

export interface FinancialContextPayload {
  financialSummary: {
    totalBalance: number;
    monthlyIncome: number;
    monthlyExpense: number;
    netSavings: number;
    savingsRate: number;
    highestExpenseCategory: string;
    totalTransactionsCount: number;
  };
  accounts: Array<{ name: string; type: string; balance: number }>;
  transactions: Array<{
    date: string;
    title: string;
    amount: number;
    type: string;
    category: string;
    isRecurring?: boolean;
  }>;
  budgets: Array<{ category: string; limit: number; spent: number; percentUsed: number }>;
  goals: Array<{ name: string; target: number; progress: number; percentDone: number; deadline: string }>;
  currency: string;
}

export function buildFinancialContext(
  accounts: Account[],
  transactions: Transaction[],
  budgets: Budget[],
  goals: Goal[],
  user: UserProfile
): FinancialContextPayload {
  const currentMonth = new Date().toISOString().substring(0, 7);
  const currentMonthTxs = transactions.filter(t => t.date.startsWith(currentMonth));
  
  const monthlyIncome = currentMonthTxs
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyExpense = currentMonthTxs
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalBalance = accounts.reduce((sum, a) => sum + a.currentBalance, 0);
  const netSavings = monthlyIncome - monthlyExpense;
  const savingsRate = monthlyIncome > 0 ? Math.max(0, (netSavings / monthlyIncome) * 100) : 0;

  // Category breakdown for current month
  const categorySpending: Record<string, number> = {};
  currentMonthTxs
    .filter(t => t.type === 'expense')
    .forEach(t => {
      categorySpending[t.category] = (categorySpending[t.category] || 0) + t.amount;
    });

  let highestExpenseCategory = 'None';
  let highestAmount = 0;
  Object.entries(categorySpending).forEach(([cat, amt]) => {
    if (amt > highestAmount) {
      highestAmount = amt;
      highestExpenseCategory = `${cat} ($${amt.toFixed(2)})`;
    }
  });

  // Calculate budget spending
  const budgetList = budgets.map(b => {
    const spent = currentMonthTxs
      .filter(t => t.type === 'expense' && t.category === b.category)
      .reduce((sum, t) => sum + t.amount, 0);
    const percentUsed = b.monthlyLimit > 0 ? Math.round((spent / b.monthlyLimit) * 100) : 0;
    return {
      category: b.category,
      limit: b.monthlyLimit,
      spent: Math.round(spent * 100) / 100,
      percentUsed,
    };
  });

  const goalList = goals.map(g => ({
    name: g.name,
    target: g.targetAmount,
    progress: g.currentProgress,
    percentDone: g.targetAmount > 0 ? Math.round((g.currentProgress / g.targetAmount) * 100) : 0,
    deadline: g.deadline,
  }));

  return {
    financialSummary: {
      totalBalance: Math.round(totalBalance * 100) / 100,
      monthlyIncome: Math.round(monthlyIncome * 100) / 100,
      monthlyExpense: Math.round(monthlyExpense * 100) / 100,
      netSavings: Math.round(netSavings * 100) / 100,
      savingsRate: Math.round(savingsRate * 10) / 10,
      highestExpenseCategory,
      totalTransactionsCount: transactions.length,
    },
    accounts: accounts.map(a => ({ name: a.name, type: a.type, balance: a.currentBalance })),
    transactions: transactions.slice(0, 30).map(t => ({
      date: t.date,
      title: t.title,
      amount: t.amount,
      type: t.type,
      category: t.category,
      isRecurring: t.isRecurring,
    })),
    budgets: budgetList,
    goals: goalList,
    currency: user.currencySymbol || '$',
  };
}

/**
 * Generate accurate, deterministic real fallback insights based on the actual ledger
 */
export function generateRealLedgerInsights(
  accounts: Account[],
  transactions: Transaction[],
  budgets: Budget[],
  goals: Goal[],
  user: UserProfile
): SmartInsight[] {
  const symbol = user.currencySymbol || '$';
  const currentMonth = new Date().toISOString().substring(0, 7);
  const currentMonthTxs = transactions.filter(t => t.date.startsWith(currentMonth));
  
  const income = currentMonthTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = currentMonthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const net = income - expense;
  const savingsRate = income > 0 ? ((net / income) * 100) : 0;
  
  const insights: SmartInsight[] = [];

  // 1. Savings Rate / Cash Flow Insight
  if (income > 0) {
    if (savingsRate >= 20) {
      insights.push({
        id: 'real_ins_1',
        title: 'STRONG SAVINGS MOMENTUM',
        description: `You are saving ${savingsRate.toFixed(1)}% of your income this month (${symbol}${net.toFixed(2)} net surplus). Great fiscal discipline!`,
        type: 'positive',
        icon: 'Zap',
        badge: 'SAVINGS WIN',
        impactValue: `+${savingsRate.toFixed(0)}% Rate`,
      });
    } else if (savingsRate > 0) {
      insights.push({
        id: 'real_ins_1',
        title: 'POSITIVE CASH FLOW',
        description: `You have retained ${symbol}${net.toFixed(2)} (${savingsRate.toFixed(1)}%) of your income this month. Keep building your reserve!`,
        type: 'positive',
        icon: 'TrendingUp',
        badge: 'ON TRACK',
        impactValue: `+${symbol}${net.toFixed(2)}`,
      });
    } else {
      insights.push({
        id: 'real_ins_1',
        title: 'CASH FLOW DEFICIT ALERT',
        description: `Expenses (${symbol}${expense.toFixed(2)}) exceed incoming revenue (${symbol}${income.toFixed(2)}) by ${symbol}${Math.abs(net).toFixed(2)}. Consider trimming non-essentials.`,
        type: 'warning',
        icon: 'AlertTriangle',
        badge: 'CASH CAUTION',
        impactValue: `-${symbol}${Math.abs(net).toFixed(2)}`,
      });
    }
  } else {
    insights.push({
      id: 'real_ins_1',
      title: 'RECORD MONTHLY INCOME',
      description: `Log your incoming paycheck or revenue to unlock complete savings rate analytics and automated budget tracking.`,
      type: 'tip',
      icon: 'PiggyBank',
      badge: 'GET STARTED',
      impactValue: `${transactions.length} Records`,
    });
  }

  // 2. Budget Alert or Top Expense Category
  const overBudget = budgets.find(b => {
    const spent = currentMonthTxs
      .filter(t => t.type === 'expense' && t.category === b.category)
      .reduce((s, t) => s + t.amount, 0);
    return spent > b.monthlyLimit;
  });

  if (overBudget) {
    const spent = currentMonthTxs
      .filter(t => t.type === 'expense' && t.category === overBudget.category)
      .reduce((s, t) => s + t.amount, 0);
    insights.push({
      id: 'real_ins_2',
      title: `${overBudget.category.toUpperCase()} CAP EXCEEDED`,
      description: `You've spent ${symbol}${spent.toFixed(2)} on ${overBudget.category}, exceeding the ${symbol}${overBudget.monthlyLimit.toFixed(2)} monthly limit.`,
      type: 'warning',
      icon: 'AlertTriangle',
      badge: 'OVER BUDGET',
      impactValue: `${((spent / overBudget.monthlyLimit) * 100).toFixed(0)}% Used`,
    });
  } else {
    // Find highest expense category
    const catTotals: Record<string, number> = {};
    currentMonthTxs.filter(t => t.type === 'expense').forEach(t => {
      catTotals[t.category] = (catTotals[t.category] || 0) + t.amount;
    });
    const sortedCats = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);
    if (sortedCats.length > 0) {
      const [topCat, topAmt] = sortedCats[0];
      const pctOfTotal = expense > 0 ? ((topAmt / expense) * 100).toFixed(0) : '0';
      insights.push({
        id: 'real_ins_2',
        title: `TOP SPENDING: ${topCat.toUpperCase()}`,
        description: `${topCat} accounts for ${pctOfTotal}% (${symbol}${topAmt.toFixed(2)}) of total expenses this month.`,
        type: 'tip',
        icon: 'TrendingUp',
        badge: 'TOP CATEGORY',
        impactValue: `${symbol}${topAmt.toFixed(2)}`,
      });
    } else {
      insights.push({
        id: 'real_ins_2',
        title: 'BALANCED SPENDING',
        description: `All tracked categories are currently well within target allocations with zero overruns.`,
        type: 'positive',
        icon: 'ShieldCheck',
        badge: 'ALL CLEAR',
        impactValue: '100% On Cap',
      });
    }
  }

  // 3. Subscriptions / Recurring Radar
  const recurringTxs = transactions.filter(t => t.isRecurring);
  if (recurringTxs.length > 0) {
    const recurringSum = recurringTxs.reduce((s, t) => s + t.amount, 0);
    insights.push({
      id: 'real_ins_3',
      title: 'ACTIVE RECURRING EXPENSES',
      description: `You have ${recurringTxs.length} automated recurring bills & subscriptions totaling ~${symbol}${recurringSum.toFixed(2)}/cycle.`,
      type: 'tip',
      icon: 'Repeat',
      badge: 'AUTO RECURRING',
      impactValue: `${recurringTxs.length} Active`,
    });
  } else {
    insights.push({
      id: 'real_ins_3',
      title: 'ACCOUNTS DIVERSIFICATION',
      description: `Tracking ${accounts.length} linked accounts. Ensure you periodically reconcile balances to maintain accurate cash tracking.`,
      type: 'tip',
      icon: 'ShieldCheck',
      badge: 'PORTFOLIO',
      impactValue: `${accounts.length} Accounts`,
    });
  }

  // 4. Goals Milestone
  if (goals.length > 0) {
    // Find the goal closest to completion or highest progress
    const activeGoals = [...goals].sort((a, b) => {
      const pctA = a.targetAmount > 0 ? a.currentProgress / a.targetAmount : 0;
      const pctB = b.targetAmount > 0 ? b.currentProgress / b.targetAmount : 0;
      return pctB - pctA;
    });

    const topGoal = activeGoals[0];
    const pct = topGoal.targetAmount > 0 ? Math.round((topGoal.currentProgress / topGoal.targetAmount) * 100) : 0;
    const remaining = Math.max(0, topGoal.targetAmount - topGoal.currentProgress);

    insights.push({
      id: 'real_ins_4',
      title: `${topGoal.name.toUpperCase()} PROGRESS`,
      description: remaining > 0
        ? `You are ${pct}% of the way to "${topGoal.name}". Only ${symbol}${remaining.toFixed(2)} left to reach your goal!`
        : `Target achieved! You've completely funded "${topGoal.name}" with ${symbol}${topGoal.currentProgress.toFixed(2)}!`,
      type: 'milestone',
      icon: 'Trophy',
      badge: pct >= 100 ? 'COMPLETED' : 'GOAL TARGET',
      impactValue: `${pct}% Done`,
    });
  } else {
    insights.push({
      id: 'real_ins_4',
      title: 'SET A SAVINGS TARGET',
      description: 'Define your first savings goal in the Budgets & Goals tab to unlock automated milestones and timeline tracking.',
      type: 'milestone',
      icon: 'Trophy',
      badge: 'NEW TARGET',
      impactValue: 'Create Goal',
    });
  }

  return insights;
}

/**
 * Fetch insights generated by Gemini AI with full fallback safety
 */
export async function fetchGeminiInsights(
  accounts: Account[],
  transactions: Transaction[],
  budgets: Budget[],
  goals: Goal[],
  user: UserProfile
): Promise<SmartInsight[]> {
  try {
    const payload = buildFinancialContext(accounts, transactions, budgets, goals, user);
    
    const response = await fetch('/api/gemini/insights', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Server returned status ${response.status}`);
    }

    const data = await response.json();
    if (data.success && Array.isArray(data.insights) && data.insights.length > 0) {
      return data.insights.map((ins: any, index: number) => ({
        id: `gemini_ins_${Date.now()}_${index}`,
        title: String(ins.title || 'FINANCIAL INSIGHT').toUpperCase(),
        description: String(ins.description || ''),
        type: (['positive', 'warning', 'tip', 'milestone'].includes(ins.type) ? ins.type : 'tip') as any,
        icon: ins.icon || 'Sparkles',
        badge: ins.badge || 'SMART INSIGHT',
        impactValue: ins.impactValue,
      }));
    }
  } catch (error) {
    console.warn('Gemini Insights generation fallback to ledger analytics:', error);
  }

  // Gracefully fallback to real mathematical calculations from user ledger
  return generateRealLedgerInsights(accounts, transactions, budgets, goals, user);
}

/**
 * Ask a custom question to the Gemini Financial Advisor
 */
export async function askGeminiAdvisor(
  question: string,
  accounts: Account[],
  transactions: Transaction[],
  budgets: Budget[],
  goals: Goal[],
  user: UserProfile
): Promise<string> {
  const payload = {
    question,
    financialContext: buildFinancialContext(accounts, transactions, budgets, goals, user),
    currency: user.currencySymbol || '$',
  };

  const response = await fetch('/api/gemini/advisor', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Advisor request failed (${response.status})`);
  }

  const data = await response.json();
  if (!data.success || !data.answer) {
    throw new Error(data.error || 'No answer received from advisor');
  }

  return data.answer;
}
