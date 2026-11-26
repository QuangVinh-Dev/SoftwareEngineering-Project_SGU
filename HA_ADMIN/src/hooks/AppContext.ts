import { createContext } from 'react';
import type { AuthUser } from '@/services/authApi';

export type PageKey = 'dashboard' | 'accounts' | 'poi' | 'audio' | 'merchants' | 'history' | 'reports' | 'settings';
export type AuthStatus = 'loading' | 'anonymous' | 'admin' | 'forbidden' | 'error';

export interface AppState {
  currentPage: PageKey;
  setCurrentPage: (page: PageKey) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  mobileSidebarOpen: boolean;
  setMobileSidebarOpen: (open: boolean) => void;
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  language: 'vi' | 'en';
  setLanguage: (language: 'vi' | 'en') => void;
  authStatus: AuthStatus;
  authError: string;
  authUser: AuthUser | null;
  signIn: (token: string, user: AuthUser) => void;
  signOut: () => void;
  retryAuth: () => void;
}

export const AppContext = createContext<AppState | null>(null);
