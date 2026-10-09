import { createContext, useContext, useState, type ReactNode } from 'react';

type PageKey = 'dashboard' | 'my-poi' | 'submit-poi' | 'edit-poi' | 'audio' | 'stats' | 'account' | 'approval-status';

interface AppState {
  currentPage: PageKey;
  setCurrentPage: (p: PageKey) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean) => void;
  mobileSidebarOpen: boolean;
  setMobileSidebarOpen: (v: boolean) => void;
  theme: 'light' | 'dark' | 'system';
  setTheme: (t: 'light' | 'dark' | 'system') => void;
  language: 'vi' | 'en';
  setLanguage: (l: 'vi' | 'en') => void;
  isLoggedIn: boolean;
  setIsLoggedIn: (v: boolean) => void;
}

const AppContext = createContext<AppState | null>(null);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentPage, setCurrentPage] = useState<PageKey>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('light');
  const [language, setLanguage] = useState<'vi' | 'en'>('vi');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <AppContext.Provider value={{
      currentPage, setCurrentPage,
      sidebarCollapsed, setSidebarCollapsed,
      mobileSidebarOpen, setMobileSidebarOpen,
      theme, setTheme,
      language, setLanguage,
      isLoggedIn, setIsLoggedIn,
    }}>
      {children}
    </AppContext.Provider>
  );
}
