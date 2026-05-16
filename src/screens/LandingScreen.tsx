import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import { motion } from 'motion/react';

export default function LandingScreen() {
  const { userState, setUserState } = useApp();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true); // Default to Log In
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: ''
  });

  useEffect(() => {
    if (userState.isLoggedIn) {
      navigate('/library', { replace: true });
    }
  }, [userState.isLoggedIn, navigate]);

  const handleInstantAccess = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInAnonymously();
      if (error) console.error("Anonymous auth error:", error);
      
      const fullName = [formData.firstName, formData.lastName].filter(Boolean).join(' ');
      if (fullName) {
        setUserState({ name: fullName });
      }
      
      navigate('/onboarding');
    } catch (err) {
      console.error("Launch failed:", err);
      navigate('/onboarding');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    const { error } = await supabase.auth.signInWithOAuth({ 
        provider: 'google', 
        options: { redirectTo: window.location.origin + '/onboarding' } 
    });
    if (error) {
        console.error("Google Auth error:", error);
        navigate('/onboarding');
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-[var(--bg-primary)] overflow-hidden transition-colors duration-300">
      {/* Left side: Image Branding (Hidden on mobile) */}
      <div className="hidden lg:flex w-[45%] flex-col justify-end p-16 bg-cover bg-center relative" 
           style={{ backgroundImage: 'url(/hero-bg.png)' }}>
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
        <div className="relative z-10 text-white mb-8">
          <div className="flex gap-2 mb-8">
            <div className="w-12 h-1.5 bg-[var(--accent-primary)] rounded-full"></div>
            <div className="w-12 h-1.5 bg-white/30 rounded-full"></div>
            <div className="w-12 h-1.5 bg-white/30 rounded-full"></div>
          </div>
          <h1 className="text-6xl font-black mb-6 tracking-tight leading-tight">Where Ideas Flow</h1>
          <p className="text-xl text-gray-300 max-w-md font-medium">AI-assisted workspace to craft and elevate your ideas.</p>
        </div>
      </div>

      {/* Right side: Auth Form */}
      <div className="w-full lg:w-[55%] flex flex-col justify-center items-center p-8 sm:p-12 relative bg-[var(--bg-primary)] transition-colors duration-300">
        
        <div className="w-full max-w-[420px]">
          {/* Form Header */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center md:text-left mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mb-3 tracking-tight">
              {isLogin ? 'Welcome Back' : 'Create Your Account'}
            </h2>
            <p className="text-[var(--text-tertiary)] text-sm font-medium">
              {isLogin ? 'Log in to sync your academic workspace.' : 'Join the next generation academic workspace.'}
            </p>
          </motion.div>

          {/* Primary Action: Social Logins */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-4">
            <button onClick={handleGoogleAuth} className="w-full h-14 bg-white border border-zinc-200 rounded-2xl flex items-center justify-center gap-3 hover:bg-zinc-50 active:scale-[0.97] transition-all text-zinc-900 font-bold shadow-sm">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
          </motion.div>

          {/* Separator */}
          <div className="flex items-center my-8">
            <div className="flex-1 border-t border-[var(--border-color)]"></div>
            <span className="px-4 text-[var(--text-tertiary)] text-[10px] uppercase tracking-widest font-black">Or use email</span>
            <div className="flex-1 border-t border-[var(--border-color)]"></div>
          </div>

          {/* Form Inputs */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="space-y-4">
            {!isLogin && (
              <div className="flex gap-4">
                <input 
                  type="text" 
                  placeholder="First Name" 
                  value={formData.firstName}
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl px-5 py-4 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all placeholder:text-[var(--text-tertiary)] font-medium" 
                />
                <input 
                  type="text" 
                  placeholder="Last Name" 
                  value={formData.lastName}
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl px-5 py-4 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all placeholder:text-[var(--text-tertiary)] font-medium" 
                />
              </div>
            )}
            
            <input 
              type="email" 
              placeholder="Email Address" 
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl px-5 py-4 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all placeholder:text-[var(--text-tertiary)] font-medium" 
            />
            
            <button 
              onClick={handleInstantAccess}
              disabled={loading}
              className="w-full bg-[var(--accent-primary)] text-white rounded-2xl py-4 mt-4 font-black text-lg hover:brightness-110 active:scale-[0.98] transition-all shadow-xl shadow-[var(--accent-primary)]/20 disabled:opacity-50"
            >
              {loading ? (isLogin ? 'Logging in...' : 'Creating...') : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </motion.div>

          {/* Toggle Link */}
          <div className="mt-8 text-center">
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm font-bold text-[var(--text-tertiary)] hover:text-[var(--accent-primary)] transition-colors"
            >
              {isLogin ? (
                <>New to USTED Scholar? <span className="text-[var(--accent-primary)] font-black">Sign Up</span></>
              ) : (
                <>Already have an account? <span className="text-[var(--accent-primary)] font-black">Log In</span></>
              )}
            </button>
          </div>

          {/* Footer Terms */}
          <div className="mt-12 text-center">
            <p className="text-[var(--text-tertiary)] text-[10px] leading-relaxed uppercase tracking-wider font-bold opacity-50 mb-4">
              
            </p>
            <p className="text-[var(--text-tertiary)] text-[11px] leading-relaxed">
              By joining USTED Scholar, you agree to our{' '}
              <a href="#" className="font-semibold text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors">Terms of Service</a>
              {' '}and{' '}
              <a href="#" className="font-semibold text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors">Privacy Policy</a>.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
