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
      <motion.div
        initial={false}
        animate={{ y: isDark ? 0 : 40, opacity: isDark ? 1 : 0 }}
        className="text-gold group-hover:text-gold transition-colors"
      >
        <Moon className="w-5 h-5 fill-gold" />
      </motion.div>
      <motion.div
        initial={false}
        animate={{ y: isDark ? -40 : -20, opacity: isDark ? 0 : 1 }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 text-sunset-orange group-hover:text-sunset-orange transition-colors"
      >
        <Sun className="w-5 h-5 fill-sunset-orange" />
      </motion.div>
    </button>
  );
}
