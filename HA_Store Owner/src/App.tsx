import { AppProvider, useApp } from '@/hooks/useApp';
import { ToastProvider } from '@/components/toast/ToastProvider';
import Layout from '@/components/layout/Layout';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import MyPOI from '@/pages/MyPOI';
import EditPOI from '@/pages/EditPOI';
import Stats from '@/pages/Stats';
import Account from '@/pages/Account';
import ApprovalStatus from '@/pages/ApprovalStatus';

function AppContent() {
  const { isLoggedIn, currentPage } = useApp();

  // Chưa đăng nhập -> Chỉ hiển thị trang Login độc lập
  if (!isLoggedIn) return <Login />;

  const pages: Record<string, React.ReactNode> = {
    dashboard: <Dashboard />,
    'my-poi': <MyPOI />,
    'edit-poi': <EditPOI />,
    stats: <Stats />,
    account: <Account />,
    'approval-status': <ApprovalStatus />,
  };

  // Đã đăng nhập -> Hiển thị Layout Admin (có Sidebar, Header, Footer bên trong Layout nếu bạn muốn)
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
