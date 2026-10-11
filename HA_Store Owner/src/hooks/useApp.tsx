import { createContext, useContext, useState, type ReactNode } from 'react';
import type { AuthUser } from '@/services/authApi';

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
  authUser: AuthUser | null;
  signIn: (token: string, user: AuthUser, remember: boolean) => void;
  signOut: () => void;
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
  const [authToken, setAuthToken] = useState(() =>
    localStorage.getItem('ha_auth_token') || sessionStorage.getItem('ha_auth_token'),
  );
  const [authUser, setAuthUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem('ha_auth_user') || sessionStorage.getItem('ha_auth_user');
    if (!stored) return null;
    try {
      return JSON.parse(stored) as AuthUser;
    } catch {
      localStorage.removeItem('ha_auth_user');
      sessionStorage.removeItem('ha_auth_user');
      return null;
    }
  });

  const signIn = (token: string, user: AuthUser, remember: boolean) => {
    const storage = remember ? localStorage : sessionStorage;
    const otherStorage = remember ? sessionStorage : localStorage;
    storage.setItem('ha_auth_token', token);
    storage.setItem('ha_auth_user', JSON.stringify(user));
    otherStorage.removeItem('ha_auth_token');
    otherStorage.removeItem('ha_auth_user');
    setAuthToken(token);
    setAuthUser(user);
  };

  const signOut = () => {
    localStorage.removeItem('ha_auth_token');
    localStorage.removeItem('ha_auth_user');
    sessionStorage.removeItem('ha_auth_token');
    sessionStorage.removeItem('ha_auth_user');
    setAuthToken(null);
    setAuthUser(null);
  };

  return (
    <AppContext.Provider value={{
      currentPage, setCurrentPage,
      sidebarCollapsed, setSidebarCollapsed,
      mobileSidebarOpen, setMobileSidebarOpen,
      theme, setTheme,
      language, setLanguage,
      isLoggedIn: Boolean(authToken && authUser?.accountType === 'MERCHANT'
        && authUser.role === 'MERCHANT'),
      authUser, signIn, signOut,
    }}>
      {children}
    </AppContext.Provider>
  );
}
