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
  recentlyOpenedIds: string[];
}

interface AppContextType {
  userState: UserState;
  setUserState: (state: Partial<UserState>) => void;
  currentScreen: 'landing' | 'onboarding' | 'dashboard' | 'library' | 'hub' | 'quiz' | 'profile';
  setScreen: (screen: 'landing' | 'onboarding' | 'dashboard' | 'library' | 'hub' | 'quiz' | 'profile') => void;
  selectedFile: any;
  setSelectedFile: (file: any) => void;
  openCourse: (course: any) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = 'usted_scholar_app_state';

export function AppProvider({ children }: { children: ReactNode }) {
  // Load initial state from localStorage
  const savedState = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');

  const [userState, _setUserState] = useState<UserState>(savedState.userState || {
    hasCompletedOnboarding: false,
    theme: 'dark',
    recentlyOpenedIds: [],
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

  const openCourse = (course: any) => {
    setSelectedFile(course);
    const currentIds = userState.recentlyOpenedIds || [];
    const updatedIds = [course.id, ...currentIds.filter(id => id !== course.id)].slice(0, 10);
    setUserState({ recentlyOpenedIds: updatedIds });
  };

  // Sync theme with body and root class
  useEffect(() => {
    const root = window.document.documentElement;
    const body = window.document.body;
    root.classList.remove('light', 'dark');
    body.classList.remove('light', 'dark');
    root.classList.add(userState.theme);
    body.classList.add(userState.theme);
    
    // Also update data-theme attribute which some systems use
    root.setAttribute('data-theme', userState.theme);
  }, [userState.theme]);

  return (
    <AppContext.Provider value={{ userState, setUserState, currentScreen, setScreen, selectedFile, setSelectedFile, openCourse }}>
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
