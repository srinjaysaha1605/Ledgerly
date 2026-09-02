import React, { useState } from 'react';
import { 
  Target, 
  AlertTriangle, 
  Plus, 
  Edit3, 
  Trash2, 
  Trophy, 
  Sparkles, 
  CheckCircle2, 
  X,
  PiggyBank,
  ArrowUpRight,
  ShieldCheck
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { getLocalYearMonth } from '../../utils/dateUtils';
import { Budget, Goal } from '../../types';
import { arcadeAudio } from '../../utils/audio';

export const BudgetsView: React.FC = () => {
  const { 
    budgets, 
    goals, 
    transactions, 
    categories, 
    accounts,
    addBudget, 
    editBudget, 
    deleteBudget, 
    addGoal, 
    editGoal, 
    deleteGoal, 
    depositToGoal,
    formatCurrency, 
    user 
  } = useFinance();

  const currentMonth = getLocalYearMonth(new Date());

  // Budget Modal State
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [budCategory, setBudCategory] = useState(categories[0]?.name || 'Food & Dining');
  const [budLimit, setBudLimit] = useState('');
  const [budThreshold, setBudThreshold] = useState('80');

  // Goal Modal State
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalDeadline, setGoalDeadline] = useState('2026-12-31');
  const [goalColor, setGoalColor] = useState('#06b6d4');

  // Deposit Modal State
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [targetGoalId, setTargetGoalId] = useState<string>('');
  const [depositAmount, setDepositAmount] = useState('');
  const [sourceAccountId, setSourceAccountId] = useState(accounts[0]?.id || '');

  const handleOpenBudgetModal = (b?: Budget) => {
    arcadeAudio.playClick();
    if (b) {
      setEditingBudget(b);
      setBudCategory(b.category);
      setBudLimit(b.monthlyLimit.toString());
      setBudThreshold(b.alertThreshold.toString());
    } else {
      setEditingBudget(null);
      setBudCategory(categories[0]?.name || 'Food & Dining');
      setBudLimit('500.00');
      setBudThreshold('80');
    }
    setBudgetModalOpen(true);
  };

  const handleBudgetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const limit = parseFloat(budLimit) || 0;
    const threshold = parseInt(budThreshold) || 80;

    if (editingBudget) {
      editBudget({
        ...editingBudget,
        category: budCategory,
        monthlyLimit: limit,
        alertThreshold: threshold,
      });
    } else {
      addBudget({
        category: budCategory,
        monthlyLimit: limit,
        period: currentMonth,
        alertThreshold: threshold,
      });
    }
    setBudgetModalOpen(false);
  };

  const handleOpenGoalModal = (g?: Goal) => {
    arcadeAudio.playClick();
    if (g) {
      setEditingGoal(g);
      setGoalName(g.name);
      setGoalTarget(g.targetAmount.toString());
      setGoalDeadline(g.deadline);
      setGoalColor(g.color);
    } else {
      setEditingGoal(null);
      setGoalName('');
      setGoalTarget('2000.00');
      setGoalDeadline('2026-12-31');
      setGoalColor('#06b6d4');
    }
    setGoalModalOpen(true);
  };

  const handleGoalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseFloat(goalTarget) || 0;

    if (editingGoal) {
      editGoal({
        ...editingGoal,
        name: goalName,
        targetAmount: target,
        deadline: goalDeadline,
        color: goalColor,
      });
    } else {
      addGoal({
        name: goalName,
        targetAmount: target,
        deadline: goalDeadline,
        color: goalColor,
        icon: 'Gamepad2',
      });
    }
    setGoalModalOpen(false);
  };

  const handleOpenDepositModal = (goalId: string) => {
    arcadeAudio.playClick();
    setTargetGoalId(goalId);
    setDepositAmount('');
    setDepositModalOpen(true);
  };

  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(depositAmount);
    if (amt > 0 && targetGoalId) {
      depositToGoal(targetGoalId, amt, sourceAccountId);
      setDepositModalOpen(false);
    }
  };

  return (
    <div className="space-y-8">
      
      {/* SECTION 1: MONTHLY CATEGORY BUDGETS */}
      <div className="space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 comic-box bg-zinc-900 p-4">
          <div>
            <h1 className="font-comic text-3xl text-yellow-400 flex items-center gap-2">
              <Target className="w-7 h-7 text-yellow-400 stroke-[2.5]" />
              CATEGORY BUDGET ALLOCATIONS
            </h1>
            <p className="text-xs font-mono text-zinc-400">
              Set spending caps and power thresholds to avoid budget burnouts.
            </p>
          </div>

          <button
            onClick={() => handleOpenBudgetModal()}
            className="comic-btn bg-yellow-400 text-black font-comic text-base px-4 py-2 font-bold flex items-center gap-2 uppercase"
          >
            <Plus className="w-5 h-5 stroke-[3]" /> CREATE BUDGET CAP
          </button>
        </div>

        {/* Budget Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map((b) => {
            const monthSpent = transactions
              .filter(t => t.type === 'expense' && t.category === b.category && t.date.startsWith(currentMonth))
              .reduce((sum, t) => sum + t.amount, 0);

            const remaining = b.monthlyLimit - monthSpent;
            const pct = Math.min(100, (monthSpent / b.monthlyLimit) * 100);
            const isAlert = pct >= b.alertThreshold;

            return (
              <div 
                key={b.id}
                className={`comic-box p-4 flex flex-col justify-between ${
                  isAlert ? 'comic-box-pink' : 'comic-box-cyan'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-comic text-xl text-black font-extrabold uppercase truncate">
                      {b.category}
                    </span>
                    <span className={`font-pixel text-[9px] px-2 py-0.5 rounded border border-black font-bold ${
                      pct >= 100 ? 'bg-red-600 text-white animate-pulse' :
                      isAlert ? 'bg-black text-[#F9ED69]' : 'bg-black text-[#00D2FF]'
                    }`}>
                      {pct >= 100 ? 'OVER BUDGET' : isAlert ? 'POWER ALERT' : 'SAFE ZONE'}
                    </span>
                  </div>

                  {/* Utilization Progress Bar */}
                  <div className="my-3">
                    <div className="flex justify-between items-center text-xs font-mono mb-1">
                      <span className="text-black font-extrabold">Spent: {formatCurrency(monthSpent)}</span>
                      <span className="text-black font-bold">Cap: {formatCurrency(b.monthlyLimit)}</span>
                    </div>

                    <div className="w-full bg-black h-3.5 rounded border-2 border-black overflow-hidden p-0.5">
                      <div 
                        className={`h-full rounded-sm transition-all duration-500 ${
                          pct >= 100 ? 'bg-red-500' : isAlert ? 'bg-yellow-400' : 'bg-cyan-400'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex justify-between text-xs font-mono pt-1">
                    <span className="text-black font-bold">Remaining Cap:</span>
                    <span className={`font-black ${remaining < 0 ? 'text-red-950 underline' : 'text-black'}`}>
                      {formatCurrency(remaining)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 border-t-2 border-black pt-3 mt-4">
                  <button
                    onClick={() => handleOpenBudgetModal(b)}
                    className="comic-btn bg-black text-white hover:text-[#F9ED69] p-1.5 text-xs font-mono font-bold"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> EDIT
                  </button>
                  <button
                    onClick={() => deleteBudget(b.id)}
                    className="comic-btn bg-[#E94560] text-white p-1.5 text-xs font-mono font-bold"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> DELETE
                  </button>
                </div>

              </div>
            );
          })}
        </div>

      </div>

      {/* SECTION 2: FINANCIAL SAVINGS GOALS */}
      <div className="space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 comic-box bg-zinc-900 p-4">
          <div>
            <h2 className="font-comic text-3xl text-yellow-400 flex items-center gap-2">
              <Trophy className="w-7 h-7 text-cyan-400 stroke-[2.5]" />
              FINANCIAL GOALS & SAVINGS QUESTS
            </h2>
            <p className="text-xs font-mono text-zinc-400">
              Level up savings goals, fund goals directly from accounts, and earn milestone rewards.
            </p>
          </div>

          <button
            onClick={() => handleOpenGoalModal()}
            className="comic-btn bg-cyan-400 text-black font-comic text-base px-4 py-2 font-bold flex items-center gap-2 uppercase"
          >
            <Plus className="w-5 h-5 stroke-[3]" /> NEW SAVINGS GOAL
          </button>
        </div>

        {/* Goals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {goals.map((goal) => {
            const pct = Math.min(100, (goal.currentProgress / goal.targetAmount) * 100);
            const isCompleted = goal.currentProgress >= goal.targetAmount;

            return (
              <div 
                key={goal.id}
                className={`comic-box p-5 flex flex-col justify-between ${
                  isCompleted ? 'comic-box-green' : 'comic-box-yellow'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="font-comic text-xl text-black font-extrabold">
                      {goal.name}
                    </div>
                    {isCompleted ? (
                      <span className="font-pixel text-[9px] bg-black text-[#00E676] px-2 py-0.5 font-bold border border-black animate-pulse">
                        LEVEL 100% DONE
                      </span>
                    ) : (
                      <span className="font-pixel text-[9px] bg-black text-[#F9ED69] px-2 py-0.5 border border-black font-bold">
                        {pct.toFixed(0)}% FUNDED
                      </span>
                    )}
                  </div>

                  <div className="text-xs font-mono text-black font-bold mb-3">
                    Target Deadline: <span className="text-black font-black underline">{goal.deadline}</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="my-3">
                    <div className="flex justify-between text-xs font-mono mb-1">
                      <span className="text-black font-black">{formatCurrency(goal.currentProgress)}</span>
                      <span className="text-black font-bold">{formatCurrency(goal.targetAmount)}</span>
                    </div>

                    <div className="w-full bg-black h-4 rounded border-2 border-black overflow-hidden p-0.5">
                      <div 
                        className="h-full rounded-sm transition-all duration-500 bg-cyan-400"
                        style={{ width: `${pct}%`, backgroundColor: goal.color }}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2 border-t-2 border-black pt-3 mt-3">
                  {!isCompleted && (
                    <button
                      onClick={() => handleOpenDepositModal(goal.id)}
                      className="comic-btn w-full bg-black text-[#F9ED69] font-comic text-sm py-1.5 font-bold uppercase flex items-center justify-center gap-1.5"
                    >
                      <PiggyBank className="w-4 h-4 stroke-[2.5]" /> FUND / DEPOSIT GOLD
                    </button>
                  )}

                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleOpenGoalModal(goal)}
                      className="comic-btn bg-black text-white hover:text-[#F9ED69] p-1.5 text-xs font-mono font-bold"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> EDIT
                    </button>
                    <button
                      onClick={() => deleteGoal(goal.id)}
                      className="comic-btn bg-[#E94560] text-white p-1.5 text-xs font-mono font-bold"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> DELETE
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>

      </div>

      {/* MODAL 1: Budget Create / Edit Modal */}
      {budgetModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-zinc-900 border-4 border-black comic-box p-4">
            <div className="flex justify-between items-center border-b-2 border-black pb-2 mb-3">
              <span className="font-comic text-xl text-yellow-400">
                {editingBudget ? 'EDIT CATEGORY BUDGET' : 'CREATE CATEGORY BUDGET'}
              </span>
              <button onClick={() => setBudgetModalOpen(false)}>
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>

            <form onSubmit={handleBudgetSubmit} className="space-y-3 font-sans text-xs">
              <div>
                <label className="block font-pixel text-[10px] text-zinc-400 uppercase mb-1">
                  CATEGORY
                </label>
                <select
                  value={budCategory}
                  onChange={(e) => setBudCategory(e.target.value)}
                  className="w-full bg-zinc-950 border-2 border-black px-2.5 py-1.5 font-mono text-white rounded"
                >
                  {categories.filter(c => c.type === 'expense').map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-pixel text-[10px] text-zinc-400 uppercase mb-1">
                  MONTHLY SPENDING CAP ({user.currencySymbol})
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="500.00"
                  value={budLimit}
                  onChange={(e) => setBudLimit(e.target.value)}
                  className="w-full bg-zinc-950 border-2 border-black px-3 py-1.5 font-mono text-white text-base font-bold rounded"
                />
              </div>

              <div>
                <label className="block font-pixel text-[10px] text-zinc-400 uppercase mb-1">
                  ALERT THRESHOLD PERCENTAGE (%)
                </label>
                <input
                  type="number"
                  required
                  min="50"
                  max="100"
                  value={budThreshold}
                  onChange={(e) => setBudThreshold(e.target.value)}
                  className="w-full bg-zinc-950 border-2 border-black px-3 py-1.5 font-mono text-white rounded"
                />
              </div>

              <button
                type="submit"
                className="comic-btn w-full bg-yellow-400 text-black font-comic text-lg py-2 font-bold uppercase mt-2"
              >
                SAVE BUDGET CAP ➔
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Goal Create / Edit Modal */}
      {goalModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-zinc-900 border-4 border-black comic-box p-4">
            <div className="flex justify-between items-center border-b-2 border-black pb-2 mb-3">
              <span className="font-comic text-xl text-yellow-400">
                {editingGoal ? 'EDIT SAVINGS GOAL' : 'CREATE SAVINGS GOAL'}
              </span>
              <button onClick={() => setGoalModalOpen(false)}>
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>

            <form onSubmit={handleGoalSubmit} className="space-y-3 font-sans text-xs">
              <div>
                <label className="block font-pixel text-[10px] text-zinc-400 uppercase mb-1">
                  GOAL NAME
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Retro VR Arcade Rig"
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                  className="w-full bg-zinc-950 border-2 border-black px-3 py-1.5 font-mono text-white rounded"
                />
              </div>

              <div>
                <label className="block font-pixel text-[10px] text-zinc-400 uppercase mb-1">
                  TARGET AMOUNT ({user.currencySymbol})
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="2500.00"
                  value={goalTarget}
                  onChange={(e) => setGoalTarget(e.target.value)}
                  className="w-full bg-zinc-950 border-2 border-black px-3 py-1.5 font-mono text-white text-base font-bold rounded"
                />
              </div>

              <div>
                <label className="block font-pixel text-[10px] text-zinc-400 uppercase mb-1">
                  TARGET DEADLINE
                </label>
                <input
                  type="date"
                  required
                  value={goalDeadline}
                  onChange={(e) => setGoalDeadline(e.target.value)}
                  className="w-full bg-zinc-950 border-2 border-black px-3 py-1.5 font-mono text-white rounded"
                />
              </div>

              <button
                type="submit"
                className="comic-btn w-full bg-cyan-400 text-black font-comic text-lg py-2 font-bold uppercase mt-2"
              >
                SAVE SAVINGS QUEST ➔
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Goal Deposit Fund Modal */}
      {depositModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-zinc-900 border-4 border-black comic-box p-4">
            <div className="flex justify-between items-center border-b-2 border-black pb-2 mb-3">
              <span className="font-comic text-xl text-yellow-400">
                FUND / DEPOSIT GOLD TO GOAL
              </span>
              <button onClick={() => setDepositModalOpen(false)}>
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>

            <form onSubmit={handleDepositSubmit} className="space-y-3 font-sans text-xs">
              <div>
                <label className="block font-pixel text-[10px] text-zinc-400 uppercase mb-1">
                  PAYMENT SOURCE ACCOUNT
                </label>
                <select
                  value={sourceAccountId}
                  onChange={(e) => setSourceAccountId(e.target.value)}
                  className="w-full bg-zinc-950 border-2 border-black px-2.5 py-2 font-mono text-white rounded"
                >
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({formatCurrency(acc.currentBalance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-pixel text-[10px] text-zinc-400 uppercase mb-1">
                  DEPOSIT AMOUNT ({user.currencySymbol})
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="200.00"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full bg-zinc-950 border-2 border-black px-3 py-2 font-mono text-yellow-400 text-lg font-bold rounded"
                />
              </div>

              <button
                type="submit"
                className="comic-btn w-full bg-yellow-400 text-black font-comic text-xl py-2 font-bold uppercase mt-2"
              >
                CONFIRM DEPOSIT ➔
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
