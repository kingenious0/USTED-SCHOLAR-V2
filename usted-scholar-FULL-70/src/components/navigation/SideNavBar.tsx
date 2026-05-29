import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, User, LogOut, GraduationCap, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

import { supabase } from '../../lib/supabase';
import { useApp } from '../../context/AppContext';

export default function SideNavBar({ className = "" }: { className?: string }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { setUserState } = useApp();
  const currentPath = location.pathname;
  const [logoClicks, setLogoClicks] = useState(0);

  const navItems = [
    { icon: Home, label: 'Home', path: '/library' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  const handleLogoClick = () => {
    setLogoClicks(prev => prev + 1);
    const timer = setTimeout(() => setLogoClicks(0), 2000);
    if (logoClicks + 1 >= 3) {
      clearTimeout(timer);
      navigate('/admin');
      setLogoClicks(0);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUserState({
      hasCompletedOnboarding: false,
      isLoggedIn: false,
      name: undefined,
      avatarUrl: undefined,
      level: undefined,
      semester: undefined,
      programme: undefined,
      recentlyOpenedIds: []
    });
    navigate('/');
  };

  return (
    <aside className={`w-[240px] h-screen fixed left-0 top-0 bg-[var(--bg-secondary)] border-r border-[var(--border-color)] flex flex-col p-6 z-50 transition-colors duration-300 ${className}`}>
      <div className="relative z-10 flex flex-col h-full">
        {/* Logo */}
        <div className="mb-10">
          <div
            className="flex items-center gap-2 cursor-pointer active:scale-95 transition-transform"
            onClick={handleLogoClick}
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-electric-blue to-blue-600 flex items-center justify-center shadow-lg shadow-electric-blue/20">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-black tracking-tight text-[var(--text-primary)]">
              USTED<span className="text-electric-blue">Scholar</span>
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const isActive = currentPath === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold cursor-pointer group relative overflow-hidden ${
                  isActive
                    ? 'text-white bg-gradient-to-r from-electric-blue to-blue-600 shadow-lg shadow-electric-blue/20'
                    : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNavIndicator"
                    className="absolute left-0 top-0 w-1 h-full bg-white/40 shadow-[2px_0_10px_rgba(255,255,255,0.3)]"
                  />
                )}
                <item.icon className={`w-5 h-5 transition-all duration-300 ${isActive ? 'text-white scale-110' : 'opacity-70 group-hover:opacity-100 group-hover:scale-110'}`} />
                <span className={`text-sm tracking-tight transition-all ${isActive ? 'font-black translate-x-1' : ''}`}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="mt-auto space-y-4">
          <button className="w-full py-3.5 bg-gradient-to-r from-electric-blue to-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-electric-blue/20 hover:scale-[1.02] active:scale-[0.98] transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2">
            <Sparkles className="w-3.5 h-3.5" />
            BETA
          </button>

          <div className="pt-4 border-t border-[var(--border-color)] space-y-1">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all font-medium text-sm cursor-pointer group text-[var(--text-tertiary)] hover:text-red-500 hover:bg-red-500/10"
            >
              <LogOut className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
