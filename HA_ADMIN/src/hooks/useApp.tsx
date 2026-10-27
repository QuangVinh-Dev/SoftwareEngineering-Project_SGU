import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  clearAccessToken, getAccessToken, getCurrentUser, onUnauthorized, saveAccessToken,
  type AuthUser,
} from '@/services/authApi';

type PageKey = 'dashboard' | 'accounts' | 'poi' | 'audio' | 'merchants' | 'history' | 'reports' | 'settings';
type AuthStatus = 'loading' | 'anonymous' | 'admin' | 'forbidden' | 'error';

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
  authStatus: AuthStatus;
  authError: string;
  authUser: AuthUser | null;
  signIn: (token: string, user: AuthUser) => void;
  signOut: () => void;
  retryAuth: () => void;
}

const AppContext = createContext<AppState | null>(null);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

function isAdmin(user: AuthUser) {
  return user.accountType === 'ADMIN' && ['ADMIN', 'SUPER_ADMIN', 'POI_ADMIN'].includes(user.role);
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentPage, setCurrentPage] = useState<PageKey>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('light');
  const [language, setLanguage] = useState<'vi' | 'en'>('vi');
  const [authStatus, setAuthStatus] = useState<AuthStatus>(() => getAccessToken() ? 'loading' : 'anonymous');
  const [authError, setAuthError] = useState('');
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authAttempt, setAuthAttempt] = useState(0);

  useEffect(() => onUnauthorized(() => {
    setAuthUser(null);
    setAuthError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    setAuthStatus('anonymous');
  }), []);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      setAuthStatus('anonymous');
      return;
    }
    let active = true;
    setAuthStatus('loading');
    getCurrentUser().then(user => {
      if (!active) return;
      setAuthUser(user);
      setAuthStatus(isAdmin(user) ? 'admin' : 'forbidden');
      if (!isAdmin(user)) clearAccessToken();
      setAuthError('');
    }).catch(error => {
      if (!active) return;
      const status = error instanceof Error && 'status' in error ? error.status : undefined;
      // A 401 already dispatches the shared unauthorized event and returns the
      // user to the login screen. Other failures must leave the loading state.
      if (status === 401) return;
      if (status === 403) {
        clearAccessToken();
        setAuthStatus('forbidden');
        return;
      }
      setAuthError('Không thể xác minh phiên đăng nhập với máy chủ. Kiểm tra phiên bản API và kết nối.');
      setAuthStatus('error');
    });
    return () => { active = false; };
  }, [authAttempt]);

  const signIn = (token: string, user: AuthUser) => {
    if (!isAdmin(user)) {
      clearAccessToken();
      setAuthUser(user);
      setAuthStatus('forbidden');
      return;
    }
    saveAccessToken(token);
    setAuthUser(user);
    setAuthError('');
    setAuthStatus('admin');
  };

  const signOut = () => {
    clearAccessToken();
    setAuthUser(null);
    setAuthError('');
    setAuthStatus('anonymous');
  };

  return (
    <AppContext.Provider value={{
      currentPage, setCurrentPage, sidebarCollapsed, setSidebarCollapsed,
      mobileSidebarOpen, setMobileSidebarOpen, theme, setTheme, language, setLanguage,
      authStatus, authError, authUser, signIn, signOut,
      retryAuth: () => setAuthAttempt(value => value + 1),
    }}>
      {children}
    </AppContext.Provider>
  );
}
