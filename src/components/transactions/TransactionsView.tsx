import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Printer, 
  Plus, 
  Eye, 
  Edit2, 
  Trash2, 
  Calendar, 
  Tag, 
  Building, 
  DollarSign, 
  ArrowUpDown,
  Repeat,
  Check
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Transaction, TransactionType } from '../../types';
import { exportTransactionsToCSV, printFinancialReportPDF } from '../../utils/exportUtils';
import { arcadeAudio } from '../../utils/audio';

interface TransactionsViewProps {
  onOpenQuickAdd: (type?: 'income' | 'expense') => void;
  onViewReceipt: (url: string, title: string) => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({ 
  onOpenQuickAdd, 
  onViewReceipt 
}) => {
  const { 
    transactions, 
    accounts, 
    categories, 
    deleteTransaction, 
    editTransaction,
    user, 
    formatCurrency 
  } = useFinance();

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const [minAmount, setMinAmount] = useState<string>('');
  const [maxAmount, setMaxAmount] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('all');

  // Sorting
  const [sortField, setSortField] = useState<'date' | 'amount' | 'title'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Edit Modal State
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  // Extract all unique tags
  const allTags = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach(t => t.tags?.forEach(tag => set.add(tag)));
    return Array.from(set);
  }, [transactions]);

  // Filter & Sort Logic
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      // Type Filter
      if (selectedType !== 'all' && t.type !== selectedType) return false;
      // Category Filter
      if (selectedCategory !== 'all' && t.category !== selectedCategory) return false;
      // Account Filter
      if (selectedAccount !== 'all' && t.accountId !== selectedAccount) return false;
      // Tag Filter
      if (selectedTag !== 'all' && !t.tags?.includes(selectedTag)) return false;
      // Amount Filter
      if (minAmount && t.amount < parseFloat(minAmount)) return false;
      if (maxAmount && t.amount > parseFloat(maxAmount)) return false;
      // Date Filter
      if (startDate && t.date < startDate) return false;
      if (endDate && t.date > endDate) return false;
      // Text Search
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchTitle = t.title?.toLowerCase().includes(q);
        const matchCat = t.category?.toLowerCase().includes(q);
        const matchNotes = t.notes?.toLowerCase().includes(q);
        if (!matchTitle && !matchCat && !matchNotes) return false;
      }
      return true;
    }).sort((a, b) => {
      let valA = a[sortField] || '';
      let valB = b[sortField] || '';
      if (sortField === 'amount') {
        valA = a.amount;
        valB = b.amount;
      }
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [
    transactions, selectedType, selectedCategory, selectedAccount, 
    selectedTag, minAmount, maxAmount, startDate, endDate, 
    searchQuery, sortField, sortOrder
  ]);

  const handleExportCSV = () => {
    arcadeAudio.playClick();
    exportTransactionsToCSV(filteredTransactions, accounts, user.currencySymbol);
  };

  const handlePrintPDF = () => {
    arcadeAudio.playClick();
    const totalInc = filteredTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const totalExp = filteredTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    printFinancialReportPDF(user, accounts, filteredTransactions, [], [], totalInc, totalExp);
  };

  const handleSortToggle = (field: 'date' | 'amount' | 'title') => {
    arcadeAudio.playClick();
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTx) {
      editTransaction(editingTx);
      setEditingTx(null);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Controls & Export Bar */}
      <div className="comic-box bg-zinc-900 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="font-comic text-3xl text-yellow-400">
            TRANSACTION LOG & SEARCH
          </h1>
          <p className="text-xs font-mono text-zinc-400">
            Filter, sort, export CSV/PDF, and search all income, expenses, and transfers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="comic-btn bg-zinc-800 text-zinc-200 hover:text-yellow-400 font-comic text-sm px-3 py-1.5 font-bold flex items-center gap-1.5 uppercase"
          >
            <Download className="w-4 h-4 text-cyan-400" /> EXPORT CSV
          </button>

          <button
            onClick={handlePrintPDF}
            className="comic-btn bg-zinc-800 text-zinc-200 hover:text-yellow-400 font-comic text-sm px-3 py-1.5 font-bold flex items-center gap-1.5 uppercase"
          >
            <Printer className="w-4 h-4 text-yellow-400" /> PRINT REPORT
          </button>

          <button
            onClick={() => { arcadeAudio.playCoin(); onOpenQuickAdd('expense'); }}
            className="comic-btn bg-yellow-400 text-black font-comic text-sm px-4 py-1.5 font-bold flex items-center gap-1.5 uppercase"
          >
            <Plus className="w-4 h-4 stroke-[3]" /> NEW RECORD
          </button>
        </div>
      </div>

      {/* Advanced Filter Panel */}
      <div className="comic-box bg-zinc-900 p-4 space-y-3 bg-halftone">
        <div className="flex items-center gap-2 font-comic text-lg text-yellow-400 border-b-2 border-zinc-800 pb-2">
          <Filter className="w-5 h-5 text-cyan-400" />
          ADVANCED FILTER & SEARCH PALETTE
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* Instant Search input */}
          <div>
            <label className="block text-[10px] font-pixel text-zinc-400 uppercase mb-1">
              SEARCH TEXT
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Payee, merchant, notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-950 border-2 border-black pl-8 pr-2 py-1.5 text-xs text-white font-mono rounded outline-none focus:border-yellow-400"
              />
            </div>
          </div>

          {/* Type Selector */}
          <div>
            <label className="block text-[10px] font-pixel text-zinc-400 uppercase mb-1">
              TRANSACTION TYPE
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full bg-zinc-950 border-2 border-black px-2 py-1.5 text-xs text-white font-mono rounded outline-none"
            >
              <option value="all">All Types</option>
              <option value="expense">Expense Only</option>
              <option value="income">Income Only</option>
              <option value="transfer">Transfers Only</option>
            </select>
          </div>

          {/* Category Selector */}
          <div>
            <label className="block text-[10px] font-pixel text-zinc-400 uppercase mb-1">
              CATEGORY
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-zinc-950 border-2 border-black px-2 py-1.5 text-xs text-white font-mono rounded outline-none"
            >
              <option value="all">All Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Account Selector */}
          <div>
            <label className="block text-[10px] font-pixel text-zinc-400 uppercase mb-1">
              ACCOUNT
            </label>
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="w-full bg-zinc-950 border-2 border-black px-2 py-1.5 text-xs text-white font-mono rounded outline-none"
            >
              <option value="all">All Accounts</option>
              {accounts.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

        </div>

        {/* Date & Amount Ranges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-zinc-800 pt-3">
          <div>
            <label className="block text-[9px] font-pixel text-zinc-400 uppercase mb-1">START DATE</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 px-2 py-1 text-xs text-white font-mono rounded"
            />
          </div>

          <div>
            <label className="block text-[9px] font-pixel text-zinc-400 uppercase mb-1">END DATE</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 px-2 py-1 text-xs text-white font-mono rounded"
            />
          </div>

          <div>
            <label className="block text-[9px] font-pixel text-zinc-400 uppercase mb-1">MIN AMOUNT ({user.currencySymbol})</label>
            <input
              type="number"
              placeholder="0.00"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 px-2 py-1 text-xs text-white font-mono rounded"
            />
          </div>

          <div>
            <label className="block text-[9px] font-pixel text-zinc-400 uppercase mb-1">MAX AMOUNT ({user.currencySymbol})</label>
            <input
              type="number"
              placeholder="10000.00"
              value={maxAmount}
              onChange={(e) => setMaxAmount(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 px-2 py-1 text-xs text-white font-mono rounded"
            />
          </div>
        </div>

      </div>

      {/* Main Transactions Data Table */}
      <div className="comic-box bg-zinc-900 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="font-comic text-lg text-yellow-400">
            SHOWING {filteredTransactions.length} RECORDS
          </div>

          {/* Quick Sort Controls */}
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
            <span>SORT BY:</span>
            <button
              onClick={() => handleSortToggle('date')}
              className={`px-2 py-1 border rounded ${sortField === 'date' ? 'bg-yellow-400 text-black border-black font-bold' : 'bg-zinc-800'}`}
            >
              DATE {sortField === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => handleSortToggle('amount')}
              className={`px-2 py-1 border rounded ${sortField === 'amount' ? 'bg-yellow-400 text-black border-black font-bold' : 'bg-zinc-800'}`}
            >
              AMOUNT {sortField === 'amount' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans text-xs">
            <thead className="bg-zinc-950 text-zinc-400 font-pixel text-[9px] uppercase border-b-3 border-black">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Title / Payee</th>
                <th className="p-3">Category</th>
                <th className="p-3">Account</th>
                <th className="p-3">Tags</th>
                <th className="p-3 text-right">Amount</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-zinc-500 font-mono text-sm">
                    No transactions match your search filter criteria.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map(tx => {
                  const account = accounts.find(a => a.id === tx.accountId);

                  return (
                    <tr key={tx.id} className="hover:bg-zinc-800/80 transition-colors">
                      <td className="p-3 font-mono text-zinc-400 whitespace-nowrap">
                        {tx.date}
                        {tx.isRecurring && (
                          <span title="Recurring" className="ml-1 text-yellow-400 font-bold">
                            🔄
                          </span>
                        )}
                      </td>

                      <td className="p-3">
                        <div className="font-bold text-white text-sm">{tx.title}</div>
                        {tx.notes && (
                          <div className="text-[11px] text-zinc-400 italic max-w-xs truncate">
                            {tx.notes}
                          </div>
                        )}
                      </td>

                      <td className="p-3">
                        <span className="bg-zinc-950 border border-zinc-700 text-zinc-200 px-2 py-0.5 rounded text-[10px] font-mono">
                          {tx.category}
                        </span>
                      </td>

                      <td className="p-3 font-mono text-zinc-300">
                        {account?.name || 'Main Vault'}
                      </td>

                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {tx.tags?.map((tag, idx) => (
                            <span key={idx} className="bg-cyan-950 text-cyan-300 border border-cyan-800 text-[9px] px-1.5 py-0.5 rounded font-mono">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className={`p-3 text-right font-mono text-sm font-bold whitespace-nowrap ${
                        tx.type === 'expense' ? 'text-red-400' : tx.type === 'income' ? 'text-green-400' : 'text-cyan-400'
                      }`}>
                        {tx.type === 'expense' ? '-' : '+'}{formatCurrency(tx.amount)}
                      </td>

                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {tx.receiptUrl && (
                            <button
                              onClick={() => onViewReceipt(tx.receiptUrl!, tx.title)}
                              title="View Receipt"
                              className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-cyan-400 rounded border border-black"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => setEditingTx(tx)}
                            title="Edit Record"
                            className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-yellow-400 rounded border border-black"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => deleteTransaction(tx.id)}
                            title="Delete Record"
                            className="p-1.5 bg-red-950 hover:bg-red-900 text-red-400 rounded border border-black"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Transaction Modal */}
      {editingTx && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-zinc-900 border-4 border-black shadow-[8px_8px_0px_#000000] comic-box p-4">
            <div className="font-comic text-xl text-yellow-400 mb-3 border-b-2 border-black pb-2">
              EDIT TRANSACTION RECORD
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3 font-sans text-xs">
              <div>
                <label className="block font-pixel text-[10px] text-zinc-400 uppercase mb-1">TITLE</label>
                <input
                  type="text"
                  required
                  value={editingTx.title}
                  onChange={(e) => setEditingTx({ ...editingTx, title: e.target.value })}
                  className="w-full bg-zinc-950 border-2 border-black px-2.5 py-1.5 font-mono text-white rounded"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-pixel text-[10px] text-zinc-400 uppercase mb-1">AMOUNT ({user.currencySymbol})</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editingTx.amount}
                    onChange={(e) => setEditingTx({ ...editingTx, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-zinc-950 border-2 border-black px-2.5 py-1.5 font-mono text-white rounded"
                  />
                </div>

                <div>
                  <label className="block font-pixel text-[10px] text-zinc-400 uppercase mb-1">DATE</label>
                  <input
                    type="date"
                    required
                    value={editingTx.date}
                    onChange={(e) => setEditingTx({ ...editingTx, date: e.target.value })}
                    className="w-full bg-zinc-950 border-2 border-black px-2.5 py-1.5 font-mono text-white rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block font-pixel text-[10px] text-zinc-400 uppercase mb-1">CATEGORY</label>
                <select
                  value={editingTx.category}
                  onChange={(e) => setEditingTx({ ...editingTx, category: e.target.value })}
                  className="w-full bg-zinc-950 border-2 border-black px-2 py-1.5 font-mono text-white rounded"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-pixel text-[10px] text-zinc-400 uppercase mb-1">NOTES</label>
                <input
                  type="text"
                  value={editingTx.notes || ''}
                  onChange={(e) => setEditingTx({ ...editingTx, notes: e.target.value })}
                  className="w-full bg-zinc-950 border-2 border-black px-2.5 py-1.5 font-mono text-white rounded"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-black">
                <button
                  type="button"
                  onClick={() => setEditingTx(null)}
                  className="comic-btn bg-zinc-800 text-zinc-300 px-3 py-1 font-comic text-sm"
                >
                  CANCEL
                </button>

                <button
                  type="submit"
                  className="comic-btn bg-yellow-400 text-black px-4 py-1 font-comic text-sm font-bold uppercase"
                >
                  SAVE CHANGES
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
