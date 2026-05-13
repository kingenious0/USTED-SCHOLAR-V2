import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, BookOpen, Brain, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import { useApp } from '../context/AppContext';
import { useEffect } from 'react';

export default function LandingScreen() {
  const { userState, setUserState } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (userState.isLoggedIn) {
      navigate('/library', { replace: true });
    }
  }, []);

  const features = [
    { icon: Brain, label: 'Smart Synthesis', desc: 'Instant insights from your course materials' },
    { icon: BookOpen, label: 'Digital Library', desc: 'All your modules, organised by programme' },
    { icon: Zap, label: 'Active Recall', desc: 'Reinforce learning with dynamic practice' },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg-primary)] transition-colors duration-300 px-6 py-16 relative overflow-hidden">

      {/* Subtle background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#2E5BFF]/8 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-[#FFCC22]/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="w-full max-w-lg mx-auto text-center relative z-10">

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 mb-8 px-4 py-1.5 rounded-full border border-[#2E5BFF]/25 bg-[#2E5BFF]/6 text-[#2E5BFF] text-[10px] font-black tracking-[0.25em] uppercase"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#2E5BFF] animate-pulse" />
          USTED · Digital Study Hub
        </motion.div>

        {/* Wordmark */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08 }}
          className="mb-4"
        >
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-none text-[var(--text-primary)]">
            USTED<span className="text-transparent bg-clip-text bg-gradient-to-br from-[#2E5BFF] to-[#FFCC22]">Scholar</span>
          </h1>
        </motion.div>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.16 }}
          className="text-[var(--text-tertiary)] text-base md:text-lg font-medium leading-relaxed mb-10 max-w-sm mx-auto"
        >
          The ultimate academic workspace for USTED. Built for the modern Ghanaian scholar.
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.24 }}
          className="flex flex-col items-center gap-4"
        >
          {userState.hasCompletedOnboarding && userState.name ? (
            <>
              <button
                onClick={() => {
                  setUserState({ isLoggedIn: true });
                  navigate('/library');
                }}
                className="inline-flex items-center justify-center gap-3 w-full sm:w-auto px-10 py-5 bg-[#2E5BFF] text-white rounded-2xl font-black text-base hover:scale-[1.03] hover:shadow-2xl hover:shadow-[#2E5BFF]/25 active:scale-[0.97] transition-all shadow-xl shadow-[#2E5BFF]/15"
              >
                Log In as {userState.name.split(' ')[0]}
                <ArrowRight className="w-5 h-5" />
              </button>
              <button 
                onClick={() => {
                  setUserState({ hasCompletedOnboarding: false, isLoggedIn: false, name: undefined, programme: undefined, level: undefined, semester: undefined, avatarUrl: undefined });
                  navigate('/onboarding');
                }}
                className="text-xs font-bold text-[var(--text-tertiary)] hover:text-[#2E5BFF] transition-colors"
              >
                Not you? Create new profile
              </button>
            </>
          ) : (
            <Link
              to="/onboarding"
              className="inline-flex items-center justify-center gap-3 w-full sm:w-auto px-10 py-5 bg-[#2E5BFF] text-white rounded-2xl font-black text-base hover:scale-[1.03] hover:shadow-2xl hover:shadow-[#2E5BFF]/25 active:scale-[0.97] transition-all shadow-xl shadow-[#2E5BFF]/15"
            >
              Get Started
              <ArrowRight className="w-5 h-5" />
            </Link>
          )}
        </motion.div>

        {/* Feature pills */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-wrap justify-center gap-3 mt-14"
        >
          {features.map(({ icon: Icon, label, desc }) => (
            <div
              key={label}
              className="flex items-center gap-2.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] px-4 py-2.5 rounded-xl"
            >
              <Icon className="w-4 h-4 text-[#2E5BFF] flex-shrink-0" />
              <div className="text-left">
                <p className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-widest">{label}</p>
                <p className="text-[9px] text-[var(--text-tertiary)] font-medium">{desc}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Footer note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.55 }}
          className="mt-12 text-[9px] font-bold text-[var(--text-tertiary)] uppercase tracking-[0.25em]"
        >
          Exclusively made for USTED Students
        </motion.p>

      </div>
    </div>
  );
}
