import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import SideNavBar from './components/navigation/SideNavBar';
import BottomNavBar from './components/navigation/BottomNavBar';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2 } from 'lucide-react';

// Lazy-load screen components to optimize bundle size and FCP/LCP performance
const LandingScreen = lazy(() => import('./screens/LandingScreen'));
const OnboardingScreen = lazy(() => import('./screens/OnboardingScreen'));
const LibraryScreen = lazy(() => import('./screens/LibraryScreen'));
const HubScreen = lazy(() => import('./screens/HubScreen'));
const QuizScreen = lazy(() => import('./screens/QuizScreen'));
const ProfileScreen = lazy(() => import('./screens/ProfileScreen'));
const AdminScreen = lazy(() => import('./screens/AdminScreen'));
const FlashcardScreen = lazy(() => import('./screens/FlashcardScreen'));

// Premium, scientifically-grounded loading fallback for smooth workspace transitions
const PageLoader = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--bg-primary)] space-y-4">
    <div className="relative">
      <div className="absolute inset-0 bg-electric-blue/20 blur-xl rounded-full animate-pulse" />
      <Loader2 className="w-10 h-10 text-electric-blue animate-spin relative z-10" />
    </div>
    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--text-tertiary)] animate-pulse">Loading Workspace...</p>
  </div>
);

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
            <Suspense fallback={<PageLoader />}>
              <Routes location={location}>
                <Route path="/" element={<LandingScreen />} />
                <Route path="/onboarding" element={<OnboardingScreen />} />
                <Route path="/dashboard" element={<Navigate to="/library" replace />} />
                <Route path="/library" element={<LibraryScreen />} />
                <Route path="/hub" element={<HubScreen />} />
                <Route path="/quiz" element={<QuizScreen />} />
                <Route path="/profile" element={<ProfileScreen />} />
                <Route path="/admin" element={<AdminScreen />} />
                <Route path="/flashcards" element={<FlashcardScreen />} />
              </Routes>
            </Suspense>
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
