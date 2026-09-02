import React, { useState } from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  PieChart as RePieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { 
  Zap, 
  TrendingUp, 
  TrendingDown, 
  PiggyBank, 
  Plus, 
  Repeat, 
  ArrowRight, 
  Sparkles, 
  Eye, 
  Trash2, 
  GripVertical,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Bot,
  Send,
  HelpCircle,
  Lightbulb,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Transaction } from '../../types';
import { arcadeAudio } from '../../utils/audio';

interface DashboardViewProps {
  onOpenQuickAdd: (type?: 'income' | 'expense') => void;
  onViewReceipt: (url: string, title: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ 
  onOpenQuickAdd, 
  onViewReceipt 
}) => {
  const { 
    accounts, 
    transactions, 
    budgets, 
    goals, 
    insights, 
    isGeneratingInsights,
    refreshInsights,
    setActiveView, 
    deleteTransaction, 
    formatCurrency,
    user 
  } = useFinance();

  const [txSearch, setTxSearch] = useState('');

  // Metrics Calculations
  const totalBalance = accounts.reduce((sum, a) => sum + a.currentBalance, 0);

  const currentMonth = new Date().toISOString().substring(0, 7);
  const monthlyIncome = transactions
    .filter(t => t.type === 'income' && t.date.startsWith(currentMonth))
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyExpense = transactions
    .filter(t => t.type === 'expense' && t.date.startsWith(currentMonth))
    .reduce((sum, t) => sum + t.amount, 0);

  const netSavings = monthlyIncome - monthlyExpense;
  const savingsRate = monthlyIncome > 0 ? Math.max(0, (netSavings / monthlyIncome) * 100) : 0;

  // Recent filtered transactions
  const filteredTxs = transactions.filter(t => 
    t.title.toLowerCase().includes(txSearch.toLowerCase()) ||
    t.category.toLowerCase().includes(txSearch.toLowerCase())
  ).slice(0, 6);

  // Real Dynamic Cash Flow Chart Data derived directly from User Transactions (Last 6 Months)
  const chartData = React.useMemo(() => {
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
        month: monthName,
        income: Math.round(monthInc * 100) / 100,
        expense: Math.round(monthExp * 100) / 100,
      });
    }
    return monthsData;
  }, [transactions]);

  // Category Expense Donut Chart Data
  const expenseCatTotals: Record<string, number> = {};
  transactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      expenseCatTotals[t.category] = (expenseCatTotals[t.category] || 0) + t.amount;
    });

  const pieColors = ['#ef4444', '#f97316', '#3b82f6', '#eab308', '#ec4899', '#8b5cf6', '#06b6d4'];
  const pieData = Object.keys(expenseCatTotals).map((cat, idx) => ({
    name: cat,
    value: Math.round((expenseCatTotals[cat] || 0) * 100) / 100,
    color: pieColors[idx % pieColors.length],
  }));

  const upcomingRecurring = transactions
    .filter(t => t.isRecurring)
    .slice(0, 4);

  return (
    <div className="space-y-6">
      
      {/* Overview Top Hero Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Total Balance */}
        <div className="comic-box p-4 comic-box-cyan relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <span className="font-pixel text-[10px] text-black font-bold uppercase tracking-widest">
              TOTAL BALANCE
            </span>
            <div className="w-8 h-8 bg-black border-2 border-black flex items-center justify-center text-[#00D2FF] font-pixel font-bold shadow-[2px_2px_0px_#000]">
              $
            </div>
          </div>
          <div className="font-comic text-3xl font-black text-black tracking-wide">
            {formatCurrency(totalBalance)}
          </div>
          <div className="mt-2 text-xs font-mono font-bold text-black flex items-center gap-1">
            <ArrowUpRight className="w-4 h-4 stroke-[2.5]" /> Across {accounts.length} Accounts
          </div>
        </div>

        {/* Metric 2: Monthly Income */}
        <div className="comic-box p-4 comic-box-green relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <span className="font-pixel text-[10px] text-black font-bold uppercase tracking-widest">
              MONTHLY INFLOW
            </span>
            <div className="w-8 h-8 bg-black border-2 border-black flex items-center justify-center text-[#00E676] font-pixel shadow-[2px_2px_0px_#000]">
              <TrendingUp className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
          <div className="font-comic text-3xl font-black text-black tracking-wide">
            +{formatCurrency(monthlyIncome)}
          </div>
          <div className="mt-2 text-xs font-mono font-bold text-black flex items-center gap-1">
            <span>Payday & Freelance Inflow</span>
          </div>
        </div>

        {/* Metric 3: Monthly Expense */}
        <div className="comic-box p-4 comic-box-pink relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <span className="font-pixel text-[10px] text-black font-bold uppercase tracking-widest">
              MONTHLY OUTFLOW
            </span>
            <div className="w-8 h-8 bg-black border-2 border-black flex items-center justify-center text-[#E94560] font-pixel shadow-[2px_2px_0px_#000]">
              <TrendingDown className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
          <div className="font-comic text-3xl font-black text-black tracking-wide">
            -{formatCurrency(monthlyExpense)}
          </div>
          <div className="mt-2 text-xs font-mono font-bold text-black flex items-center gap-1">
            <span>Living & Fun Expenses</span>
          </div>
        </div>

        {/* Metric 4: Savings Rate */}
        <div className="comic-box p-4 comic-box-yellow relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <span className="font-pixel text-[10px] text-black font-bold uppercase tracking-widest">
              SAVINGS RATE
            </span>
            <div className="w-8 h-8 bg-black border-2 border-black flex items-center justify-center text-[#F9ED69] font-pixel shadow-[2px_2px_0px_#000]">
              <PiggyBank className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
          <div className="font-comic text-3xl font-black text-black tracking-wide">
            {savingsRate.toFixed(1)}%
          </div>
          <div className="mt-2 text-xs font-mono font-bold text-black flex items-center gap-1">
            <span>Net Boost: {formatCurrency(netSavings)}</span>
          </div>
        </div>

      </div>

      {/* Hero Advisor: Smart Financial Insights */}
      <div className="comic-box bg-zinc-900 p-5 bg-halftone">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b-3 border-black pb-3">
          <div className="flex items-center gap-3">
            <div className="font-comic text-2xl text-yellow-400 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-yellow-400 animate-pulse" />
              SMART FINANCIAL INSIGHTS
            </div>
            <span className="font-pixel text-[9px] bg-cyan-400 text-black px-2 py-1 border border-black font-bold flex items-center gap-1 shadow-[2px_2px_0px_#000]">
              <Zap className="w-3 h-3" />
              LEDGER ANALYSIS
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={isGeneratingInsights}
              onClick={() => {
                arcadeAudio.playClick();
                refreshInsights();
              }}
              className="font-pixel text-[10px] bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-black px-3 py-1.5 border-2 border-black font-bold shadow-[2px_2px_0px_#000] flex items-center gap-1.5 transition-transform active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
              title="Generate fresh financial insights"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingInsights ? 'animate-spin' : ''}`} />
              {isGeneratingInsights ? 'ANALYZING LEDGER...' : 'RE-ANALYZE'}
            </button>
          </div>
        </div>

        {/* Dynamic Real Insights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {insights.map((ins) => (
            <div 
              key={ins.id}
              className={`p-3.5 border-2 border-black rounded shadow-[3px_3px_0px_#000] relative bg-zinc-950 flex flex-col justify-between transition-all hover:-translate-y-0.5 ${
                ins.type === 'positive' ? 'border-l-8 border-l-green-400' :
                ins.type === 'warning' ? 'border-l-8 border-l-yellow-400' :
                ins.type === 'milestone' ? 'border-l-8 border-l-pink-400' : 'border-l-8 border-l-cyan-400'
              }`}
            >
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="font-comic text-sm font-bold text-white uppercase tracking-wide flex items-center gap-1.5 leading-snug">
                    {ins.type === 'positive' && <Zap className="w-3.5 h-3.5 text-green-400 shrink-0" />}
                    {ins.type === 'warning' && <AlertCircle className="w-3.5 h-3.5 text-yellow-400 shrink-0" />}
                    {ins.type === 'milestone' && <Target className="w-3.5 h-3.5 text-pink-400 shrink-0" />}
                    {ins.type === 'tip' && <Lightbulb className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                    <span>{ins.title}</span>
                  </span>
                </div>
                <p className="text-xs text-zinc-300 font-sans leading-relaxed">
                  {ins.description}
                </p>
              </div>

              {ins.impactValue && (
                <div className="mt-3 text-xs font-mono font-bold text-cyan-400 border-t border-zinc-800 pt-1.5 flex items-center justify-between">
                  <span className="text-[10px] text-zinc-400 font-pixel">METRIC</span>
                  <span>{ins.impactValue}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Charts & Controls Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Cash Flow Interactive Chart */}
        <div className="lg:col-span-2 comic-box bg-zinc-900 p-5">
          <div className="flex items-center justify-between mb-4 border-b-2 border-zinc-800 pb-2">
            <div className="font-comic text-xl text-yellow-400 flex items-center gap-2">
              <Zap className="w-5 h-5 text-cyan-400" />
              CASH FLOW TREND (INFLOW VS OUTFLOW)
            </div>
            <button 
              onClick={() => { arcadeAudio.playClick(); setActiveView('analytics'); }}
              className="text-xs font-comic text-cyan-400 hover:underline flex items-center gap-1"
            >
              DETAILED REPORT ➔
            </button>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="month" stroke="#a1a1aa" tick={{ fontSize: 12, fontFamily: 'monospace' }} />
                <YAxis stroke="#a1a1aa" tick={{ fontSize: 10, fontFamily: 'monospace' }} />
                <Tooltip 
                  formatter={(value: any, name: any) => [formatCurrency(Number(value || 0)), name || 'Amount']}
                  contentStyle={{ backgroundColor: '#09090b', borderColor: '#000', borderWidth: 2, borderRadius: 4 }}
                  itemStyle={{ fontFamily: 'monospace', fontSize: 12 }}
                />
                <Bar dataKey="income" fill="#22c55e" name="Income ($)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" fill="#ef4444" name="Expenses ($)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Category Donut Breakout */}
        <div className="comic-box bg-zinc-900 p-5">
          <div className="flex items-center justify-between mb-4 border-b-2 border-zinc-800 pb-2">
            <div className="font-comic text-xl text-yellow-400">
              SPENDING CATEGORIES
            </div>
          </div>

          <div className="h-44 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={65}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
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

          <div className="space-y-1.5 mt-2 max-h-28 overflow-y-auto pr-1">
            {pieData.map((d, i) => (
              <div key={i} className="flex items-center justify-between text-xs font-mono text-zinc-300">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 border border-black" style={{ backgroundColor: d.color }} />
                  <span className="truncate max-w-[110px]">{d.name}</span>
                </div>
                <span className="font-bold text-white">{formatCurrency(d.value)}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Bottom Grid: Recent Transactions Table & Upcoming Recurring Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Transactions Table */}
        <div className="lg:col-span-2 comic-box bg-zinc-900 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b-2 border-zinc-800 pb-3">
            <div className="font-comic text-xl text-yellow-400">
              RECENT TRANSACTIONS LOG
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Filter recent..."
                value={txSearch}
                onChange={(e) => setTxSearch(e.target.value)}
                className="bg-zinc-950 border border-zinc-700 text-xs font-mono text-white px-2.5 py-1 rounded outline-none focus:border-yellow-400"
              />

              <button
                onClick={() => { arcadeAudio.playClick(); setActiveView('transactions'); }}
                className="text-xs font-comic text-cyan-400 hover:underline whitespace-nowrap"
              >
                VIEW ALL ➔
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans text-xs">
              <thead className="bg-zinc-950 text-zinc-400 font-pixel text-[9px] uppercase border-b-2 border-black">
                <tr>
                  <th className="p-2">Date</th>
                  <th className="p-2">Title / Payee</th>
                  <th className="p-2">Category</th>
                  <th className="p-2 text-right">Amount</th>
                  <th className="p-2 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {filteredTxs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-zinc-500 font-mono text-xs">
                      No matching transactions found.
                    </td>
                  </tr>
                ) : (
                  filteredTxs.map(tx => (
                    <tr key={tx.id} className="hover:bg-zinc-800/60 transition-colors">
                      <td className="p-2 font-mono text-zinc-400 whitespace-nowrap">{tx.date}</td>
                      <td className="p-2">
                        <div className="font-bold text-white">{tx.title}</div>
                        {tx.notes && <div className="text-[10px] text-zinc-500 truncate max-w-[150px]">{tx.notes}</div>}
                      </td>
                      <td className="p-2">
                        <span className="bg-zinc-800 border border-zinc-700 text-zinc-300 px-2 py-0.5 rounded text-[10px] font-mono">
                          {tx.category}
                        </span>
                      </td>
                      <td className={`p-2 text-right font-mono font-bold whitespace-nowrap ${
                        tx.type === 'expense' ? 'text-red-400' : tx.type === 'income' ? 'text-green-400' : 'text-cyan-400'
                      }`}>
                        {tx.type === 'expense' ? '-' : '+'}{formatCurrency(tx.amount)}
                      </td>
                      <td className="p-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {tx.receiptUrl && (
                            <button
                              onClick={() => onViewReceipt(tx.receiptUrl!, tx.title)}
                              title="View Receipt Image"
                              className="p-1 hover:bg-zinc-700 rounded text-cyan-400"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteTransaction(tx.id)}
                            title="Delete Record"
                            className="p-1 hover:bg-red-950 rounded text-zinc-500 hover:text-red-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Upcoming Recurring Payments & Goals Snapshot */}
        <div className="space-y-6">
          
          {/* Upcoming Recurring */}
          <div className="comic-box bg-zinc-900 p-5">
            <div className="flex items-center justify-between mb-3 border-b-2 border-zinc-800 pb-2">
              <div className="font-comic text-xl text-yellow-400 flex items-center gap-1.5">
                <Repeat className="w-5 h-5 text-yellow-400" />
                RECURRING BILLS
              </div>
            </div>

            <div className="space-y-2">
              {upcomingRecurring.map(tx => (
                <div key={tx.id} className="p-2.5 bg-zinc-950 border border-zinc-800 rounded flex items-center justify-between">
                  <div>
                    <div className="font-comic text-sm text-white">{tx.title}</div>
                    <div className="text-[10px] font-mono text-zinc-400">Freq: {tx.recurringFrequency}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-xs font-bold text-red-400">-{formatCurrency(tx.amount)}</div>
                    <span className="text-[9px] font-pixel bg-zinc-800 text-yellow-400 px-1 py-0.5 rounded">
                      AUTO PAY
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Goal Progress Snapshot */}
          <div className="comic-box bg-zinc-900 p-5">
            <div className="flex items-center justify-between mb-3 border-b-2 border-zinc-800 pb-2">
              <div className="font-comic text-xl text-yellow-400 flex items-center gap-1.5">
                <Target className="w-5 h-5 text-cyan-400" />
                ACTIVE SAVINGS GOALS
              </div>
              <button
                onClick={() => { arcadeAudio.playClick(); setActiveView('budgets'); }}
                className="text-xs font-comic text-cyan-400 hover:underline"
              >
                GOALS PAGE ➔
              </button>
            </div>

            <div className="space-y-3">
              {goals.slice(0, 2).map(goal => {
                const pct = Math.min(100, (goal.currentProgress / goal.targetAmount) * 100);
                return (
                  <div key={goal.id} className="p-2.5 bg-zinc-950 border border-zinc-800 rounded">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-comic text-sm text-white">{goal.name}</span>
                      <span className="font-mono text-xs font-bold text-cyan-400">{pct.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-zinc-800 h-2.5 rounded-full overflow-hidden border border-black">
                      <div 
                        className="bg-cyan-400 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] font-mono text-zinc-400 mt-1">
                      <span>Saved: {formatCurrency(goal.currentProgress)}</span>
                      <span>Target: {formatCurrency(goal.targetAmount)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
