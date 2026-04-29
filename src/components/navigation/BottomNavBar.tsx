import { Link, useLocation } from 'react-router-dom';
import { Home, Bookmark, User, Zap } from 'lucide-react';

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
    <nav className={`fixed bottom-0 left-0 w-full glass-card border-t border-white/10 px-6 pb-8 pt-3 flex justify-around items-center z-50 rounded-t-2xl shadow-[0_-4px_20px_rgba(46,91,255,0.15)] ${className}`}>
      {navItems.map((item) => {
        const isActive = currentPath === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center gap-1 transition-all active:scale-90 ${
              isActive
                ? 'text-[#2E5BFF]' 
                : 'text-zinc-500'
            }`}
          >
            <div className={`${isActive ? 'bg-[#2E5BFF]/10 p-2 rounded-xl' : ''}`}>
              <item.icon className="w-6 h-6" />
            </div>
            <span className="text-[10px] uppercase font-bold tracking-widest font-sans">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
