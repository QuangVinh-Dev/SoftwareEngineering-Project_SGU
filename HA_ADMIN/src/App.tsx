import { AppProvider, useApp } from '@/hooks/useApp';
import { ToastProvider } from '@/components/toast/ToastProvider';
import Layout from '@/components/layout/Layout';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import POIManagement from '@/pages/POIManagement';
import AudioContent from '@/pages/AudioContent';
import ListeningHistory from '@/pages/ListeningHistory';
import Analytics from '@/pages/Analytics';
import Heatmap from '@/pages/Heatmap';
import Reports from '@/pages/Reports';
import Settings from '@/pages/Settings';

function AppContent() {
  const { authStatus, authError, authUser, currentPage, signOut, retryAuth } = useApp();

  if (authStatus === 'loading') return <div className="min-h-screen grid place-items-center text-brown-500">Đang xác minh phiên đăng nhập…</div>;
  if (authStatus === 'error') return (
    <div className="min-h-screen grid place-items-center p-6 text-center">
      <div><p className="mb-4 text-brown-700">{authError}</p><button className="text-primary-700 underline" onClick={retryAuth}>Thử lại</button><button className="ml-4 text-brown-500 underline" onClick={signOut}>Đăng nhập lại</button></div>
    </div>
  );
  if (authStatus === 'anonymous') return <Login />;
  if (authStatus === 'forbidden') return (
    <div className="min-h-screen grid place-items-center p-6 text-center">
      <div><h1 className="text-2xl font-bold text-brown-900">403 — Không có quyền truy cập</h1><p className="mt-2 text-brown-500">Tài khoản {authUser?.username ?? ''} không có role quản trị.</p><button className="mt-5 text-primary-700 underline" onClick={signOut}>Đăng xuất</button></div>
    </div>
  );

  if (authUser?.role === 'POI_ADMIN' && currentPage !== 'poi' && currentPage !== 'audio') {
    return <Layout><POIManagement /></Layout>;
  }

  const pages: Record<string, React.ReactNode> = {
    dashboard: <Dashboard />,
    poi: <POIManagement />,
    audio: <AudioContent />,
    history: <ListeningHistory />,
    analytics: <Analytics />,
    heatmap: <Heatmap />,
    reports: <Reports />,
    settings: <Settings />,
  };

  return <Layout>{pages[currentPage]}</Layout>;
}

export default function App() {
  return (
    <AppProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AppProvider>
  );
}
