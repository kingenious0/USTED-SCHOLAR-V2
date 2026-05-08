import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Bookmark, User, LayoutGrid, Zap, Settings, HelpCircle, LogOut } from 'lucide-react';
import { motion } from 'motion/react';

export default function SideNavBar({ className = "" }: { className?: string }) {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const [logoClicks, setLogoClicks] = useState(0);

  const navItems = [
    { icon: Home, label: 'Dashboard', path: '/dashboard', color: 'text-blue-500' },
    { icon: Bookmark, label: 'Library', path: '/library', color: 'text-indigo-500' },
    { icon: Zap, label: 'AI Tutor', path: '/hub', color: 'text-amber-500' },
    { icon: LayoutGrid, label: 'Quizzes', path: '/quiz', color: 'text-emerald-500' },
  ];

  const handleLogoClick = () => {
    setLogoClicks(prev => prev + 1);
    
    // Reset clicks after 2 seconds of inactivity
    const timer = setTimeout(() => setLogoClicks(0), 2000);

    if (logoClicks + 1 >= 3) {
      clearTimeout(timer);
      navigate('/admin');
      setLogoClicks(0);
    }
  };

  return (
    <aside className={`w-[240px] h-screen fixed left-0 top-0 bg-[var(--bg-secondary)] border-r border-[var(--border-color)] flex flex-col p-8 z-50 transition-colors duration-300 ${className}`}>
      <div className="relative z-10 flex flex-col h-full">
      <div className="mb-12">
        <div 
          className="flex items-center gap-2 cursor-pointer active:scale-95 transition-transform"
          onClick={handleLogoClick}
        >
          <span className="text-2xl font-extrabold tracking-tighter text-[var(--text-primary)]">
            USTED<span className="text-[var(--accent-primary)]">Scholar</span>
          </span>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive = currentPath === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold cursor-pointer group relative overflow-hidden ${
                isActive 
                  ? 'text-white bg-[var(--accent-primary)] shadow-lg shadow-[var(--accent-primary)]/20' 
                  : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
              }`}
            >
              {isActive && (
                <motion.div 
                  layoutId="activeNavIndicator"
                  className="absolute left-0 top-0 w-1 h-full bg-white/40 shadow-[2px_0_10px_rgba(255,255,255,0.3)]"
                />
              )}
              <item.icon className={`w-5 h-5 transition-all duration-300 ${isActive ? 'text-white scale-110' : `${item.color} opacity-70 group-hover:opacity-100 group-hover:scale-110`}`} />
              <span className={`text-sm tracking-tight transition-all ${isActive ? 'font-black translate-x-1' : ''}`}>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-4">
        <button className="w-full py-4 bg-[var(--accent-primary)] text-white rounded-2xl font-bold shadow-lg shadow-[var(--accent-primary)]/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
          BETA VERSION
        </button>
        
        <div className="pt-4 border-t border-[var(--border-color)] space-y-1">
          {/* Profile link hidden for now */}
        </div>
        </div>
      </div>
    </aside>
  );
}
