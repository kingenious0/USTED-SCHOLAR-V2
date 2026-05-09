import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import LandingScreen from './screens/LandingScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import DashboardScreen from './screens/DashboardScreen';
import LibraryScreen from './screens/LibraryScreen';
import HubScreen from './screens/HubScreen';
import QuizScreen from './screens/QuizScreen';
import ProfileScreen from './screens/ProfileScreen';
import AdminScreen from './screens/AdminScreen';
import SideNavBar from './components/navigation/SideNavBar';
import BottomNavBar from './components/navigation/BottomNavBar';
import { motion, AnimatePresence } from 'motion/react';

function AppContent() {
  const location = useLocation();
  const showNav = location.pathname !== '/' && location.pathname !== '/onboarding' && location.pathname !== '/admin';

  return (
    <div className="min-h-screen flex text-[var(--text-primary)] relative bg-[var(--bg-primary)] transition-colors duration-300">
      {showNav && <SideNavBar className="hidden lg:flex" />}
      <main className={`flex-1 min-w-0 ${showNav ? 'lg:pl-[240px] pb-24 lg:pb-0' : ''}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="min-h-screen"
          >
            <Routes location={location}>
              <Route path="/" element={<LandingScreen />} />
              <Route path="/onboarding" element={<OnboardingScreen />} />
              <Route path="/dashboard" element={<DashboardScreen />} />
              <Route path="/library" element={<LibraryScreen />} />
              <Route path="/hub" element={<HubScreen />} />
              <Route path="/quiz" element={<QuizScreen />} />
              <Route path="/profile" element={<ProfileScreen />} />
              <Route path="/admin" element={<AdminScreen />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>
      {showNav && <BottomNavBar className="lg:hidden" />}
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </Router>
  );
}
