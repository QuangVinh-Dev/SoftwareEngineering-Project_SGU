import { AppProvider, useApp } from '@/hooks/useApp';
import { ToastProvider } from '@/components/toast/ToastProvider';
import Layout from '@/components/layout/Layout';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import MyPOI from '@/pages/MyPOI';
import SubmitPOI from '@/pages/SubmitPOI';
import EditPOI from '@/pages/EditPOI';
import AudioContentPage from '@/pages/AudioContentPage';
import Stats from '@/pages/Stats';
import Account from '@/pages/Account';
import ApprovalStatus from '@/pages/ApprovalStatus';

function AppContent() {
  const { isLoggedIn, currentPage } = useApp();

  if (!isLoggedIn) return <Login />;

  const pages: Record<string, React.ReactNode> = {
    dashboard: <Dashboard />,
    'my-poi': <MyPOI />,
    'submit-poi': <SubmitPOI />,
    'edit-poi': <EditPOI />,
    audio: <AudioContentPage />,
    stats: <Stats />,
    account: <Account />,
    'approval-status': <ApprovalStatus />,
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
