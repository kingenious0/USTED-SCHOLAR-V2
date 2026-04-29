import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

type Level = '100' | '200' | '300' | '400';
type Semester = '1' | '2';
type Programme = 'Computer Science' | 'Information Tech' | 'Data Analytics' | 'Cyber Security';

interface UserState {
  hasCompletedOnboarding: boolean;
  level?: Level;
  semester?: Semester;
  programme?: Programme;
  theme: 'light' | 'dark';
}

interface AppContextType {
  userState: UserState;
  setUserState: (state: Partial<UserState>) => void;
  currentScreen: 'landing' | 'onboarding' | 'dashboard' | 'library' | 'hub' | 'quiz' | 'profile';
  setScreen: (screen: 'landing' | 'onboarding' | 'dashboard' | 'library' | 'hub' | 'quiz' | 'profile') => void;
  selectedFile: any;
  setSelectedFile: (file: any) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = 'usted_scholar_app_state';

export function AppProvider({ children }: { children: ReactNode }) {
  // Load initial state from localStorage
  const savedState = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');

  const [userState, _setUserState] = useState<UserState>(savedState.userState || {
    hasCompletedOnboarding: false,
    theme: 'dark',
  });
  
  const [currentScreen, setScreen] = useState<'landing' | 'onboarding' | 'dashboard' | 'library' | 'hub' | 'quiz' | 'profile'>(
    savedState.currentScreen || 'landing'
  );
  
  const [selectedFile, setSelectedFile] = useState<any>(savedState.selectedFile || null);

  // Persistence Effect
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      userState,
      currentScreen,
      selectedFile
    }));
  }, [userState, currentScreen, selectedFile]);

  const setUserState = (state: Partial<UserState>) => {
    _setUserState(prev => ({ ...prev, ...state }));
  };

  return (
    <AppContext.Provider value={{ userState, setUserState, currentScreen, setScreen, selectedFile, setSelectedFile }}>
      <div className={userState.theme}>
        {children}
      </div>
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
