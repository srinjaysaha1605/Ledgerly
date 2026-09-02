import React from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  PieChart as RePieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';
import { 
  PieChart, 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Award, 
  Sparkles, 
  Zap, 
  ArrowUpRight, 
  ArrowDownRight 
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';

export const AnalyticsView: React.FC = () => {
  const { 
    transactions, 
    accounts, 
    budgets, 
    formatCurrency, 
    user 
  } = useFinance();

  const currentMonth = new Date().toISOString().substring(0, 7);

  // Totals
  const currentMonthTxs = transactions.filter(t => t.date.startsWith(currentMonth));
  const totalIncome = currentMonthTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = currentMonthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const netSavings = totalIncome - totalExpense;

  // Highest Spending Category
  const categoryTotals: Record<string, number> = {};
  currentMonthTxs.filter(t => t.type === 'expense').forEach(t => {
    categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
  });

  let highestCategory = 'N/A';
  let highestCatAmount = 0;
  Object.entries(categoryTotals).forEach(([cat, amt]) => {
    if (amt > highestCatAmount) {
      highestCatAmount = amt;
      highestCategory = cat;
    }
  });

  // Largest Single Transaction
  let largestTxTitle = 'N/A';
  let largestTxAmount = 0;
  currentMonthTxs.filter(t => t.type === 'expense').forEach(t => {
    if (t.amount > largestTxAmount) {
      largestTxAmount = t.amount;
      largestTxTitle = t.title;
    }
  });

  const currentMonthLabel = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });

  // Income vs Expense Comparison Chart Data derived directly from User Transactions
  const comparisonData = React.useMemo(() => {
    const monthsData = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const dateObj = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const yearMonthKey = dateObj.toISOString().substring(0, 7);
      const monthName = dateObj.toLocaleString('en-US', { month: 'short' });

      let monthInc = 0;
      let monthExp = 0;

      transactions.forEach(t => {
        if (t.date && t.date.startsWith(yearMonthKey)) {
          if (t.type === 'income') {
            monthInc += t.amount;
          } else if (t.type === 'expense') {
            monthExp += t.amount;
          }
        }
      });

      monthsData.push({
        name: monthName,
        Income: Math.round(monthInc * 100) / 100,
        Expense: Math.round(monthExp * 100) / 100,
      });
    }
    return monthsData;
  }, [transactions]);

  // Budget vs Actual Performance Chart Data
  const budgetPerformanceData = budgets.map(b => {
    const actualSpent = currentMonthTxs
      .filter(t => t.type === 'expense' && t.category === b.category)
      .reduce((s, t) => s + t.amount, 0);

    return {
      category: b.category,
      Budget: Math.round(b.monthlyLimit * 100) / 100,
      Actual: Math.round(actualSpent * 100) / 100,
    };
  });

  // Account Distribution Data
  const accountDistColors = ['#06b6d4', '#22c55e', '#ec4899', '#eab308', '#8b5cf6', '#ef4444'];
  const accountDistData = accounts.map((acc, idx) => ({
    name: acc.name,
    balance: Math.round(Math.max(0, acc.currentBalance) * 100) / 100,
    color: accountDistColors[idx % accountDistColors.length],
  }));

  // Spending Category Pie
  const categoryPieData = Object.keys(categoryTotals).map((cat, idx) => ({
    name: cat,
    value: Math.round((categoryTotals[cat] || 0) * 100) / 100,
    color: accountDistColors[idx % accountDistColors.length],
  }));

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="comic-box bg-zinc-900 p-4">
        <h1 className="font-comic text-3xl text-yellow-400 flex items-center gap-2">
          <PieChart className="w-7 h-7 text-cyan-400" />
          FINANCIAL REPORTS & INTELLIGENCE
        </h1>
        <p className="text-xs font-mono text-zinc-400">
          In-depth breakdowns, budget vs actual variance, spending categories, and cash flow trends.
        </p>
      </div>

      {/* Monthly Summary Metric Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="comic-box bg-zinc-900 p-4 border-l-8 border-l-green-400">
          <div className="font-pixel text-[9px] text-zinc-400 uppercase">TOTAL MONTHLY INCOME</div>
          <div className="font-comic text-2xl font-bold text-green-400 mt-1">{formatCurrency(totalIncome)}</div>
          <div className="text-[10px] font-mono text-zinc-400 mt-1">{currentMonthLabel} Inflow</div>
        </div>

        <div className="comic-box bg-zinc-900 p-4 border-l-8 border-l-red-400">
          <div className="font-pixel text-[9px] text-zinc-400 uppercase">TOTAL MONTHLY EXPENSES</div>
          <div className="font-comic text-2xl font-bold text-red-400 mt-1">{formatCurrency(totalExpense)}</div>
          <div className="text-[10px] font-mono text-zinc-400 mt-1">{currentMonthLabel} Outflow</div>
        </div>

        <div className="comic-box bg-zinc-900 p-4 border-l-8 border-l-yellow-400">
          <div className="font-pixel text-[9px] text-zinc-400 uppercase">HIGHEST SPENDING CATEGORY</div>
          <div className="font-comic text-xl font-bold text-yellow-400 mt-1 truncate">{highestCategory}</div>
          <div className="text-[10px] font-mono text-zinc-400 mt-1">{formatCurrency(highestCatAmount)} Spent</div>
        </div>

        <div className="comic-box bg-zinc-900 p-4 border-l-8 border-l-cyan-400">
          <div className="font-pixel text-[9px] text-zinc-400 uppercase">LARGEST SINGLE PURCHASE</div>
          <div className="font-comic text-xl font-bold text-cyan-400 mt-1 truncate">{largestTxTitle}</div>
          <div className="text-[10px] font-mono text-zinc-400 mt-1">{formatCurrency(largestTxAmount)} Amount</div>
        </div>
      </div>

      {/* CHARTS GRID 1: Income vs Expense Trend & Budget Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Income vs Expense Line Trend */}
        <div className="comic-box bg-zinc-900 p-5">
          <div className="font-comic text-xl text-yellow-400 mb-4 border-b-2 border-zinc-800 pb-2 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            INCOME VS EXPENSE MONTHLY TREND
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="name" stroke="#a1a1aa" tick={{ fontSize: 11, fontFamily: 'monospace' }} />
                <YAxis stroke="#a1a1aa" tick={{ fontSize: 10, fontFamily: 'monospace' }} />
                <Tooltip 
                  formatter={(value: any, name: any) => [formatCurrency(Number(value || 0)), name || 'Amount']}
                  contentStyle={{ backgroundColor: '#09090b', borderColor: '#000', borderWidth: 2 }}
                  itemStyle={{ fontFamily: 'monospace' }}
                />
                <Legend />
                <Line type="monotone" dataKey="Income" stroke="#22c55e" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="Expense" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Budget vs Actual Spending Variance */}
        <div className="comic-box bg-zinc-900 p-5">
          <div className="font-comic text-xl text-yellow-400 mb-4 border-b-2 border-zinc-800 pb-2 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            BUDGET VS ACTUAL SPENDING PERFORMANCE
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={budgetPerformanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="category" stroke="#a1a1aa" tick={{ fontSize: 10, fontFamily: 'monospace' }} />
                <YAxis stroke="#a1a1aa" tick={{ fontSize: 10, fontFamily: 'monospace' }} />
                <Tooltip 
                  formatter={(value: any, name: any) => [formatCurrency(Number(value || 0)), name || 'Amount']}
                  contentStyle={{ backgroundColor: '#09090b', borderColor: '#000', borderWidth: 2 }}
                  itemStyle={{ fontFamily: 'monospace' }}
                />
                <Legend />
                <Bar dataKey="Budget" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Actual" fill="#ec4899" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* CHARTS GRID 2: Account Distribution & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Account Balance Distribution Pie */}
        <div className="comic-box bg-zinc-900 p-5">
          <div className="font-comic text-xl text-yellow-400 mb-4 border-b-2 border-zinc-800 pb-2">
            ACCOUNT BALANCE DISTRIBUTION
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={accountDistData}
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  dataKey="balance"
                  label={({ name }) => name.split(' ')[0]}
                >
                  {accountDistData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#000" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any, name: any) => [formatCurrency(Number(value || 0)), name || 'Balance']}
                  contentStyle={{ backgroundColor: '#09090b', borderColor: '#000', borderWidth: 2 }}
                  itemStyle={{ fontFamily: 'monospace' }}
                />
              </RePieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Expense Breakdown */}
        <div className="comic-box bg-zinc-900 p-5">
          <div className="font-comic text-xl text-yellow-400 mb-4 border-b-2 border-zinc-800 pb-2">
            EXPENSE CATEGORY SHARE
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={categoryPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {categoryPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#000" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any, name: any) => [formatCurrency(Number(value || 0)), name || 'Spent']}
                  contentStyle={{ backgroundColor: '#09090b', borderColor: '#000', borderWidth: 2 }}
                  itemStyle={{ fontFamily: 'monospace' }}
                />
              </RePieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
};
