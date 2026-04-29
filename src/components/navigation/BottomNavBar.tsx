import { useApp } from '../../context/AppContext';
import { Home, Bookmark, User, Zap } from 'lucide-react';

export default function BottomNavBar({ className = "" }: { className?: string }) {
  const { currentScreen, setScreen } = useApp();

  const navItems = [
    { icon: Home, label: 'Home', screen: 'dashboard' },
    // { icon: Bookmark, label: 'Library', screen: 'library' },
    { icon: Zap, label: 'Tutor', screen: 'hub' },
    { icon: User, label: 'Profile', screen: 'profile' },
  ];

  return (
    <nav className={`fixed bottom-0 left-0 w-full glass-card border-t border-white/10 px-6 pb-8 pt-3 flex justify-around items-center z-50 rounded-t-2xl shadow-[0_-4px_20px_rgba(46,91,255,0.15)] ${className}`}>
      {navItems.map((item) => (
        <button
          key={item.screen}
          onClick={() => setScreen(item.screen as any)}
          className={`flex flex-col items-center gap-1 transition-all active:scale-90 ${
            currentScreen === item.screen || (currentScreen === 'profile' && item.screen === 'profile')
              ? 'text-electric-blue' 
              : 'text-zinc-500'
          }`}
        >
          <div className={`${currentScreen === item.screen ? 'bg-electric-blue/10 p-2 rounded-xl' : ''}`}>
            <item.icon className="w-6 h-6" />
          </div>
          <span className="text-[10px] uppercase font-bold tracking-widest font-sans">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
