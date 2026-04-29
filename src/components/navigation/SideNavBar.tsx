import { Link, useLocation } from 'react-router-dom';
import { Home, Bookmark, User, LayoutGrid, Zap, Settings, HelpCircle, LogOut } from 'lucide-react';
import { motion } from 'motion/react';

export default function SideNavBar({ className = "" }: { className?: string }) {
  const location = useLocation();
  const currentPath = location.pathname;

  const navItems = [
    { icon: Home, label: 'Dashboard', path: '/dashboard' },
    { icon: Bookmark, label: 'Library', path: '/library' },
    { icon: Zap, label: 'AI Tutor', path: '/hub' },
    { icon: LayoutGrid, label: 'Quizzes', path: '/quiz' },
  ];

  return (
    <aside className={`w-[240px] h-screen fixed left-0 top-0 bg-[#0A0A0A] border-r border-white/10 flex flex-col p-8 z-50 ${className}`}>
      <div className="mb-12">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-extrabold tracking-tighter text-white">
            USTED<span className="text-[#2E5BFF]">Scholar</span>
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
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold cursor-pointer group ${
                isActive 
                  ? 'text-white bg-[#2E5BFF] shadow-lg shadow-[#2E5BFF]/20' 
                  : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-zinc-500 group-hover:text-white'}`} />
              <span className="text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-4">
        <button className="w-full py-4 bg-[#2E5BFF] text-white rounded-2xl font-bold shadow-lg shadow-[#2E5BFF]/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
          BETA VERSION
        </button>
        
        <div className="pt-4 border-t border-white/5 space-y-1">
          <Link to="/settings" className="w-full flex items-center gap-3 px-2 py-2 text-zinc-500 hover:text-white transition-colors text-xs font-medium">
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </Link>
          <Link to="/support" className="w-full flex items-center gap-3 px-2 py-2 text-zinc-500 hover:text-white transition-colors text-xs font-medium">
            <HelpCircle className="w-4 h-4" />
            <span>Support</span>
          </Link>
        </div>
      </div>
    </aside>
  );
}
