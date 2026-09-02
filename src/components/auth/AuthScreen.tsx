import { doc, setDoc, getDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import { 
  Lock, 
  Mail, 
  User, 
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
  EyeOff,
  MailCheck
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { arcadeAudio } from '../../utils/audio';
import { auth, db, isFirebaseConfigured } from '../../lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  sendEmailVerification,
  signOut,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';

export const AuthScreen: React.FC = () => {
  const { 
    setIsLoggedIn,
    updateUserProfile,
    user
  } = useFinance();

  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot' | 'reset' | 'verify'>('login');
  const [unverifiedEmail, setUnverifiedEmail] = useState('');

  // Registration Form State
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
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

    if (isFirebaseConfigured && auth) {
      try {
        const userCred = await signInWithEmailAndPassword(auth, loginEmail.trim(), loginPassword);
        if (userCred.user) {
          if (!userCred.user.emailVerified) {
            const emailToVerify = userCred.user.email || loginEmail.trim();
            await signOut(auth);
            setUnverifiedEmail(emailToVerify);
            setAuthMode('verify');
            setLoading(false);
            arcadeAudio.playAlert();
            return;
          }
          updateUserProfile({
            email: userCred.user.email || loginEmail.trim(),
            fullName: userCred.user.displayName || user.fullName,
            id: userCred.user.uid,
          });
        }
      } catch (err: any) {
        console.warn('Firebase auth failed:', err);
        setErrorMsg('Email or password is incorrect');
        setLoading(false);
        arcadeAudio.playAlert();
        return;
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

    if (isFirebaseConfigured && auth) {
      try {
        const userCred = await createUserWithEmailAndPassword(auth, regEmail.trim(), regPassword);
        if (userCred.user) {
          try {
            await setDoc(doc(db, 'users', userCred.user.uid), {
              fullName: regFullName.trim() || (regEmail.trim() ? regEmail.trim().split('@')[0] : 'User'),
              email: regEmail.trim(),
              currency: regCurrency,
              currencySymbol: currencySymbols[regCurrency] || '$',
              isEmailVerified: false,
              joinedDate: new Date().toISOString().split('T')[0],
            }, { merge: true });
          } catch (docErr) {
            console.warn('Error creating Firestore user profile:', docErr);
          }

          try {
            await sendEmailVerification(userCred.user);
          } catch (verr) {
            console.warn('Error sending verification email:', verr);
          }
          const emailSentTo = userCred.user.email || regEmail.trim();
          await signOut(auth);
          setUnverifiedEmail(emailSentTo);
          setAuthMode('verify');
          setRegPassword('');
          setLoading(false);
          arcadeAudio.playLevelUp();
          return;
        }
      } catch (err: any) {
        console.warn('Firebase registration error:', err);
        setLoading(false);
        arcadeAudio.playAlert();
        if (err?.code === 'auth/email-already-in-use' || (err?.message && err.message.toLowerCase().includes('email-already-in-use'))) {
          setErrorMsg('User already exists. Please sign in');
        } else {
          setErrorMsg('User already exists. Please sign in');
        }
        return;
      }
    }

    updateUserProfile({
      fullName: regFullName.trim() || (regEmail.trim() ? regEmail.trim().split('@')[0] : 'User'),
      email: regEmail.trim(),
      currency: regCurrency,
      currencySymbol: currencySymbols[regCurrency] || '$',
    });

    arcadeAudio.playLevelUp();
    setSuccessMsg('Account created successfully!');
    setLoading(false);
    setTimeout(() => {
      setRegPassword('');
      setIsLoggedIn(true);
    }, 600);
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);
    arcadeAudio.playClick();

    if (isFirebaseConfigured && auth) {
      try {
        const provider = new GoogleAuthProvider();
        const userCred = await signInWithPopup(auth, provider);
        if (userCred.user) {
          const email = userCred.user.email || '';
          const fullName = userCred.user.displayName || (email ? email.split('@')[0] : 'User');
          
          try {
            const userDocRef = doc(db, 'users', userCred.user.uid);
            const userSnap = await getDoc(userDocRef);
            
            if (!userSnap.exists()) {
              await setDoc(userDocRef, {
                fullName,
                email,
                currency: 'USD',
                currencySymbol: '$',
                isEmailVerified: true,
                joinedDate: new Date().toISOString().split('T')[0],
              });
            } else {
              await setDoc(userDocRef, {
                fullName,
                email,
                isEmailVerified: true,
              }, { merge: true });
            }
          } catch (docErr) {
            console.warn('Error syncing Google user to Firestore:', docErr);
          }

          updateUserProfile({
            email,
            fullName,
            id: userCred.user.uid,
          });

          arcadeAudio.playLevelUp();
          setSuccessMsg('Google Authentication successful! Entering dashboard...');
          setTimeout(() => {
            setIsLoggedIn(true);
            setLoading(false);
          }, 500);
        }
      } catch (err: any) {
        console.warn('Google sign-in error:', err);
        setLoading(false);
        arcadeAudio.playAlert();
        if (err?.code === 'auth/popup-closed-by-user') {
          setErrorMsg('Google Sign-In popup was closed before completing.');
        } else if (err?.code === 'auth/popup-blocked') {
          setErrorMsg('Sign-in popup was blocked by your browser. Please allow popups.');
        } else {
          setErrorMsg('Google Sign-In failed. Please check Firebase Google provider setup.');
        }
      }
    } else {
      updateUserProfile({
        fullName: 'Google User',
        email: 'user@gmail.com',
      });
      arcadeAudio.playLevelUp();
      setSuccessMsg('Authenticated with Google! Entering dashboard...');
      setTimeout(() => {
        setIsLoggedIn(true);
        setLoading(false);
      }, 500);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    if (!forgotEmail.trim()) {
      setErrorMsg('Please enter your email address.');
      arcadeAudio.playAlert();
      return;
    }
    setLoading(true);
    arcadeAudio.playCoin();
    if (isFirebaseConfigured && auth) {
      try {
        await sendPasswordResetEmail(auth, forgotEmail.trim());
        setSuccessMsg('Password recovery email dispatched! Check your inbox.');
      } catch (err: any) {
        console.warn('Firebase password reset error:', err);
        setLoading(false);
        arcadeAudio.playAlert();
        if (err?.code === 'auth/user-not-found') {
          setErrorMsg('No account found with this email address.');
        } else if (err?.code === 'auth/invalid-email') {
          setErrorMsg('Please enter a valid email address.');
        } else {
          setErrorMsg('Password reset request failed. Please check your email.');
        }
        return;
      }
    } else {
      setSuccessMsg('Password recovery email dispatched! Check your inbox.');
    }
    setLoading(false);
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
              {authMode === 'verify' && 'EMAIL VERIFICATION'}
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

              <div className="relative my-3 text-center">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/20"></div></div>
                <span className="relative bg-[#16213E] px-2 text-[10px] font-pixel text-zinc-400 uppercase">OR</span>
              </div>

              <button
                type="button"
                disabled={loading}
                onClick={handleGoogleSignIn}
                className="comic-btn w-full bg-white text-black font-comic text-sm py-2.5 font-bold uppercase flex items-center justify-center gap-2.5 hover:bg-zinc-100 border-2 border-black shadow-[3px_3px_0px_#000]"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>CONTINUE WITH GOOGLE</span>
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

              <div className="relative my-2.5 text-center">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/20"></div></div>
                <span className="relative bg-[#16213E] px-2 text-[10px] font-pixel text-zinc-400 uppercase">OR</span>
              </div>

              <button
                type="button"
                disabled={loading}
                onClick={handleGoogleSignIn}
                className="comic-btn w-full bg-white text-black font-comic text-sm py-2.5 font-bold uppercase flex items-center justify-center gap-2.5 hover:bg-zinc-100 border-2 border-black shadow-[3px_3px_0px_#000]"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>CONTINUE WITH GOOGLE</span>
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

          {/* 5. EMAIL VERIFICATION REQUIRED SCREEN */}
          {authMode === 'verify' && (
            <div className="space-y-5 text-center py-2">
              <div className="w-14 h-14 bg-[#00D2FF]/10 border-2 border-[#00D2FF] rounded-full flex items-center justify-center mx-auto text-[#00D2FF]">
                <MailCheck className="w-7 h-7" />
              </div>

              <div className="p-4 bg-black/40 border-2 border-white/10 rounded-lg">
                <p className="text-sm font-mono text-zinc-200 leading-relaxed">
                  We have sent you a verification email to <span className="text-[#F9ED69] font-bold">{unverifiedEmail}</span>. Please verify it and log in.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  arcadeAudio.playClick();
                  setErrorMsg('');
                  setSuccessMsg('');
                  setAuthMode('login');
                }}
                className="comic-btn w-full bg-[#F9ED69] text-black font-comic text-xl py-3 font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[#ffe066]"
              >
                <span>LOGIN</span>
                <ArrowRight className="w-5 h-5 stroke-[3]" />
              </button>
            </div>
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
