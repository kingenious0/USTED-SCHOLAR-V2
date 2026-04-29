/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppProvider, useApp } from './context/AppContext';
import LandingScreen from './screens/LandingScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import DashboardScreen from './screens/DashboardScreen';
import LibraryScreen from './screens/LibraryScreen';
import HubScreen from './screens/HubScreen';
import QuizScreen from './screens/QuizScreen';
import ProfileScreen from './screens/ProfileScreen';
import SideNavBar from './components/navigation/SideNavBar';
import BottomNavBar from './components/navigation/BottomNavBar';
import { motion, AnimatePresence } from 'motion/react';

function AppRouter() {
  const { currentScreen } = useApp();

  const renderScreen = () => {
    switch (currentScreen) {
      case 'landing': return <LandingScreen />;
      case 'onboarding': return <OnboardingScreen />;
      case 'dashboard': return <DashboardScreen />;
      case 'library': return <LibraryScreen />;
      case 'hub': return <HubScreen />;
      case 'quiz': return <QuizScreen />;
      case 'profile': return <ProfileScreen />;
      default: return <LandingScreen />;
    }
  };

  const showNav = currentScreen !== 'landing' && currentScreen !== 'onboarding' && currentScreen !== 'quiz';

  return (
    <div className="min-h-screen flex text-white relative">
      {showNav && <SideNavBar className="hidden lg:flex" />}
      <main className={`flex-1 min-w-0 ${showNav ? 'lg:pl-sidebar-width pb-24 lg:pb-0' : ''}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentScreen}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="min-h-screen"
          >
            {renderScreen()}
          </motion.div>
        </AnimatePresence>
      </main>
      {showNav && <BottomNavBar className="lg:hidden" />}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppRouter />
    </AppProvider>
  );
}

