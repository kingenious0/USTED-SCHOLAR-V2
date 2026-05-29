import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, EyeOff, Mail, Lock, User, Sparkles, ArrowRight, Loader2, GraduationCap, BookOpen } from 'lucide-react';

export default function LandingScreen() {
  const { userState, setUserState } = useApp();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profile && profile.programme) {
          setUserState({
            hasCompletedOnboarding: true,
            isLoggedIn: true,
            name: profile.name || userState.name,
            programme: profile.programme,
            level: profile.level,
            semester: profile.semester
          });
          navigate('/library', { replace: true });
        } else {
          navigate('/onboarding', { replace: true });
        }
      } else {
        localStorage.removeItem('pending_name');
        localStorage.removeItem('pending_phone');
        localStorage.removeItem('pending_email');
      }
    };
    checkSession();
  }, [navigate, setUserState, userState.name]);

  const handleEmailSignUp = async () => {
    setError('');
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const fullName = [formData.firstName, formData.lastName].filter(Boolean).join(' ');
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: { full_name: fullName, phone: formData.phone }
        }
      });

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          setError('An account with this email already exists. Please sign in.');
        } else {
          setError(signUpError.message);
        }
        return;
      }

      if (data?.user?.identities?.length === 0) {
        setError('An account with this email already exists. Please sign in.');
        return;
      }

      if (data?.user?.confirmation_sent_at) {
        setNeedsConfirmation(true);
        localStorage.setItem('pending_name', fullName);
        localStorage.setItem('pending_phone', formData.phone);
        localStorage.setItem('pending_email', formData.email);
        return;
      }

      setUserState({ name: fullName });
      localStorage.setItem('pending_name', fullName);
      localStorage.setItem('pending_phone', formData.phone);
      localStorage.setItem('pending_email', formData.email);
      navigate('/onboarding');
    } catch (err: any) {
      setError(err.message || 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });

      if (signInError) {
        if (signInError.message.includes('Invalid login credentials')) {
          setError('Wrong email or password. Please try again.');
        } else if (signInError.message.includes('Email not confirmed')) {
          setNeedsConfirmation(true);
        } else {
          setError(signInError.message);
        }
        return;
      }

      setUserState({ isLoggedIn: true });
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profile && profile.programme) {
          setUserState({
            hasCompletedOnboarding: true,
            name: profile.name,
            programme: profile.programme,
            level: profile.level,
            semester: profile.semester
          });
          navigate('/library', { replace: true });
        } else {
          navigate('/onboarding', { replace: true });
        }
      }
    } catch (err: any) {
      setError(err.message || 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError('');
    setLoading(true);
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin + '/onboarding' }
      });
      if (oauthError) {
        setError(oauthError.message);
      }
    } catch (err: any) {
      setError(err.message || 'Google sign in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (isLogin) {
      await handleEmailSignIn();
    } else {
      await handleEmailSignUp();
    }
  };

  const isFormValid = () => {
    if (loading) return false;
    const emailValid = formData.email && formData.email.includes('@');
    if (isLogin) return emailValid && formData.password.length >= 6;
    return emailValid &&
      formData.password.length >= 6 &&
      formData.firstName &&
      formData.lastName;
  };

  if (needsConfirmation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-[2.5rem] p-10 text-center shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-[-50%] left-[-50%] w-full h-full bg-gradient-to-br from-electric-blue/5 to-sunset-orange/5 blur-3xl" />
          <div className="relative z-10">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-electric-blue to-blue-600 flex items-center justify-center shadow-2xl shadow-electric-blue/30">
              <Mail className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-black text-[var(--text-primary)] mb-3">Check Your Email</h2>
            <p className="text-[var(--text-secondary)] mb-8 leading-relaxed">
              We sent a confirmation link to <strong className="text-[var(--accent-primary)]">{formData.email}</strong>. Click the link to activate your account, then sign in.
            </p>
            <button
              onClick={() => { setNeedsConfirmation(false); setIsLogin(true); }}
              className="w-full py-4 bg-gradient-to-r from-electric-blue to-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-electric-blue/25"
            >
              <ArrowRight className="w-5 h-5 inline mr-2" />
              Back to Sign In
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex w-full bg-[var(--bg-primary)] overflow-hidden transition-colors duration-300">
      {/* Left: Branding Hero */}
      <div className="hidden lg:flex w-[45%] flex-col relative bg-cover bg-center" style={{ backgroundImage: 'url(/hero-bg.png)' }}>
        <div className="absolute inset-0 bg-gradient-to-br from-black/95 via-black/70 to-black/90" />
        <div className="absolute inset-0 bg-gradient-to-t from-electric-blue/20 via-transparent to-transparent" />
        <div className="relative z-10 flex flex-col justify-between h-full p-16">
          <div>
            <div className="flex items-center gap-3 mb-16">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-electric-blue to-blue-600 flex items-center justify-center shadow-lg shadow-electric-blue/30">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-black text-white tracking-tight">
                USTED<span className="text-electric-blue">Scholar</span>
              </span>
            </div>
            <div className="space-y-6">
              <div className="flex gap-2">
                <div className="w-16 h-1.5 bg-electric-blue rounded-full" />
                <div className="w-8 h-1.5 bg-white/20 rounded-full" />
                <div className="w-8 h-1.5 bg-white/20 rounded-full" />
              </div>
              <h1 className="text-6xl font-black leading-tight tracking-tight text-white">
                Academic AI<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-electric-blue to-blue-400">Supercharged</span>
              </h1>
              <p className="text-lg text-gray-400 max-w-md leading-relaxed">
                Transform your course materials into smart study guides, interactive quizzes, and AI-powered tutoring — all tailored to your programme.
              </p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-gray-500">
              <div className="flex -space-x-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-black/50 bg-gradient-to-br from-gray-700 to-gray-800" />
                ))}
              </div>
              <p className="text-sm font-medium">
                <span className="text-white font-bold">2,400+</span> students onboarded
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Auth Form */}
      <div className="w-full lg:w-[55%] flex flex-col justify-center items-center p-6 sm:p-12 relative bg-[var(--bg-primary)]">
        <div className="absolute top-[-20%] right-[-20%] w-[60%] h-[60%] bg-gradient-to-bl from-electric-blue/5 to-transparent blur-3xl rounded-full pointer-events-none" />

        <div className="w-full max-w-[440px] relative z-10">
          {/* Logo - Mobile */}
          <div className="flex lg:hidden items-center gap-2 mb-10 justify-center">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-electric-blue to-blue-600 flex items-center justify-center shadow-lg">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-black text-[var(--text-primary)]">
              USTED<span className="text-electric-blue">Scholar</span>
            </span>
          </div>

          {/* Header */}
          <motion.div key={isLogin ? 'login' : 'signup'} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center md:text-left mb-8">
            <h2 className="text-3xl sm:text-4xl font-black text-[var(--text-primary)] mb-2 tracking-tight">
              {isLogin ? 'Welcome back' : 'Get started'}
            </h2>
            <p className="text-[var(--text-secondary)] text-sm font-medium">
              {isLogin
                ? 'Sign in to your academic workspace.'
                : 'Create your account to unlock AI-powered studying.'}
            </p>
          </motion.div>

          {/* Google Auth */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}>
            <button
              onClick={handleGoogleAuth}
              disabled={loading}
              className="w-full h-12 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl flex items-center justify-center gap-3 hover:bg-[var(--bg-tertiary)] active:scale-[0.98] transition-all text-[var(--text-primary)] font-bold shadow-sm disabled:opacity-50"
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
          </motion.div>

          {/* Separator */}
          <div className="flex items-center my-6">
            <div className="flex-1 border-t border-[var(--border-color)]" />
            <span className="px-4 text-[var(--text-tertiary)] text-[10px] uppercase tracking-[0.3em] font-black">Or continue with email</span>
            <div className="flex-1 border-t border-[var(--border-color)]" />
          </div>

          {/* Auth Form */}
          <motion.div key={isLogin ? 'form-login' : 'form-signup'} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <AnimatePresence>
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex gap-3 overflow-hidden"
                >
                  <div className="relative flex-1">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
                    <input
                      type="text"
                      placeholder="First Name"
                      value={formData.firstName}
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                      className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl pl-11 pr-4 py-3.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-electric-blue focus:ring-1 focus:ring-electric-blue/30 transition-all placeholder:text-[var(--text-tertiary)] font-medium"
                    />
                  </div>
                  <div className="relative flex-1">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
                    <input
                      type="text"
                      placeholder="Last Name"
                      value={formData.lastName}
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                      className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl pl-11 pr-4 py-3.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-electric-blue focus:ring-1 focus:ring-electric-blue/30 transition-all placeholder:text-[var(--text-tertiary)] font-medium"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
              <input
                type="email"
                placeholder="Email address"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl pl-11 pr-4 py-3.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-electric-blue focus:ring-1 focus:ring-electric-blue/30 transition-all placeholder:text-[var(--text-tertiary)] font-medium"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl pl-11 pr-11 py-3.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-electric-blue focus:ring-1 focus:ring-electric-blue/30 transition-all placeholder:text-[var(--text-tertiary)] font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <AnimatePresence>
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Confirm password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                      className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl pl-11 pr-4 py-3.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-electric-blue focus:ring-1 focus:ring-electric-blue/30 transition-all placeholder:text-[var(--text-tertiary)] font-medium"
                    />
                  </div>
                  <p className="text-[10px] text-[var(--text-tertiary)] mt-2 px-1 font-medium">Minimum 6 characters</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3"
                >
                  <p className="text-red-500 text-xs font-bold">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={!isFormValid()}
              className="w-full py-3.5 bg-gradient-to-r from-electric-blue to-blue-600 text-white rounded-2xl font-black text-sm hover:brightness-110 active:scale-[0.98] transition-all shadow-xl shadow-electric-blue/25 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isLogin ? (
                <>Sign In <ArrowRight className="w-4 h-4" /></>
              ) : (
                <>Create Account <Sparkles className="w-4 h-4" /></>
              )}
            </button>
          </motion.div>

          {/* Toggle */}
          <div className="mt-6 text-center">
            <button
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className="text-sm font-bold text-[var(--text-tertiary)] hover:text-[var(--accent-primary)] transition-colors"
            >
              {isLogin ? (
                <>New to USTED Scholar? <span className="text-electric-blue font-black">Create account</span></>
              ) : (
                <>Already have an account? <span className="text-electric-blue font-black">Sign in</span></>
              )}
            </button>
          </div>

          {/* Footer */}
          <div className="mt-10 text-center">
            <p className="text-[var(--text-tertiary)] text-[10px] leading-relaxed font-medium">
              By joining, you agree to our{' '}
              <a href="#" className="font-bold text-[var(--text-secondary)] hover:text-electric-blue transition-colors">Terms</a>
              {' '}and{' '}
              <a href="#" className="font-bold text-[var(--text-secondary)] hover:text-electric-blue transition-colors">Privacy Policy</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
