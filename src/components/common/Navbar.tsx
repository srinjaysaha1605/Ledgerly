import React, { useState } from 'react';
import { 
  Gamepad2, 
  Plus, 
  Search, 
  Bell, 
  Volume2, 
  VolumeX, 
  User, 
  LogOut, 
  CheckCircle2, 
  Shield, 
  Settings,
  DollarSign,
  Sparkles,
  ChevronDown,
  Trash2,
  X
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { arcadeAudio } from '../../utils/audio';

interface NavbarProps {
  onOpenQuickAdd: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenQuickAdd }) => {
  const { 
    user, 
    notifications, 
    soundEnabled, 
    setSoundEnabled, 
    setQuickCommandOpen, 
    setAuthModalOpen, 
    setAuthTab,
    isLoggedIn, 
    setIsLoggedIn,
    setActiveView,
    activeView,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
    clearAllNotifications,
    formatCurrency,
    updateUserProfile
  } = useFinance();

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);

  const currencies = [
    { code: 'INR', symbol: '₹', name: 'INR (₹ - Indian Rupee)' },
    { code: 'USD', symbol: '$', name: 'USD ($ - US Dollar)' },
    { code: 'EUR', symbol: '€', name: 'EUR (€ - Euro)' },
    { code: 'GBP', symbol: '£', name: 'GBP (£ - British Pound)' },
    { code: 'JPY', symbol: '¥', name: 'JPY (¥ - Japanese Yen)' },
    { code: 'CAD', symbol: 'CA$', name: 'CAD (CA$ - Canadian Dollar)' },
    { code: 'AUD', symbol: 'A$', name: 'AUD (A$ - Australian Dollar)' },
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  const displayName = (user.fullName && user.fullName.trim())
    ? user.fullName
    : (user.email && user.email.trim())
      ? user.email.split('@')[0]
      : 'User';

  const handleLogout = () => {
    arcadeAudio.playClick();
    setIsLoggedIn(false);
    setProfileDropdownOpen(false);
    setAuthTab('login');
    setAuthModalOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#1A1A2E] border-b-4 border-black px-2.5 sm:px-4 py-2.5 sm:py-3 shadow-[0_4px_0_0_#000]">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4 overflow-x-clip">
        
        {/* Brand / Logo */}
        <div 
          onClick={() => { arcadeAudio.playClick(); setActiveView('dashboard'); }}
          className="flex items-center gap-2 sm:gap-3 cursor-pointer group shrink-0"
        >
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#E94560] border-2 sm:border-3 border-black comic-btn flex items-center justify-center text-black font-pixel shadow-[2px_2px_0px_#000] sm:shadow-[3px_3px_0px_#000] rotate-2">
            <span className="text-base sm:text-xl font-black italic text-black">$</span>
          </div>
          <div>
            <div className="font-comic text-xl sm:text-2xl tracking-wider text-[#F9ED69] drop-shadow-[2px_2px_0px_#000] flex items-center gap-1 leading-none uppercase italic">
              Ledger<span className="text-[#00D2FF]">ly</span>
            </div>
            <div className="text-[9px] sm:text-[10px] font-pixel text-zinc-400 uppercase tracking-widest mt-0.5 hidden sm:block">
              PERSONAL FINANCE TRACKER
            </div>
          </div>
        </div>

        {/* Global Search / Command Palette Bar */}
        <div 
          onClick={() => { arcadeAudio.playClick(); setQuickCommandOpen(true); }}
          className="hidden md:flex items-center gap-2 bg-black border-2 border-white/20 px-3 py-1.5 rounded cursor-pointer hover:border-[#F9ED69] transition-colors shadow-[2px_2px_0px_#000] text-zinc-300 text-xs font-mono w-64 lg:w-80"
        >
          <Search className="w-4 h-4 text-[#F9ED69]" />
          <span className="flex-1 truncate">Search transactions, accounts...</span>
          <kbd className="bg-[#16213E] border border-black text-[#F9ED69] px-1.5 py-0.5 rounded text-[10px] font-pixel">
            Ctrl + K
          </kbd>
        </div>

        {/* Actions & Utilities */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          
          {/* Quick Add Button */}
          <button
            onClick={() => { arcadeAudio.playCoin(); onOpenQuickAdd(); }}
            className="comic-btn bg-[#F9ED69] text-black font-comic text-xs sm:text-base px-2 sm:px-4 py-1 sm:py-1.5 flex items-center gap-1 sm:gap-1.5 font-bold uppercase tracking-wide hover:bg-[#ffe066]"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3]" />
            <span className="hidden sm:inline">QUICK ADD</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? "Disable Arcade Audio" : "Enable Arcade Audio"}
            className="comic-btn bg-[#16213E] text-zinc-100 p-1.5 sm:p-2 hover:bg-[#1A1A2E] hover:text-[#F9ED69]"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" /> : <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-[#E94560]" />}
          </button>

          {/* Currency Indicator / Quick Switcher */}
          <div className="relative">
            <button
              onClick={() => {
                arcadeAudio.playClick();
                setCurrencyDropdownOpen(!currencyDropdownOpen);
                setNotificationsOpen(false);
                setProfileDropdownOpen(false);
              }}
              title="Quick Change Currency"
              className="comic-btn bg-[#16213E] text-[#00D2FF] px-1.5 sm:px-2.5 py-1 sm:py-1.5 flex items-center gap-1 text-[11px] sm:text-xs font-bold font-mono hover:bg-[#1A1A2E]"
            >
              <span className="font-bold text-[#F9ED69]">{user.currencySymbol || "$"}</span>
              <span className="hidden xs:inline">{user.currency}</span>
              <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-zinc-300" />
            </button>

            {currencyDropdownOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-[#16213E] border-4 border-black shadow-[6px_6px_0px_#000000] z-50 p-2 comic-box">
                <div className="font-pixel text-[10px] text-[#F9ED69] uppercase px-2 py-1 border-b-2 border-black mb-1.5 flex items-center justify-between">
                  <span>SELECT CURRENCY</span>
                  <Sparkles className="w-3 h-3 text-[#F9ED69]" />
                </div>
                <div className="space-y-1">
                  {currencies.map((c) => (
                    <button
                      key={c.code}
                      onClick={() => {
                        arcadeAudio.playCoin();
                        updateUserProfile({ currency: c.code, currencySymbol: c.symbol });
                        setCurrencyDropdownOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded font-mono text-xs flex items-center justify-between border-2 border-black transition-all ${
                        user.currency === c.code
                          ? 'bg-[#00D2FF] text-black font-extrabold shadow-[2px_2px_0px_#000]'
                          : 'bg-[#1A1A2E] text-white hover:bg-black hover:text-[#F9ED69]'
                      }`}
                    >
                      <span>{c.name}</span>
                      {user.currency === c.code && <CheckCircle2 className="w-3.5 h-3.5 text-black shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => { arcadeAudio.playClick(); setNotificationsOpen(!notificationsOpen); setProfileDropdownOpen(false); }}
              className="comic-btn bg-[#16213E] text-zinc-100 p-2 relative hover:bg-[#1A1A2E] hover:text-[#F9ED69]"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#E94560] text-white font-pixel text-[9px] px-1.5 py-0.5 rounded-full border-2 border-black animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#16213E] border-4 border-black shadow-[6px_6px_0px_#000000] z-50 p-4 comic-box">
                <div className="flex items-center justify-between border-b-2 border-black pb-2 mb-3">
                  <div className="font-comic text-lg text-[#F9ED69] flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#F9ED69]" />
                    SYSTEM ALERTS
                  </div>
                  <div className="flex items-center gap-3">
                    {unreadCount > 0 && (
                      <button 
                        onClick={markAllNotificationsRead}
                        className="text-xs text-[#00D2FF] hover:underline font-mono"
                      >
                        Mark all read
                      </button>
                    )}
                    {notifications.length > 0 && (
                      <button 
                        onClick={clearAllNotifications}
                        className="text-xs text-red-400 hover:underline font-mono flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {notifications.length === 0 ? (
                    <div className="text-center py-6 text-zinc-400 font-mono text-xs">
                      NO ACTIVE ALERTS
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div 
                        key={n.id}
                        className={`p-2.5 border-2 border-black rounded transition-all relative group ${
                          n.read ? 'bg-black/40 opacity-60' : 'bg-[#1A1A2E] border-black shadow-[2px_2px_0px_#000]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span 
                            onClick={() => markNotificationRead(n.id)}
                            className={`text-xs font-comic font-bold cursor-pointer ${
                              n.type === 'warning' ? 'text-[#F9ED69]' :
                              n.type === 'alert' ? 'text-[#E94560]' :
                              n.type === 'success' ? 'text-[#00D2FF]' : 'text-[#00D2FF]'
                            }`}
                          >
                            {n.title}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-zinc-400 font-mono">{n.date}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(n.id);
                              }}
                              className="text-zinc-400 hover:text-red-400 p-0.5 rounded transition-colors"
                              title="Delete notification"
                              aria-label="Delete notification"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <p 
                          onClick={() => markNotificationRead(n.id)}
                          className="text-xs text-zinc-200 mt-1 font-sans cursor-pointer"
                        >
                          {n.message}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Profile Dropdown / Auth status */}
          <div className="relative">
            {isLoggedIn ? (
              <button
                onClick={() => { arcadeAudio.playClick(); setProfileDropdownOpen(!profileDropdownOpen); setNotificationsOpen(false); }}
                className="comic-btn bg-zinc-800 px-2.5 py-1 flex items-center gap-2 hover:bg-zinc-700 border-2 border-black shadow-[2px_2px_0px_#000]"
              >
                <div className="w-7 h-7 rounded bg-[#F9ED69] text-black border border-black flex items-center justify-center shrink-0 font-comic font-bold text-xs">
                  <User className="w-4 h-4 text-black" />
                </div>
                <span className="font-comic text-sm font-bold text-[#F9ED69] max-w-[120px] truncate">
                  {displayName}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
              </button>
            ) : (
              <button
                onClick={() => { arcadeAudio.playClick(); setAuthTab('login'); setAuthModalOpen(true); }}
                className="comic-btn bg-cyan-400 text-black font-comic text-sm px-3 py-1 font-bold uppercase"
              >
                LOGIN
              </button>
            )}

            {profileDropdownOpen && isLoggedIn && (
              <div className="absolute right-0 mt-2 w-64 bg-zinc-900 border-3 border-black shadow-[6px_6px_0px_#000000] z-50 p-3 comic-box">
                <div className="border-b-2 border-zinc-800 pb-3 mb-2">
                  <div className="font-comic text-base text-[#F9ED69] font-bold truncate">{displayName}</div>
                  <div className="text-xs text-zinc-400 font-mono truncate">{user.email}</div>
                  <div className="mt-1.5 inline-flex items-center gap-1.5 bg-green-950/80 text-green-400 border border-green-700/60 text-[10px] px-2 py-0.5 rounded font-mono font-bold">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse shrink-0" />
                    ONLINE
                  </div>
                </div>

                <div className="space-y-1 font-comic text-sm">
                  <button
                    onClick={() => { setActiveView('profile'); setProfileDropdownOpen(false); }}
                    className="w-full text-left px-2 py-1.5 rounded hover:bg-zinc-800 text-zinc-200 hover:text-yellow-400 flex items-center gap-2"
                  >
                    <User className="w-4 h-4 text-cyan-400" />
                    PROFILE & SETTINGS
                  </button>

                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-2 py-1.5 rounded hover:bg-red-950/60 text-red-400 flex items-center gap-2 mt-2 border-t border-zinc-800 pt-2"
                  >
                    <LogOut className="w-4 h-4" />
                    LOG OUT
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
};
