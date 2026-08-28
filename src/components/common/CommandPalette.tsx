import React, { useState, useEffect } from 'react';
import { 
  Search, 
  CreditCard, 
  ArrowLeftRight, 
  Plus, 
  Sparkles, 
  X, 
  Navigation,
  FileText
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { arcadeAudio } from '../../utils/audio';

interface CommandPaletteProps {
  onOpenQuickAdd: (defaultType?: 'income' | 'expense') => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ onOpenQuickAdd }) => {
  const { 
    quickCommandOpen, 
    setQuickCommandOpen, 
    accounts, 
    transactions, 
    setActiveView, 
    formatCurrency 
  } = useFinance();

  const [query, setQuery] = useState('');

  // Keyboard shortcut Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        arcadeAudio.playClick();
        setQuickCommandOpen(!quickCommandOpen);
      }
      if (e.key === 'Escape' && quickCommandOpen) {
        setQuickCommandOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [quickCommandOpen, setQuickCommandOpen]);

  if (!quickCommandOpen) return null;

  const filteredAccounts = accounts.filter(a => 
    a.name.toLowerCase().includes(query.toLowerCase()) || 
    a.type.toLowerCase().includes(query.toLowerCase())
  );

  const filteredTransactions = transactions.filter(t => 
    t.title.toLowerCase().includes(query.toLowerCase()) || 
    t.category.toLowerCase().includes(query.toLowerCase()) ||
    (t.notes && t.notes.toLowerCase().includes(query.toLowerCase()))
  ).slice(0, 5);

  const navigationActions = [
    { label: 'Go to Dashboard Overview', view: 'dashboard', icon: Navigation },
    { label: 'View All Accounts', view: 'accounts', icon: CreditCard },
    { label: 'View All Transactions', view: 'transactions', icon: ArrowLeftRight },
    { label: 'Budgets & Financial Goals', view: 'budgets', icon: Sparkles },
    { label: 'Analytics & Financial Reports', view: 'analytics', icon: FileText },
  ].filter(n => n.label.toLowerCase().includes(query.toLowerCase()));

  const handleActionClick = (action: () => void) => {
    arcadeAudio.playClick();
    action();
    setQuickCommandOpen(false);
    setQuery('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start justify-center pt-16 sm:pt-24 px-4">
      <div className="w-full max-w-2xl bg-zinc-900 border-4 border-black shadow-[8px_8px_0px_#000000] comic-box overflow-hidden">
        
        {/* Search Header Input */}
        <div className="flex items-center gap-3 p-4 border-b-3 border-black bg-zinc-950">
          <Search className="w-6 h-6 text-yellow-400 stroke-[2.5]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command, account name, merchant, or action..."
            autoFocus
            className="w-full bg-transparent text-white font-mono text-base outline-none placeholder:text-zinc-500"
          />
          <button 
            onClick={() => setQuickCommandOpen(false)}
            className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results Box */}
        <div className="max-h-96 overflow-y-auto p-4 space-y-4">
          
          {/* Quick Creation Actions */}
          <div>
            <div className="text-[10px] font-pixel text-zinc-500 uppercase tracking-widest mb-2">
              QUICK COMMANDS
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                onClick={() => handleActionClick(() => onOpenQuickAdd('expense'))}
                className="p-2.5 bg-red-950/40 border-2 border-black rounded text-left hover:bg-red-900/60 transition-colors flex items-center gap-2 group"
              >
                <Plus className="w-4 h-4 text-red-400 group-hover:scale-110 transition-transform" />
                <span className="font-comic text-sm text-red-300">Add New Expense</span>
              </button>

              <button
                onClick={() => handleActionClick(() => onOpenQuickAdd('income'))}
                className="p-2.5 bg-green-950/40 border-2 border-black rounded text-left hover:bg-green-900/60 transition-colors flex items-center gap-2 group"
              >
                <Plus className="w-4 h-4 text-green-400 group-hover:scale-110 transition-transform" />
                <span className="font-comic text-sm text-green-300">Add New Income</span>
              </button>
            </div>
          </div>

          {/* Navigation Shortcuts */}
          {navigationActions.length > 0 && (
            <div>
              <div className="text-[10px] font-pixel text-zinc-500 uppercase tracking-widest mb-2">
                NAVIGATION SHORTCUTS
              </div>
              <div className="space-y-1">
                {navigationActions.map((nav, idx) => {
                  const Icon = nav.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleActionClick(() => setActiveView(nav.view))}
                      className="w-full p-2 bg-zinc-950 border border-zinc-800 hover:border-yellow-400 rounded text-left flex items-center justify-between text-zinc-200 hover:text-yellow-400 text-sm font-sans"
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-cyan-400" />
                        <span>{nav.label}</span>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-500">JUMP ➔</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Accounts Result */}
          {filteredAccounts.length > 0 && (
            <div>
              <div className="text-[10px] font-pixel text-zinc-500 uppercase tracking-widest mb-2">
                ACCOUNTS ({filteredAccounts.length})
              </div>
              <div className="space-y-1">
                {filteredAccounts.map(acc => (
                  <button
                    key={acc.id}
                    onClick={() => handleActionClick(() => setActiveView('accounts'))}
                    className="w-full p-2 bg-zinc-950 border border-zinc-800 hover:border-cyan-400 rounded text-left flex items-center justify-between text-zinc-200 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4" style={{ color: acc.color }} />
                      <span className="font-bold">{acc.name}</span>
                    </div>
                    <span className="font-mono text-xs font-bold text-green-400">
                      {formatCurrency(acc.currentBalance)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Transactions Result */}
          {filteredTransactions.length > 0 && (
            <div>
              <div className="text-[10px] font-pixel text-zinc-500 uppercase tracking-widest mb-2">
                MATCHING TRANSACTIONS ({filteredTransactions.length})
              </div>
              <div className="space-y-1">
                {filteredTransactions.map(tx => (
                  <button
                    key={tx.id}
                    onClick={() => handleActionClick(() => setActiveView('transactions'))}
                    className="w-full p-2 bg-zinc-950 border border-zinc-800 hover:border-yellow-400 rounded text-left flex items-center justify-between text-zinc-200 text-xs font-mono"
                  >
                    <div>
                      <div className="font-bold text-white">{tx.title}</div>
                      <div className="text-[10px] text-zinc-400">{tx.date} • {tx.category}</div>
                    </div>
                    <span className={`font-bold ${tx.type === 'expense' ? 'text-red-400' : 'text-green-400'}`}>
                      {tx.type === 'expense' ? '-' : '+'}{formatCurrency(tx.amount)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>

        <div className="p-2.5 bg-zinc-950 border-t-2 border-black text-center text-[10px] font-pixel text-zinc-500 flex items-center justify-between px-4">
          <span>PRESS ESC TO CLOSE</span>
          <span>RETRO COMMAND ENGINE</span>
        </div>

      </div>
    </div>
  );
};
