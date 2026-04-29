import { useApp } from '../../context/AppContext';
import { Home, Bookmark, User, LayoutGrid, Zap, Settings, HelpCircle, LogOut } from 'lucide-react';
import { motion } from 'motion/react';

export default function SideNavBar({ className = "" }: { className?: string }) {
  const { currentScreen, setScreen } = useApp();

  const navItems = [
    { icon: Home, label: 'Dashboard', screen: 'dashboard' },
    // { icon: Bookmark, label: 'Smart Library', screen: 'library' },
    { icon: Zap, label: 'AI Tutor', screen: 'hub' },
    { icon: LayoutGrid, label: 'Quizzes', screen: 'quiz' },
  ];

  return (
    <aside className={`w-[240px] h-screen fixed left-0 top-0 bg-surface-dark border-r border-white/10 flex flex-col p-8 z-50 ${className}`}>
      <div className="mb-12">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-extrabold tracking-tighter text-white">
            USTED<span className="text-electric-blue">Scholar</span>
          </span>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.screen}
            onClick={() => {
              console.log('Navigating to:', item.screen);
              setScreen(item.screen as any);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold cursor-pointer group ${
              currentScreen === item.screen 
                ? 'text-white bg-electric-blue shadow-lg shadow-electric-blue/20' 
                : 'text-white/40 hover:text-white hover:bg-white/5'
            }`}
          >
            <item.icon className={`w-5 h-5 ${currentScreen === item.screen ? 'text-white' : 'text-zinc-500 group-hover:text-white'}`} />
            <span className="text-sm">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="mt-auto space-y-4">
        <button className="w-full py-4 bg-electric-blue text-white rounded-premium font-bold shadow-lg shadow-electric-blue/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
          BETA VERSION
        </button>
        
        <div className="pt-4 border-t border-white/5 space-y-1">
          <button className="w-full flex items-center gap-3 px-2 py-2 text-zinc-500 hover:text-white transition-colors text-xs font-medium">
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </button>
          <button className="w-full flex items-center gap-3 px-2 py-2 text-zinc-500 hover:text-white transition-colors text-xs font-medium">
            <HelpCircle className="w-4 h-4" />
            <span>Support</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
