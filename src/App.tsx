import React, { useState } from 'react';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';
import { CommandPalette } from './components/common/CommandPalette';
import { UndoToast } from './components/common/UndoToast';
import { ReceiptModal } from './components/common/ReceiptModal';
import { AuthModal } from './components/auth/AuthModal';
import { AuthScreen } from './components/auth/AuthScreen';

import { DashboardView } from './components/dashboard/DashboardView';
import { QuickAddModal } from './components/dashboard/QuickAddModal';
import { AccountsView } from './components/accounts/AccountsView';
import { TransactionsView } from './components/transactions/TransactionsView';
import { BudgetsView } from './components/budgets/BudgetsView';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { CalendarView } from './components/calendar/CalendarView';
import { ProfileView } from './components/profile/ProfileView';

const MainLayout: React.FC = () => {
  const { activeView, isLoggedIn } = useFinance();

  // Quick Add Modal state
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddType, setQuickAddType] = useState<'income' | 'expense' | 'transfer'>('expense');

  // Receipt Modal state
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [receiptTitle, setReceiptTitle] = useState<string>('');

  const handleOpenQuickAdd = (type?: 'income' | 'expense') => {
    setQuickAddType(type || 'expense');
    setQuickAddOpen(true);
  };

  const handleViewReceipt = (url: string, title: string) => {
    setReceiptUrl(url);
    setReceiptTitle(title);
  };

  if (!isLoggedIn) {
    return <AuthScreen />;
  }

  return (
    <div className="min-h-screen bg-[#0F0F1B] text-white flex flex-col font-sans-body selection:bg-[#F9ED69] selection:text-black bg-bento-grid">
      
      {/* Top Navbar */}
      <Navbar onOpenQuickAdd={() => handleOpenQuickAdd('expense')} />

      {/* Body Area with Sidebar + Active View */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex flex-col md:flex-row min-w-0 overflow-x-hidden">
        
        {/* Navigation Sidebar */}
        <Sidebar />

        {/* View Stage */}
        <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-x-hidden min-h-[calc(100vh-80px)] min-w-0">
          {activeView === 'dashboard' && (
            <DashboardView 
              onOpenQuickAdd={handleOpenQuickAdd} 
              onViewReceipt={handleViewReceipt} 
            />
          )}

          {activeView === 'accounts' && <AccountsView />}

          {activeView === 'transactions' && (
            <TransactionsView 
              onOpenQuickAdd={handleOpenQuickAdd} 
              onViewReceipt={handleViewReceipt} 
            />
          )}

          {activeView === 'budgets' && <BudgetsView />}

          {activeView === 'analytics' && <AnalyticsView />}

          {activeView === 'calendar' && (
            <CalendarView onOpenQuickAdd={handleOpenQuickAdd} />
          )}

          {activeView === 'profile' && <ProfileView />}
        </main>

      </div>

      {/* Global Modals & Overlays */}
      <QuickAddModal 
        isOpen={quickAddOpen} 
        onClose={() => setQuickAddOpen(false)} 
        defaultType={quickAddType}
      />

      <CommandPalette 
        onOpenQuickAdd={(type) => handleOpenQuickAdd(type || 'expense')} 
      />

      <ReceiptModal 
        receiptUrl={receiptUrl} 
        title={receiptTitle} 
        onClose={() => setReceiptUrl(null)} 
      />

      <AuthModal />

      <UndoToast />

    </div>
  );
};

export default function App() {
  return (
    <FinanceProvider>
      <MainLayout />
    </FinanceProvider>
  );
}
