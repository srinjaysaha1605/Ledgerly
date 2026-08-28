import React, { useState } from 'react';
import { 
  Landmark, 
  PiggyBank, 
  CreditCard, 
  Banknote, 
  TrendingUp, 
  Car, 
  Plus, 
  ArrowLeftRight, 
  Star, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  X,
  Building,
  DollarSign
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Account, AccountType, AccountStatus } from '../../types';
import { arcadeAudio } from '../../utils/audio';

export const AccountsView: React.FC = () => {
  const { 
    accounts, 
    addAccount, 
    editAccount, 
    deleteAccount, 
    transferBetweenAccounts, 
    formatCurrency, 
    user 
  } = useFinance();

  // Transfer Modal State
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [fromAccountId, setFromAccountId] = useState(accounts[0]?.id || '');
  const [toAccountId, setToAccountId] = useState(accounts[1]?.id || '');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferNotes, setTransferNotes] = useState('');

  // Account Modal State (Create / Edit)
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [editingAcc, setEditingAcc] = useState<Account | null>(null);

  const [accName, setAccName] = useState('');
  const [accType, setAccType] = useState<AccountType>('bank');
  const [accOpeningBal, setAccOpeningBal] = useState('');
  const [accNumber, setAccNumber] = useState('');
  const [accColor, setAccColor] = useState('#06b6d4');
  const [accStatus, setAccStatus] = useState<AccountStatus>('active');

  const accountTypeIcons: Record<AccountType, React.ElementType> = {
    bank: Landmark,
    savings: PiggyBank,
    credit: CreditCard,
    debit: CreditCard,
    cash: Banknote,
    investment: TrendingUp,
    loan: Car,
  };

  const colorOptions = ['#06b6d4', '#22c55e', '#ec4899', '#eab308', '#8b5cf6', '#ef4444', '#f97316'];

  const handleOpenCreateModal = () => {
    arcadeAudio.playClick();
    setEditingAcc(null);
    setAccName('');
    setAccType('bank');
    setAccOpeningBal('1000.00');
    setAccNumber('');
    setAccColor('#06b6d4');
    setAccStatus('active');
    setAccountModalOpen(true);
  };

  const handleOpenEditModal = (acc: Account) => {
    arcadeAudio.playClick();
    setEditingAcc(acc);
    setAccName(acc.name);
    setAccType(acc.type);
    setAccOpeningBal(acc.openingBalance.toString());
    setAccNumber(acc.accountNumber || '');
    setAccColor(acc.color);
    setAccStatus(acc.status);
    setAccountModalOpen(true);
  };

  const handleAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const openBal = parseFloat(accOpeningBal) || 0;

    if (editingAcc) {
      editAccount({
        ...editingAcc,
        name: accName,
        type: accType,
        openingBalance: openBal,
        accountNumber: accNumber || undefined,
        color: accColor,
        status: accStatus,
      });
    } else {
      addAccount({
        name: accName,
        type: accType,
        openingBalance: openBal,
        status: accStatus,
        color: accColor,
        icon: 'Landmark',
        accountNumber: accNumber || undefined,
        isFavorite: false,
      });
    }

    setAccountModalOpen(false);
  };

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(transferAmount);
    if (amt > 0) {
      transferBetweenAccounts(fromAccountId, toAccountId, amt, transferNotes);
      setTransferModalOpen(false);
      setTransferAmount('');
      setTransferNotes('');
    }
  };

  const toggleFavorite = (acc: Account) => {
    editAccount({ ...acc, isFavorite: !acc.isFavorite });
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 comic-box bg-zinc-900 p-4">
        <div>
          <h1 className="font-comic text-3xl text-yellow-400">
            ACCOUNT VAULT MANAGEMENT
          </h1>
          <p className="text-xs font-mono text-zinc-400">
            Manage banks, savings, cards, cash wallets, investments, and loans in one retro panel.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => { arcadeAudio.playClick(); setTransferModalOpen(true); }}
            className="comic-btn bg-cyan-400 text-black font-comic text-base px-4 py-2 font-bold flex items-center gap-2 uppercase"
          >
            <ArrowLeftRight className="w-5 h-5 stroke-[2.5]" />
            TRANSFER FUNDS
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="comic-btn bg-yellow-400 text-black font-comic text-base px-4 py-2 font-bold flex items-center gap-2 uppercase"
          >
            <Plus className="w-5 h-5 stroke-[3]" />
            ADD ACCOUNT
          </button>
        </div>
      </div>

      {/* Account Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {accounts.map((acc) => {
          const IconComp = accountTypeIcons[acc.type] || Landmark;

          return (
            <div 
              key={acc.id}
              className="comic-box bg-zinc-900 p-5 flex flex-col justify-between relative group hover:border-yellow-400 transition-colors"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 border-2 border-black flex items-center justify-center text-black font-pixel shadow-[3px_3px_0px_#000]"
                      style={{ backgroundColor: acc.color }}
                    >
                      <IconComp className="w-5 h-5 stroke-[2.5]" />
                    </div>
                    <div>
                      <div className="font-comic text-xl text-white truncate max-w-[160px]">
                        {acc.name}
                      </div>
                      <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                        {acc.type} {acc.accountNumber && `• ${acc.accountNumber}`}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleFavorite(acc)}
                    className={`p-1 rounded ${acc.isFavorite ? 'text-yellow-400' : 'text-zinc-600 hover:text-yellow-400'}`}
                  >
                    <Star className={`w-5 h-5 ${acc.isFavorite ? 'fill-yellow-400' : ''}`} />
                  </button>
                </div>

                <div className="my-4 bg-zinc-950 p-3 border-2 border-black rounded shadow-[2px_2px_0px_#000]">
                  <div className="text-[10px] font-pixel text-zinc-500 uppercase">
                    CURRENT BALANCE
                  </div>
                  <div className={`font-comic text-3xl font-bold mt-1 ${
                    acc.currentBalance < 0 ? 'text-red-400' : 'text-green-400'
                  }`}>
                    {formatCurrency(acc.currentBalance)}
                  </div>
                  <div className="text-[10px] font-mono text-zinc-400 mt-1 flex justify-between">
                    <span>Opening: {formatCurrency(acc.openingBalance)}</span>
                    <span className={acc.status === 'active' ? 'text-green-400' : 'text-zinc-500'}>
                      ● {acc.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t-2 border-zinc-800 pt-3">
                <button
                  onClick={() => handleOpenEditModal(acc)}
                  className="comic-btn bg-zinc-800 text-zinc-200 hover:text-yellow-400 p-1.5 text-xs font-mono flex items-center gap-1"
                >
                  <Edit3 className="w-3.5 h-3.5" /> EDIT
                </button>
                <button
                  onClick={() => deleteAccount(acc.id)}
                  className="comic-btn bg-red-950/60 text-red-400 hover:bg-red-900 p-1.5 text-xs font-mono flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> DELETE
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {/* MODAL 1: Account Create / Edit Modal */}
      {accountModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-zinc-900 border-4 border-black shadow-[8px_8px_0px_#000000] comic-box overflow-hidden">
            
            <div className="flex items-center justify-between p-3.5 bg-zinc-950 border-b-3 border-black">
              <div className="font-comic text-xl text-yellow-400">
                {editingAcc ? 'EDIT ACCOUNT RECORD' : 'CREATE NEW ACCOUNT'}
              </div>
              <button
                onClick={() => setAccountModalOpen(false)}
                className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAccountSubmit} className="p-4 space-y-3 font-sans">
              <div>
                <label className="block text-[10px] font-pixel text-zinc-400 uppercase mb-1">
                  ACCOUNT NAME
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cyber Vault Checking"
                  value={accName}
                  onChange={(e) => setAccName(e.target.value)}
                  className="w-full bg-zinc-950 border-2 border-black px-3 py-2 text-sm text-white font-mono rounded focus:border-yellow-400 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-pixel text-zinc-400 uppercase mb-1">
                    ACCOUNT TYPE
                  </label>
                  <select
                    value={accType}
                    onChange={(e) => setAccType(e.target.value as AccountType)}
                    className="w-full bg-zinc-950 border-2 border-black px-2 py-2 text-xs text-white font-mono rounded focus:border-yellow-400 outline-none"
                  >
                    <option value="bank">Bank Account</option>
                    <option value="savings">Savings Account</option>
                    <option value="credit">Credit Card</option>
                    <option value="debit">Debit Card</option>
                    <option value="cash">Cash Wallet</option>
                    <option value="investment">Investment</option>
                    <option value="loan">Loan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-pixel text-zinc-400 uppercase mb-1">
                    OPENING BALANCE ({user.currencySymbol})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={accOpeningBal}
                    onChange={(e) => setAccOpeningBal(e.target.value)}
                    className="w-full bg-zinc-950 border-2 border-black px-3 py-2 text-sm text-white font-mono rounded focus:border-yellow-400 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-pixel text-zinc-400 uppercase mb-1">
                  ACCOUNT NUMBER / CARD DIGITS (OPTIONAL)
                </label>
                <input
                  type="text"
                  placeholder="•••• 4821"
                  value={accNumber}
                  onChange={(e) => setAccNumber(e.target.value)}
                  className="w-full bg-zinc-950 border-2 border-black px-3 py-1.5 text-xs text-white font-mono rounded focus:border-yellow-400 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-pixel text-zinc-400 uppercase mb-1">
                  THEME ACCENT COLOR
                </label>
                <div className="flex items-center gap-2">
                  {colorOptions.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setAccColor(c)}
                      className={`w-7 h-7 rounded border-2 border-black ${accColor === c ? 'scale-110 ring-2 ring-yellow-400' : ''}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="comic-btn w-full bg-yellow-400 text-black font-comic text-lg py-2 font-bold uppercase mt-2"
              >
                SAVE ACCOUNT ➔
              </button>
            </form>

          </div>
        </div>
      )}

      {/* MODAL 2: Account Transfer Modal */}
      {transferModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-zinc-900 border-4 border-black shadow-[8px_8px_0px_#000000] comic-box overflow-hidden">
            
            <div className="flex items-center justify-between p-3.5 bg-zinc-950 border-b-3 border-black">
              <div className="font-comic text-xl text-yellow-400 flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5 text-cyan-400" />
                TRANSFER BETWEEN ACCOUNTS
              </div>
              <button
                onClick={() => setTransferModalOpen(false)}
                className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTransferSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-[10px] font-pixel text-zinc-400 uppercase mb-1">
                  FROM SOURCE ACCOUNT
                </label>
                <select
                  value={fromAccountId}
                  onChange={(e) => setFromAccountId(e.target.value)}
                  className="w-full bg-zinc-950 border-2 border-black px-3 py-2 text-xs font-mono text-white rounded outline-none"
                >
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({formatCurrency(acc.currentBalance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-pixel text-zinc-400 uppercase mb-1">
                  TO DESTINATION ACCOUNT
                </label>
                <select
                  value={toAccountId}
                  onChange={(e) => setToAccountId(e.target.value)}
                  className="w-full bg-zinc-950 border-2 border-black px-3 py-2 text-xs font-mono text-white rounded outline-none"
                >
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({formatCurrency(acc.currentBalance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-pixel text-zinc-400 uppercase mb-1">
                  TRANSFER AMOUNT ({user.currencySymbol})
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="500.00"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className="w-full bg-zinc-950 border-2 border-black px-3 py-2 text-base font-mono text-white font-bold rounded outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-pixel text-zinc-400 uppercase mb-1">
                  TRANSFER NOTES
                </label>
                <input
                  type="text"
                  placeholder="Reason for transfer..."
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  className="w-full bg-zinc-950 border-2 border-black px-3 py-1.5 text-xs font-mono text-white rounded outline-none"
                />
              </div>

              <button
                type="submit"
                className="comic-btn w-full bg-cyan-400 text-black font-comic text-lg py-2.5 font-bold uppercase"
              >
                EXECUTE TRANSFER ➔
              </button>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
