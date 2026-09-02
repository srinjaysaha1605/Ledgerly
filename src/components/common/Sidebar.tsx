import React from 'react';
import { 
  LayoutDashboard, 
  CreditCard, 
  ArrowLeftRight, 
  Target, 
  PieChart, 
  Calendar as CalendarIcon, 
  User, 
  ShieldCheck,
  Award
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { arcadeAudio } from '../../utils/audio';

export const Sidebar: React.FC = () => {
  const { activeView, setActiveView, user, accounts, transactions, formatCurrency } = useFinance();

  // Net worth calculation
  const totalAssets = accounts
    .filter(a => a.currentBalance > 0)
    .reduce((sum, a) => sum + a.currentBalance, 0);

  const navItems = [
    { id: 'dashboard', label: 'DASHBOARD', icon: LayoutDashboard },
    { id: 'accounts', label: 'ACCOUNTS', icon: CreditCard, count: accounts.length },
    { id: 'transactions', label: 'TRANSACTIONS', icon: ArrowLeftRight, count: transactions.length },
    { id: 'budgets', label: 'BUDGETS & GOALS', icon: Target },
    { id: 'analytics', label: 'ANALYTICS', icon: PieChart },
    { id: 'calendar', label: 'CALENDAR', icon: CalendarIcon },
    { id: 'profile', label: 'PROFILE', icon: User },
  ];

  return (
    <aside className="w-full md:w-64 bg-[#16213E] border-r-0 md:border-r-4 border-b-4 md:border-b-0 border-black p-2.5 sm:p-4 flex flex-col justify-between shadow-[4px_0_0_0_#000] shrink-0">
      
      {/* Navigation Items */}
      <div className="w-full">
        <nav className="flex md:flex-col overflow-x-auto md:overflow-visible gap-2 pb-1.5 md:pb-0 w-full scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  arcadeAudio.playClick();
                  setActiveView(item.id);
                }}
                className={`comic-btn shrink-0 md:shrink w-auto md:w-full p-2 md:p-2.5 flex items-center gap-2 md:gap-3 font-comic text-xs sm:text-sm md:text-base font-bold tracking-wide transition-all border-2 sm:border-4 border-black whitespace-nowrap ${
                  isActive
                    ? 'bg-[#00D2FF] text-black shadow-[3px_3px_0px_#000]'
                    : 'bg-[#1A1A2E] text-white hover:bg-[#222244] hover:text-[#F9ED69] shadow-[3px_3px_0px_#000]'
                }`}
              >
                <Icon className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 ${isActive ? 'text-black' : 'text-[#00D2FF]'}`} />
                <span>{item.label}</span>

                {item.count !== undefined && (
                  <span className={`ml-1 md:ml-auto text-[10px] sm:text-xs font-mono px-1.5 rounded ${
                    isActive ? 'bg-black text-[#00D2FF] font-bold' : 'bg-[#16213E] text-zinc-300'
                  }`}>
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Player Status Footer Card */}
      <div className="mt-6 pt-4 border-t-2 border-black hidden md:block">
        <div className="comic-box bg-[#1A1A2E] p-3 border-4 border-black shadow-[4px_4px_0_0_#000]">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-5 h-5 text-[#F9ED69]" />
            <div className="font-comic text-sm text-[#F9ED69] truncate">
              {user.fullName}
            </div>
          </div>

          <div className="space-y-1 font-mono text-xs text-zinc-300">
            <div className="flex justify-between">
              <span>TOTAL ASSETS:</span>
              <span className="text-[#00D2FF] font-bold">{formatCurrency(totalAssets)}</span>
            </div>
            <div className="flex justify-between">
              <span>STATUS:</span>
              <span className="text-[#F9ED69] font-bold">ONLINE</span>
            </div>
          </div>

          <div className="mt-3 bg-black border-2 border-black p-1.5 rounded text-[10px] font-pixel text-zinc-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#00E676]" />
            <span>ENCRYPTED & SYNCED</span>
          </div>
        </div>
      </div>

    </aside>
  );
};
