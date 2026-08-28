import React, { useState } from 'react';
import { 
  X, 
  Lock, 
  Mail, 
  User, 
  Phone, 
  ShieldAlert, 
  CheckCircle2, 
  KeyRound, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { arcadeAudio } from '../../utils/audio';

export const AuthModal: React.FC = () => {
  const { 
    authModalOpen, 
    setAuthModalOpen, 
    authTab, 
    setAuthTab, 
    setIsLoggedIn,
    updateUserProfile,
    user
  } = useFinance();

  // Registration Form State
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regContact, setRegContact] = useState('');
  const [regGuardian, setRegGuardian] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // Login Form State (starts empty for security)
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [successMessage, setSuccessMessage] = useState('');

  if (!authModalOpen) return null;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword.trim()) return;
    arcadeAudio.playLevelUp();
    updateUserProfile({ email: loginEmail.trim() });
    setLoginPassword('');
    setIsLoggedIn(true);
    setAuthModalOpen(false);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    arcadeAudio.playLevelUp();
    updateUserProfile({
      fullName: regFullName || 'User Account',
      email: regEmail || 'user@ledgerly.app',
      contactNumber: regContact || '+1 (555) 012-3456',
      guardianContact: regGuardian,
      isEmailVerified: true,
    });
    setIsLoggedIn(true);
    setSuccessMessage('Account created successfully! Session active.');
    setTimeout(() => {
      setAuthModalOpen(false);
      setSuccessMessage('');
    }, 1200);
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    arcadeAudio.playCoin();
    setSuccessMessage('Reset link dispatched to email!');
    setTimeout(() => setAuthTab('reset'), 1000);
  };

  const handleResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    arcadeAudio.playLevelUp();
    setSuccessMessage('Password Updated! Please login with your new key.');
    setTimeout(() => setAuthTab('login'), 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-zinc-900 border-4 border-black shadow-[8px_8px_0px_#000000] comic-box overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-3.5 bg-zinc-950 border-b-3 border-black">
          <div className="font-comic text-xl text-yellow-400 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            {authTab === 'login' && 'ACCOUNT LOGIN'}
            {authTab === 'register' && 'CREATE NEW ACCOUNT'}
            {authTab === 'verify' && 'EMAIL VERIFICATION'}
            {authTab === 'forgot' && 'RECOVER ACCOUNT'}
            {authTab === 'reset' && 'RESET PASSWORD'}
          </div>
          <button
            onClick={() => { arcadeAudio.playClick(); setAuthModalOpen(false); }}
            className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 bg-zinc-900">
          
          {successMessage && (
            <div className="mb-4 p-3 bg-green-950 border-2 border-black text-green-400 font-comic text-sm flex items-center gap-2 shadow-[2px_2px_0px_#000]">
              <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* TAB 1: LOGIN */}
          {authTab === 'login' && (
            <form onSubmit={handleLoginSubmit} autoComplete="off" className="space-y-4">
              <div>
                <label className="block text-xs font-pixel text-zinc-400 uppercase mb-1">
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
                    className="w-full bg-zinc-950 border-2 border-black pl-9 pr-3 py-2 text-sm text-white font-mono rounded focus:border-yellow-400 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-pixel text-zinc-400 uppercase mb-1">
                  SECURITY PASSWORD
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    autoComplete="off"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full bg-zinc-950 border-2 border-black pl-9 pr-3 py-2 text-sm text-white font-mono rounded focus:border-yellow-400 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setAuthTab('forgot')}
                  className="text-cyan-400 hover:underline"
                >
                  Forgot Password?
                </button>
                <span className="text-zinc-500">Active Session Only</span>
              </div>

              <button
                type="submit"
                className="comic-btn w-full bg-yellow-400 text-black font-comic text-lg py-2.5 font-bold uppercase tracking-wider flex items-center justify-center gap-2"
              >
                <span>SIGN IN TO LEDGERLY</span>
                <ArrowRight className="w-5 h-5 stroke-[3]" />
              </button>

              <div className="text-center pt-2 border-t border-zinc-800 text-xs font-mono text-zinc-400">
                New Player?{' '}
                <button
                  type="button"
                  onClick={() => setAuthTab('register')}
                  className="text-yellow-400 font-bold hover:underline"
                >
                  Register Account
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: REGISTER */}
          {authTab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              <div>
                <label className="block text-[10px] font-pixel text-zinc-400 uppercase mb-1">
                  FULL NAME
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex Vaughn"
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    className="w-full bg-zinc-950 border-2 border-black pl-9 pr-3 py-1.5 text-xs text-white font-mono rounded focus:border-yellow-400 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-pixel text-zinc-400 uppercase mb-1">
                  EMAIL ADDRESS
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    placeholder="alex@example.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full bg-zinc-950 border-2 border-black pl-9 pr-3 py-1.5 text-xs text-white font-mono rounded focus:border-yellow-400 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-pixel text-zinc-400 uppercase mb-1">
                    CONTACT NUMBER
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      required
                      placeholder="+1 (555) 012-3456"
                      value={regContact}
                      onChange={(e) => setRegContact(e.target.value)}
                      className="w-full bg-zinc-950 border-2 border-black pl-8 pr-2 py-1.5 text-xs text-white font-mono rounded focus:border-yellow-400 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-pixel text-zinc-400 uppercase mb-1">
                    GUARDIAN CONTACT (OPTIONAL)
                  </label>
                  <input
                    type="text"
                    placeholder="Parent/Guardian #"
                    value={regGuardian}
                    onChange={(e) => setRegGuardian(e.target.value)}
                    className="w-full bg-zinc-950 border-2 border-black px-2 py-1.5 text-xs text-white font-mono rounded focus:border-yellow-400 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-pixel text-zinc-400 uppercase mb-1">
                  PASSWORD
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full bg-zinc-950 border-2 border-black pl-9 pr-3 py-1.5 text-xs text-white font-mono rounded focus:border-yellow-400 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="comic-btn w-full bg-cyan-400 text-black font-comic text-base py-2 font-bold uppercase tracking-wider mt-2"
              >
                CREATE ACCOUNT
              </button>

              <div className="text-center pt-2 border-t border-zinc-800 text-xs font-mono text-zinc-400">
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => setAuthTab('login')}
                  className="text-yellow-400 font-bold hover:underline"
                >
                  Log In
                </button>
              </div>
            </form>
          )}

          {/* TAB 4: FORGOT PASSWORD */}
          {authTab === 'forgot' && (
            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <p className="text-xs text-zinc-300 font-mono">
                Provide your registered email address to receive password recovery instructions.
              </p>

              <div>
                <label className="block text-xs font-pixel text-zinc-400 uppercase mb-1">
                  EMAIL ADDRESS
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="alex@example.com"
                    className="w-full bg-zinc-950 border-2 border-black pl-9 pr-3 py-2 text-sm text-white font-mono rounded outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="comic-btn w-full bg-yellow-400 text-black font-comic text-base py-2 font-bold uppercase"
              >
                SEND RECOVERY LINK
              </button>

              <button
                type="button"
                onClick={() => setAuthTab('login')}
                className="w-full text-center text-xs text-zinc-400 hover:underline font-mono"
              >
                ← Back to Login
              </button>
            </form>
          )}

          {/* TAB 5: RESET PASSWORD */}
          {authTab === 'reset' && (
            <form onSubmit={handleResetSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-pixel text-zinc-400 uppercase mb-1">
                  NEW PASSWORD
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full bg-zinc-950 border-2 border-black px-3 py-2 text-sm text-white font-mono rounded outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-pixel text-zinc-400 uppercase mb-1">
                  CONFIRM NEW PASSWORD
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full bg-zinc-950 border-2 border-black px-3 py-2 text-sm text-white font-mono rounded outline-none"
                />
              </div>

              <button
                type="submit"
                className="comic-btn w-full bg-green-400 text-black font-comic text-base py-2 font-bold uppercase"
              >
                UPDATE PASSWORD
              </button>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};
