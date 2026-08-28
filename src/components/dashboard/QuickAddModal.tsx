import React, { useState } from 'react';
import { 
  X, 
  Upload, 
  Image as ImageIcon, 
  DollarSign, 
  Tag, 
  Repeat, 
  Calendar as CalendarIcon, 
  FileText,
  Building,
  CreditCard
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { TransactionType } from '../../types';
import { arcadeAudio } from '../../utils/audio';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: 'income' | 'expense' | 'transfer';
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({ 
  isOpen, 
  onClose, 
  defaultType = 'expense' 
}) => {
  const { 
    accounts, 
    categories, 
    addTransaction, 
    transferBetweenAccounts, 
    user 
  } = useFinance();

  const [type, setType] = useState<TransactionType>(defaultType);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [subcategory, setSubcategory] = useState<string>('');
  const [accountId, setAccountId] = useState<string>(accounts[0]?.id || '');
  const [toAccountId, setToAccountId] = useState<string>(accounts[1]?.id || '');
  const [notes, setNotes] = useState<string>('');
  const [tagsInput, setTagsInput] = useState<string>('');
  const [receiptUrl, setReceiptUrl] = useState<string>('');
  const [isRecurring, setIsRecurring] = useState<boolean>(false);
  const [recurringFrequency, setRecurringFrequency] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');

  if (!isOpen) return null;

  // Handle image upload for receipt
  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    if (type === 'transfer') {
      transferBetweenAccounts(accountId, toAccountId, numAmount, notes);
    } else {
      const selectedCat = category || (type === 'expense' ? 'Food & Dining' : 'Salary');
      const parsedTags = tagsInput
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      addTransaction({
        date,
        amount: numAmount,
        type,
        title: title || (type === 'expense' ? 'General Purchase' : 'Income Entry'),
        merchant: type === 'expense' ? title : undefined,
        source: type === 'income' ? title : undefined,
        category: selectedCat,
        subcategory: subcategory || undefined,
        accountId,
        notes,
        tags: parsedTags.length > 0 ? parsedTags : ['QuickEntry'],
        receiptUrl: receiptUrl || undefined,
        isRecurring,
        recurringFrequency: isRecurring ? recurringFrequency : undefined,
      });
    }

    onClose();
    // Reset form
    setAmount('');
    setTitle('');
    setNotes('');
    setTagsInput('');
    setReceiptUrl('');
    setIsRecurring(false);
  };

  const filteredCategories = categories.filter(c => c.type === (type === 'income' ? 'income' : 'expense'));

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-zinc-900 border-4 border-black shadow-[8px_8px_0px_#000000] comic-box overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-3.5 bg-zinc-950 border-b-3 border-black">
          <div className="font-comic text-xl text-yellow-400 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-400 stroke-[3]" />
            QUICK FINANCIAL ENTRY
          </div>
          <button
            onClick={() => { arcadeAudio.playClick(); onClose(); }}
            className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4 max-h-[85vh] overflow-y-auto">
          
          {/* Type Toggle Buttons */}
          <div className="grid grid-cols-3 gap-2 p-1 bg-zinc-950 border-2 border-black rounded">
            <button
              type="button"
              onClick={() => { arcadeAudio.playClick(); setType('expense'); }}
              className={`py-2 text-center font-comic text-sm font-bold uppercase rounded border border-black ${
                type === 'expense' ? 'bg-red-500 text-white shadow-[2px_2px_0px_#000]' : 'text-zinc-400 hover:text-white'
              }`}
            >
              💸 EXPENSE
            </button>

            <button
              type="button"
              onClick={() => { arcadeAudio.playClick(); setType('income'); }}
              className={`py-2 text-center font-comic text-sm font-bold uppercase rounded border border-black ${
                type === 'income' ? 'bg-green-500 text-black shadow-[2px_2px_0px_#000]' : 'text-zinc-400 hover:text-white'
              }`}
            >
              💰 INCOME
            </button>

            <button
              type="button"
              onClick={() => { arcadeAudio.playClick(); setType('transfer'); }}
              className={`py-2 text-center font-comic text-sm font-bold uppercase rounded border border-black ${
                type === 'transfer' ? 'bg-cyan-400 text-black shadow-[2px_2px_0px_#000]' : 'text-zinc-400 hover:text-white'
              }`}
            >
              🔄 TRANSFER
            </button>
          </div>

          {/* Amount & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-pixel text-zinc-400 uppercase mb-1">
                AMOUNT ({user.currencySymbol}) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 font-bold text-yellow-400">
                  {user.currencySymbol}
                </span>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-zinc-950 border-2 border-black pl-8 pr-3 py-2 text-lg font-mono text-white font-bold rounded focus:border-yellow-400 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-pixel text-zinc-400 uppercase mb-1">
                DATE *
              </label>
              <div className="relative">
                <CalendarIcon className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-zinc-950 border-2 border-black pl-9 pr-3 py-2 text-sm font-mono text-white rounded focus:border-yellow-400 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Title / Merchant */}
          {type !== 'transfer' && (
            <div>
              <label className="block text-[10px] font-pixel text-zinc-400 uppercase mb-1">
                {type === 'expense' ? 'MERCHANT / PAYEE' : 'INCOME SOURCE'}
              </label>
              <input
                type="text"
                required
                placeholder={type === 'expense' ? 'e.g. SuperMart Groceries, Steam' : 'e.g. Acme Corp, Client Contract'}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-zinc-950 border-2 border-black px-3 py-2 text-sm font-mono text-white rounded focus:border-yellow-400 outline-none"
              />
            </div>
          )}

          {/* Account Selection */}
          {type === 'transfer' ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-pixel text-zinc-400 uppercase mb-1">
                  FROM ACCOUNT
                </label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full bg-zinc-950 border-2 border-black px-3 py-2 text-xs font-mono text-white rounded focus:border-cyan-400 outline-none"
                >
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({user.currencySymbol}{acc.currentBalance.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-pixel text-zinc-400 uppercase mb-1">
                  TO ACCOUNT
                </label>
                <select
                  value={toAccountId}
                  onChange={(e) => setToAccountId(e.target.value)}
                  className="w-full bg-zinc-950 border-2 border-black px-3 py-2 text-xs font-mono text-white rounded focus:border-cyan-400 outline-none"
                >
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({user.currencySymbol}{acc.currentBalance.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-pixel text-zinc-400 uppercase mb-1">
                  CATEGORY
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-zinc-950 border-2 border-black px-3 py-2 text-xs font-mono text-white rounded focus:border-yellow-400 outline-none"
                >
                  <option value="">Select Category...</option>
                  {filteredCategories.map(cat => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-pixel text-zinc-400 uppercase mb-1">
                  ACCOUNT
                </label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full bg-zinc-950 border-2 border-black px-3 py-2 text-xs font-mono text-white rounded focus:border-yellow-400 outline-none"
                >
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({user.currencySymbol}{acc.currentBalance.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Notes & Tags */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-pixel text-zinc-400 uppercase mb-1">
                TAGS (COMMA SEPARATED)
              </label>
              <div className="relative">
                <Tag className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="e.g. Work, Lunch, Urgent"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="w-full bg-zinc-950 border-2 border-black pl-8 pr-2 py-1.5 text-xs font-mono text-white rounded focus:border-yellow-400 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-pixel text-zinc-400 uppercase mb-1">
                NOTES
              </label>
              <input
                type="text"
                placeholder="Optional memo..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-zinc-950 border-2 border-black px-3 py-1.5 text-xs font-mono text-white rounded focus:border-yellow-400 outline-none"
              />
            </div>
          </div>

          {/* Receipt Upload & Recurring options */}
          <div className="p-3 bg-zinc-950 border-2 border-black rounded space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-mono text-zinc-300">
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="w-4 h-4 accent-yellow-400"
                />
                <Repeat className="w-4 h-4 text-yellow-400" />
                <span>Mark as Recurring Transaction</span>
              </label>

              {isRecurring && (
                <select
                  value={recurringFrequency}
                  onChange={(e) => setRecurringFrequency(e.target.value as 'weekly' | 'monthly' | 'yearly')}
                  className="bg-zinc-900 border border-zinc-700 text-xs font-mono text-yellow-400 px-2 py-1 rounded"
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              )}
            </div>

            {/* Receipt File Upload */}
            {type === 'expense' && (
              <div>
                <label className="block text-[10px] font-pixel text-zinc-400 uppercase mb-1">
                  ATTACH RECEIPT PROOF (IMAGE)
                </label>
                <div className="flex items-center gap-3">
                  <label className="comic-btn bg-zinc-800 text-zinc-200 text-xs px-3 py-1.5 flex items-center gap-1.5 font-bold cursor-pointer hover:bg-zinc-700">
                    <Upload className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Choose File</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleReceiptUpload}
                      className="hidden"
                    />
                  </label>
                  {receiptUrl && (
                    <div className="flex items-center gap-1 text-xs text-green-400 font-mono">
                      <ImageIcon className="w-4 h-4" /> Receipt Attached!
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="comic-btn w-full bg-yellow-400 text-black font-comic text-xl py-2.5 font-bold uppercase tracking-wider shadow-[4px_4px_0px_#000]"
          >
            CONFIRM & LOG TRANSACTION ➔
          </button>

        </form>

      </div>
    </div>
  );
};
