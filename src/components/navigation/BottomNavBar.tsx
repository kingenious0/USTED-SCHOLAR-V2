import { Link, useLocation } from 'react-router-dom';
import { Home, Bookmark, User, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect } from 'react';

export default function BottomNavBar({ className = "" }: { className?: string }) {
  const location = useLocation();
  const currentPath = location.pathname;

  const navItems = [
    { icon: Home, label: 'Home', path: '/dashboard' },
    { icon: Bookmark, label: 'Library', path: '/library' },
    { icon: Zap, label: 'Tutor', path: '/hub' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  return (
    <nav className={`fixed bottom-0 left-0 w-full glass-card border-t border-[var(--border-color)] px-6 pb-8 pt-3 flex justify-around items-center z-50 rounded-t-2xl shadow-[0_-4px_20px_rgba(46,91,255,0.15)] ${className}`}>
      {navItems.map((item) => {
        const isActive = currentPath === item.path;
        return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-1 transition-all active:scale-90 relative ${
                isActive
                  ? 'text-[var(--accent-primary)]' 
                  : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
              }`}
            >
              <div className={`transition-all duration-300 ${isActive ? 'bg-[var(--accent-primary)]/15 p-2.5 rounded-xl shadow-[0_0_15px_rgba(46,91,255,0.2)]' : 'p-2.5'}`}>
                <item.icon className={`w-6 h-6 transition-transform ${isActive ? 'scale-110' : ''}`} />
              </div>
              <span className={`text-[9px] uppercase font-black tracking-[0.2em] transition-all ${isActive ? 'opacity-100 translate-y-0' : 'opacity-50 -translate-y-1'}`}>{item.label}</span>
              {isActive && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute -bottom-1 w-8 h-1 rounded-full bg-[var(--accent-primary)] shadow-[0_0_8px_rgba(46,91,255,0.8)]"
                />
              )}
            </Link>
        );
      })}
    </nav>
  );
}
