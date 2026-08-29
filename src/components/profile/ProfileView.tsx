import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  ShieldCheck, 
  Lock, 
  CheckCircle2, 
  Sparkles,
  Save,
  ShieldAlert,
  LogOut,
  Sliders,
  Eye,
  EyeOff,
  KeyRound,
  Bell,
  Volume2,
  VolumeX
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { arcadeAudio } from '../../utils/audio';

export const ProfileView: React.FC = () => {
  const { 
    user, 
    updateUserProfile, 
    setIsLoggedIn,
    soundEnabled,
    setSoundEnabled
  } = useFinance();

  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'preferences'>('profile');

  // Profile Form State
  const [fullName, setFullName] = useState(user.fullName);
  const [email, setEmail] = useState(user.email);
  const [currency, setCurrency] = useState(user.currency || 'USD');

  // Security & Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Preference Settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [budgetAlerts, setBudgetAlerts] = useState(true);
  const [weeklySummaries, setWeeklySummaries] = useState(true);

  // UI Feedback State
  const [savedSuccess, setSavedSuccess] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const currencyMap: Record<string, string> = {
    INR: '₹',
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    CAD: 'CA$',
    AUD: 'A$',
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    arcadeAudio.playLevelUp();
    updateUserProfile({
      fullName,
      email,
      currency,
      currencySymbol: currencyMap[currency] || '$',
    });
    setSavedSuccess('Profile and preferences updated successfully!');
    setTimeout(() => setSavedSuccess(''), 2500);
  };

  // Direct Password Update
  const handlePasswordUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!currentPassword) {
      setErrorMessage('Please enter your current password.');
      arcadeAudio.playAlert();
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters.');
      arcadeAudio.playAlert();
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('New passwords do not match.');
      arcadeAudio.playAlert();
      return;
    }

    arcadeAudio.playLevelUp();
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setSavedSuccess('Security password updated successfully!');
    setTimeout(() => setSavedSuccess(''), 3000);
  };

  const handleSignOut = () => {
    arcadeAudio.playAlert();
    setIsLoggedIn(false);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Header Banner */}
      <div className="comic-box bg-[#16213E] p-4 border-4 border-black shadow-[6px_6px_0px_#000]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="font-comic text-3xl text-[#F9ED69] flex items-center gap-2">
              <User className="w-8 h-8 text-[#00D2FF]" />
              ACCOUNT PROFILE & SETTINGS
            </h1>
            <p className="text-xs font-mono text-zinc-300">
              Manage your personal information, profile photo, preferred currency, and account security.
            </p>
          </div>

          <button
            onClick={handleSignOut}
            className="comic-btn bg-[#E94560] text-white font-comic text-sm px-4 py-2 uppercase flex items-center gap-2 self-start sm:self-auto hover:bg-[#ff3355]"
          >
            <LogOut className="w-4 h-4" />
            <span>SIGN OUT</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t-2 border-black">
          <button
            onClick={() => { arcadeAudio.playClick(); setActiveTab('profile'); }}
            className={`comic-btn px-4 py-2 font-comic text-sm uppercase flex items-center gap-2 ${
              activeTab === 'profile' ? 'bg-[#F9ED69] text-black font-bold' : 'bg-[#1A1A2E] text-zinc-300'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Personal Information</span>
          </button>

          <button
            onClick={() => { arcadeAudio.playClick(); setActiveTab('security'); }}
            className={`comic-btn px-4 py-2 font-comic text-sm uppercase flex items-center gap-2 ${
              activeTab === 'security' ? 'bg-[#00D2FF] text-black font-bold' : 'bg-[#1A1A2E] text-zinc-300'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Password & Security</span>
          </button>

          <button
            onClick={() => { arcadeAudio.playClick(); setActiveTab('preferences'); }}
            className={`comic-btn px-4 py-2 font-comic text-sm uppercase flex items-center gap-2 ${
              activeTab === 'preferences' ? 'bg-[#00E676] text-black font-bold' : 'bg-[#1A1A2E] text-zinc-300'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Preferences & Data</span>
          </button>
        </div>
      </div>

      {/* Global Feedback Banners */}
      {savedSuccess && (
        <div className="comic-box bg-[#00E676]/20 border-3 border-[#00E676] text-[#00E676] p-3 font-mono text-sm flex items-center gap-2 shadow-[4px_4px_0px_#000]">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{savedSuccess}</span>
        </div>
      )}

      {errorMessage && (
        <div className="comic-box bg-[#E94560]/20 border-3 border-[#E94560] text-[#E94560] p-3 font-mono text-sm flex items-center gap-2 shadow-[4px_4px_0px_#000]">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* TAB 1: PERSONAL INFORMATION */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Account Summary Card */}
          <div className="comic-box bg-[#16213E] p-5 flex flex-col items-center text-center border-4 border-black shadow-[6px_6px_0px_#000]">
            <div className="w-20 h-20 rounded-2xl bg-[#F9ED69] text-black border-4 border-black flex items-center justify-center mb-3 shadow-[4px_4px_0px_#000]">
              <User className="w-10 h-10 text-black" />
            </div>

            <div className="font-comic text-2xl text-[#F9ED69]">{fullName || 'User'}</div>
            <div className="text-xs font-mono text-zinc-300 break-all max-w-full">{email}</div>

            <div className="mt-3 inline-flex items-center gap-1.5 bg-[#00E676]/20 border border-[#00E676] text-[#00E676] text-[10px] px-2.5 py-1 rounded font-mono font-bold">
              <span className="w-2 h-2 rounded-full bg-[#00E676] animate-pulse shrink-0" />
              FIRESTORE SECURE VAULT
            </div>

            <div className="mt-4 pt-4 border-t-2 border-black w-full text-left space-y-2 font-mono text-xs">
              <div className="flex justify-between text-zinc-300">
                <span className="text-zinc-400">Account Status:</span>
                <span className="text-[#00E676] font-bold">Active</span>
              </div>
              <div className="flex justify-between text-zinc-300">
                <span className="text-zinc-400">Currency:</span>
                <span className="text-[#F9ED69] font-bold">{currency}</span>
              </div>
              <div className="flex justify-between text-zinc-300">
                <span className="text-zinc-400">Member Since:</span>
                <span className="text-white">{user.joinedDate || '2026'}</span>
              </div>
            </div>
          </div>

          {/* Profile Form */}
          <div className="md:col-span-2 comic-box bg-[#16213E] p-6 border-4 border-black shadow-[6px_6px_0px_#000]">
            <div className="font-comic text-2xl text-[#F9ED69] mb-4 border-b-2 border-black pb-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#00D2FF]" />
              PERSONAL DETAILS & CURRENCY
            </div>

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div>
                <label className="block font-pixel text-xs text-[#F9ED69] uppercase mb-1">
                  FULL NAME
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-black border-3 border-white/20 pl-9 pr-3 py-2 text-sm font-mono text-white rounded outline-none focus:border-[#F9ED69]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-pixel text-xs text-[#F9ED69] uppercase mb-1">
                    EMAIL ADDRESS
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-black border-3 border-white/20 pl-9 pr-3 py-2 text-sm font-mono text-white rounded outline-none focus:border-[#F9ED69]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-pixel text-xs text-[#F9ED69] uppercase mb-1">
                    PREFERRED CURRENCY
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full bg-black border-3 border-white/20 px-3 py-2 text-sm font-mono text-white rounded outline-none focus:border-[#F9ED69]"
                  >
                    <option value="INR">INR (₹ - Indian Rupee)</option>
                    <option value="USD">USD ($ - US Dollar)</option>
                    <option value="EUR">EUR (€ - Euro)</option>
                    <option value="GBP">GBP (£ - British Pound)</option>
                    <option value="JPY">JPY (¥ - Japanese Yen)</option>
                    <option value="CAD">CAD (CA$ - Canadian Dollar)</option>
                    <option value="AUD">AUD (A$ - Australian Dollar)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="comic-btn bg-[#F9ED69] text-black font-comic text-lg px-6 py-2.5 font-bold uppercase flex items-center gap-2 hover:bg-[#ffe066] mt-2"
              >
                <Save className="w-5 h-5 stroke-[3]" />
                <span>SAVE CHANGES</span>
              </button>
            </form>
          </div>

        </div>
      )}

      {/* TAB 2: PASSWORD & SECURITY */}
      {activeTab === 'security' && (
        <div className="comic-box bg-[#16213E] p-6 border-4 border-black shadow-[6px_6px_0px_#000] max-w-2xl mx-auto">
          <div className="font-comic text-2xl text-[#F9ED69] mb-4 border-b-2 border-black pb-2 flex items-center gap-2">
            <Lock className="w-6 h-6 text-[#00D2FF]" />
            CHANGE SECURITY PASSWORD
          </div>

          <p className="text-xs font-mono text-zinc-300 mb-4">
            Update your account password key to keep your financial vault secure.
          </p>

          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            <div>
              <label className="block font-pixel text-xs text-[#F9ED69] uppercase mb-1">
                CURRENT PASSWORD
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-black border-3 border-white/20 pl-3 pr-10 py-2 text-sm font-mono text-white rounded outline-none focus:border-[#F9ED69]"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  tabIndex={-1}
                  className="absolute right-3 top-2.5 text-zinc-400 hover:text-white transition-colors"
                  aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-pixel text-xs text-[#F9ED69] uppercase mb-1">
                  NEW PASSWORD (MIN 6 CHARS)
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-black border-3 border-white/20 pl-3 pr-10 py-2 text-sm font-mono text-white rounded outline-none focus:border-[#F9ED69]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    tabIndex={-1}
                    className="absolute right-3 top-2.5 text-zinc-400 hover:text-white transition-colors"
                    aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-pixel text-xs text-[#F9ED69] uppercase mb-1">
                  CONFIRM NEW PASSWORD
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-black border-3 border-white/20 pl-3 pr-10 py-2 text-sm font-mono text-white rounded outline-none focus:border-[#F9ED69]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex={-1}
                    className="absolute right-3 top-2.5 text-zinc-400 hover:text-white transition-colors"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="comic-btn w-full bg-[#00D2FF] text-black font-comic text-lg py-3 font-bold uppercase flex items-center justify-center gap-2 hover:bg-[#33ddff]"
            >
              <KeyRound className="w-5 h-5 stroke-[2.5]" />
              <span>UPDATE SECURITY PASSWORD</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: PREFERENCES & DATA MANAGEMENT */}
      {activeTab === 'preferences' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Notification & Sound Settings */}
          <div className="comic-box bg-[#16213E] p-5 border-4 border-black shadow-[6px_6px_0px_#000]">
            <div className="font-comic text-xl text-[#F9ED69] mb-4 border-b-2 border-black pb-2 flex items-center gap-2">
              <Bell className="w-5 h-5 text-[#00D2FF]" />
              APP NOTIFICATIONS & SOUNDS
            </div>

            <div className="space-y-4 font-mono text-xs">
              <div className="flex items-center justify-between p-3 bg-black/40 border-2 border-black rounded">
                <div>
                  <div className="font-bold text-white text-sm">Arcade Sound Effects</div>
                  <div className="text-zinc-400 text-[11px]">Audio feedback on transactions and actions</div>
                </div>
                <button
                  type="button"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`p-2 rounded border-2 border-black comic-btn ${
                    soundEnabled ? 'bg-[#00E676] text-black' : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                </button>
              </div>

              <div className="flex items-center justify-between p-3 bg-black/40 border-2 border-black rounded">
                <div>
                  <div className="font-bold text-white text-sm">Budget Limit Alerts</div>
                  <div className="text-zinc-400 text-[11px]">Notify when category spending reaches 80%</div>
                </div>
                <button
                  type="button"
                  onClick={() => setBudgetAlerts(!budgetAlerts)}
                  className={`p-2 px-3 rounded border-2 border-black comic-btn font-bold font-pixel text-[10px] ${
                    budgetAlerts ? 'bg-[#F9ED69] text-black' : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {budgetAlerts ? 'ON' : 'OFF'}
                </button>
              </div>

              <div className="flex items-center justify-between p-3 bg-black/40 border-2 border-black rounded">
                <div>
                  <div className="font-bold text-white text-sm">Weekly Financial Summaries</div>
                  <div className="text-zinc-400 text-[11px]">Periodic spending reviews and goal progress</div>
                </div>
                <button
                  type="button"
                  onClick={() => setWeeklySummaries(!weeklySummaries)}
                  className={`p-2 px-3 rounded border-2 border-black comic-btn font-bold font-pixel text-[10px] ${
                    weeklySummaries ? 'bg-[#00D2FF] text-black' : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {weeklySummaries ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
