import { Sun, Moon } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { motion } from 'motion/react';

export default function ThemeToggle() {
  const { userState, setUserState } = useApp();
  const isDark = userState.theme === 'dark';

  const toggleTheme = () => {
    setUserState({ theme: isDark ? 'light' : 'dark' });
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] hover:bg-[var(--bg-secondary)] transition-all group relative overflow-hidden shadow-sm active:scale-95"
      aria-label="Toggle Theme"
    >
      <div className="relative w-5 h-5">
        <motion.div
          initial={false}
          animate={{ rotate: isDark ? 0 : 180, opacity: isDark ? 1 : 0 }}
          className="absolute inset-0 flex items-center justify-center text-gold"
        >
          <Moon className="w-5 h-5 fill-gold" />
        </motion.div>
        <motion.div
          initial={false}
          animate={{ rotate: isDark ? -180 : 0, opacity: isDark ? 0 : 1 }}
          className="absolute inset-0 flex items-center justify-center text-sunset-orange"
        >
          <Sun className="w-5 h-5 fill-sunset-orange" />
        </motion.div>
      </div>
    </button>
  );
}
