import React, { useState } from 'react';
import { 
  Lock, 
  Mail, 
  User, 
  Phone, 
  ShieldAlert, 
  CheckCircle2, 
  ArrowRight,
  Sparkles,
  Gamepad2,
  KeyRound,
  ShieldCheck,
  Zap,
  Info,
  DollarSign,
  Eye,
  EyeOff
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { arcadeAudio } from '../../utils/audio';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

export const AuthScreen: React.FC = () => {
  const { 
    setIsLoggedIn,
    updateUserProfile,
    user
  } = useFinance();

  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot' | 'reset'>('login');

  // Registration Form State
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regContact, setRegContact] = useState('');
  const [regGuardian, setRegGuardian] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regCurrency, setRegCurrency] = useState('USD');

  // Password visibility states
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Login Form State (Always starts completely empty for maximum privacy & security)
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Password Recovery Form State
  const [forgotEmail, setForgotEmail] = useState('');
  const [newPasswordVal, setNewPasswordVal] = useState('');
  const [confirmPasswordVal, setConfirmPasswordVal] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const currencySymbols: Record<string, string> = {
    USD: '$',
    INR: '₹',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    CAD: 'CA$',
    AUD: 'A$',
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!loginEmail.trim()) {
      setErrorMsg('Please enter your email address to continue.');
      arcadeAudio.playAlert();
      return;
    }

    if (!loginPassword.trim()) {
      setErrorMsg('Please enter your password key to continue.');
      arcadeAudio.playAlert();
      return;
    }

    setLoading(true);

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: loginEmail.trim(),
          password: loginPassword,
        });
        if (error) {
          setErrorMsg(error.message);
          setLoading(false);
          arcadeAudio.playAlert();
          return;
        }
        if (data.user) {
          updateUserProfile({
            email: data.user.email || loginEmail.trim(),
            fullName: data.user.user_metadata?.full_name || user.fullName,
            id: data.user.id,
          });
        }
      } catch (err: any) {
        console.warn('Supabase auth failed, fallback to local session:', err);
      }
    } else {
      // In local mode, update the active user's email if provided
      updateUserProfile({
        email: loginEmail.trim(),
      });
    }

    arcadeAudio.playLevelUp();
    setSuccessMsg('Session authenticated! Entering dashboard...');
    
    setTimeout(() => {
      // Clear password in memory before entering dashboard
      setLoginPassword('');
      setIsLoggedIn(true);
      setLoading(false);
    }, 500);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!regEmail || !regPassword || !regFullName) {
      setErrorMsg('Please fill in all mandatory identity fields');
      arcadeAudio.playAlert();
      return;
    }

    if (regPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long');
      arcadeAudio.playAlert();
      return;
    }

    setLoading(true);

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: regEmail.trim(),
          password: regPassword,
          options: {
            data: {
              full_name: regFullName,
              currency: regCurrency,
              currency_symbol: currencySymbols[regCurrency] || '$',
            },
          },
        });
        if (error && !error.message.toLowerCase().includes('already registered')) {
          console.warn('Supabase sign-up message:', error.message);
        }
      } catch (err: any) {
        console.warn('Supabase registration error, continuing in local mode:', err);
      }
    }

    updateUserProfile({
      fullName: regFullName || 'Player Hero',
      email: regEmail.trim() || 'player@cashquest.io',
      contactNumber: regContact || '+1 (555) 012-3456',
      guardianContact: regGuardian,
      currency: regCurrency,
      currencySymbol: currencySymbols[regCurrency] || '$',
      isEmailVerified: true,
    });

    arcadeAudio.playLevelUp();
    setSuccessMsg('Account created successfully! Unlocking vault...');
    setLoading(false);
    setTimeout(() => {
      setRegPassword('');
      setIsLoggedIn(true);
    }, 600);
  };

  const handleForgot = (e: React.FormEvent) => {
    e.preventDefault();
    arcadeAudio.playCoin();
    setSuccessMsg('Password recovery link dispatched to your email!');
    setTimeout(() => setAuthMode('reset'), 800);
  };

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPasswordVal && newPasswordVal === confirmPasswordVal) {
      arcadeAudio.playLevelUp();
      setSuccessMsg('Password updated successfully! Please log in.');
      setTimeout(() => {
        setSuccessMsg('');
        setAuthMode('login');
      }, 900);
    } else {
      setErrorMsg('Passwords do not match or are empty.');
      arcadeAudio.playAlert();
    }
  };

  return (
    <div className="min-h-screen bg-[#0F0F1B] text-white flex flex-col justify-center items-center p-4 relative overflow-hidden bg-bento-grid">
      
      {/* Background Decor Shapes */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-[#E94560]/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-40 h-40 bg-[#00D2FF]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md my-8">
        
        {/* Brand Banner */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center gap-3 mb-2">
            <div className="w-12 h-12 bg-[#E94560] border-4 border-black comic-btn flex items-center justify-center text-black font-pixel shadow-[4px_4px_0px_#000] rotate-3">
              <span className="text-2xl font-black italic text-black">$</span>
            </div>
            <div className="font-comic text-4xl text-[#F9ED69] drop-shadow-[3px_3px_0px_#000] uppercase italic tracking-wider">
              Ledger<span className="text-[#00D2FF]">ly</span>
            </div>
          </div>
          <p className="text-xs font-pixel text-zinc-400 tracking-widest uppercase">
            RETRO ARCADE PERSONAL FINANCE TRACKER
          </p>
        </div>

        {/* Bento Main Card */}
        <div className="comic-box bg-[#16213E] border-4 border-black p-6 shadow-[8px_8px_0px_#000000] relative">
          
          {/* Card Header & Tab Switchers */}
          <div className="flex items-center justify-between border-b-4 border-black pb-4 mb-5">
            <div className="font-comic text-2xl text-[#F9ED69] flex items-center gap-2">
              <Zap className="w-6 h-6 text-[#00D2FF]" />
              {authMode === 'login' && 'ACCOUNT LOGIN'}
              {authMode === 'register' && 'NEW ACCOUNT SIGN UP'}
              {authMode === 'forgot' && 'ACCOUNT RECOVERY'}
              {authMode === 'reset' && 'SET NEW PASSWORD'}
            </div>

            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => { arcadeAudio.playClick(); setAuthMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
                className={`comic-btn px-3 py-1 font-comic text-xs uppercase ${
                  authMode === 'login' ? 'bg-[#F9ED69] text-black font-bold' : 'bg-[#1A1A2E] text-zinc-300'
                }`}
              >
                LOGIN
              </button>
              <button
                type="button"
                onClick={() => { arcadeAudio.playClick(); setAuthMode('register'); setErrorMsg(''); setSuccessMsg(''); }}
                className={`comic-btn px-3 py-1 font-comic text-xs uppercase ${
                  authMode === 'register' ? 'bg-[#00D2FF] text-black font-bold' : 'bg-[#1A1A2E] text-zinc-300'
                }`}
              >
                SIGN UP
              </button>
            </div>
          </div>

          {/* Feedback Banners */}
          {errorMsg && (
            <div className="mb-4 p-3 bg-[#E94560]/20 border-3 border-[#E94560] text-[#E94560] font-mono text-xs flex items-center gap-2 rounded">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-[#00E676]/20 border-3 border-[#00E676] text-[#00E676] font-mono text-xs flex items-center gap-2 rounded">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* 1. LOGIN FORM */}
          {authMode === 'login' && (
            <form onSubmit={handleLogin} autoComplete="off" className="space-y-4">
              <div>
                <label className="block text-xs font-pixel text-[#F9ED69] uppercase mb-1.5">
                  EMAIL ADDRESS
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    autoComplete="off"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full bg-black border-3 border-white/20 pl-9 pr-3 py-2.5 text-sm text-white font-mono rounded outline-none focus:border-[#F9ED69]"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-pixel text-[#F9ED69] uppercase">
                    PASSWORD
                  </label>
                  <button
                    type="button"
                    onClick={() => { setAuthMode('forgot'); setErrorMsg(''); }}
                    className="text-[11px] font-mono text-[#00D2FF] hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    autoComplete="off"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full bg-black border-3 border-white/20 pl-9 pr-10 py-2.5 text-sm text-white font-mono rounded outline-none focus:border-[#F9ED69]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    tabIndex={-1}
                    className="absolute right-3 top-3 text-zinc-400 hover:text-white transition-colors"
                    aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="comic-btn w-full bg-[#F9ED69] text-black font-comic text-xl py-3 font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[#ffe066] mt-2"
              >
                <span>{loading ? 'AUTHENTICATING...' : 'SIGN IN TO LEDGERLY'}</span>
                <ArrowRight className="w-5 h-5 stroke-[3]" />
              </button>

              <div className="text-center pt-3 border-t-2 border-black/40 text-xs font-mono text-zinc-400">
                Don't have an account yet?{' '}
                <button
                  type="button"
                  onClick={() => setAuthMode('register')}
                  className="text-[#00D2FF] font-bold hover:underline font-comic text-sm"
                >
                  Create Account (Sign Up)
                </button>
              </div>
            </form>
          )}

          {/* 2. REGISTER / SIGN UP FORM */}
          {authMode === 'register' && (
            <form onSubmit={handleRegister} autoComplete="off" className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-pixel text-[#F9ED69] uppercase mb-1">
                  FULL NAME
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    autoComplete="off"
                    placeholder="e.g. Alex Vaughn"
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    className="w-full bg-black border-3 border-white/20 pl-9 pr-3 py-2 text-xs text-white font-mono rounded outline-none focus:border-[#F9ED69]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-pixel text-[#F9ED69] uppercase mb-1">
                  EMAIL ADDRESS
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    autoComplete="off"
                    placeholder="Enter your email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full bg-black border-3 border-white/20 pl-9 pr-3 py-2 text-xs text-white font-mono rounded outline-none focus:border-[#F9ED69]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-pixel text-[#F9ED69] uppercase mb-1">
                    CONTACT NUMBER
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      required
                      autoComplete="off"
                      placeholder="+1 (555) 012-3456"
                      value={regContact}
                      onChange={(e) => setRegContact(e.target.value)}
                      className="w-full bg-black border-3 border-white/20 pl-8 pr-2 py-2 text-xs text-white font-mono rounded outline-none focus:border-[#F9ED69]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-pixel text-[#F9ED69] uppercase mb-1">
                    CURRENCY
                  </label>
                  <select
                    value={regCurrency}
                    onChange={(e) => setRegCurrency(e.target.value)}
                    className="w-full bg-black border-3 border-white/20 px-2 py-2 text-xs text-white font-mono rounded outline-none focus:border-[#F9ED69]"
                  >
                    <option value="USD">USD ($ - Dollar)</option>
                    <option value="INR">INR (₹ - Rupee)</option>
                    <option value="EUR">EUR (€ - Euro)</option>
                    <option value="GBP">GBP (£ - Pound)</option>
                    <option value="JPY">JPY (¥ - Yen)</option>
                    <option value="CAD">CAD (CA$)</option>
                    <option value="AUD">AUD (A$)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-pixel text-[#F9ED69] uppercase mb-1">
                  SECURITY PASSWORD (MIN 6 CHARACTERS)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    placeholder="Create a strong password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full bg-black border-3 border-white/20 pl-9 pr-10 py-2 text-xs text-white font-mono rounded outline-none focus:border-[#F9ED69]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    tabIndex={-1}
                    className="absolute right-3 top-2.5 text-zinc-400 hover:text-white transition-colors"
                    aria-label={showRegPassword ? 'Hide password' : 'Show password'}
                  >
                    {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="comic-btn w-full bg-[#00D2FF] text-black font-comic text-lg py-2.5 font-bold uppercase tracking-wider mt-2 hover:bg-[#33ddff]"
              >
                {loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
              </button>

              <div className="text-center pt-2 border-t-2 border-black/40 text-xs font-mono text-zinc-400">
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className="text-[#F9ED69] font-bold hover:underline"
                >
                  Log In Here
                </button>
              </div>
            </form>
          )}

          {/* 3. FORGOT PASSWORD */}
          {authMode === 'forgot' && (
            <form onSubmit={handleForgot} autoComplete="off" className="space-y-4">
              <p className="text-xs text-zinc-300 font-mono">
                Enter your registered email address. We will send you instructions to reset your password.
              </p>

              <div>
                <label className="block text-xs font-pixel text-[#F9ED69] uppercase mb-1">
                  EMAIL ADDRESS
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    autoComplete="off"
                    placeholder="Enter your registered email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full bg-black border-3 border-white/20 pl-9 pr-3 py-2.5 text-sm text-white font-mono rounded outline-none focus:border-[#F9ED69]"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="comic-btn w-full bg-[#F9ED69] text-black font-comic text-lg py-2.5 font-bold uppercase"
              >
                SEND RESET INSTRUCTIONS
              </button>

              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className="w-full text-center text-xs text-zinc-400 hover:underline font-mono"
              >
                ← Back to Login
              </button>
            </form>
          )}

          {/* 4. RESET PASSWORD */}
          {authMode === 'reset' && (
            <form onSubmit={handleReset} autoComplete="off" className="space-y-3.5">
              <div>
                <label className="block text-xs font-pixel text-[#F9ED69] uppercase mb-1">
                  NEW PASSWORD
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    value={newPasswordVal}
                    onChange={(e) => setNewPasswordVal(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full bg-black border-3 border-white/20 pl-3 pr-10 py-2 text-xs text-white font-mono rounded outline-none focus:border-[#F9ED69]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    tabIndex={-1}
                    className="absolute right-3 top-2 text-zinc-400 hover:text-white transition-colors"
                    aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-pixel text-[#F9ED69] uppercase mb-1">
                  CONFIRM NEW PASSWORD
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    value={confirmPasswordVal}
                    onChange={(e) => setConfirmPasswordVal(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full bg-black border-3 border-white/20 pl-3 pr-10 py-2 text-xs text-white font-mono rounded outline-none focus:border-[#F9ED69]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex={-1}
                    className="absolute right-3 top-2 text-zinc-400 hover:text-white transition-colors"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="comic-btn w-full bg-[#00E676] text-black font-comic text-lg py-2.5 font-bold uppercase"
              >
                UPDATE PASSWORD
              </button>
            </form>
          )}

        </div>

        {/* Security & Cloud Info Note */}
        <div className="mt-4 bg-black/40 border-2 border-black p-3 rounded text-center text-xs font-mono text-zinc-400 flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#00E676]" />
          <span>Secure Encrypted Credentials & Direct Sign-In</span>
        </div>

      </div>

    </div>
  );
};
