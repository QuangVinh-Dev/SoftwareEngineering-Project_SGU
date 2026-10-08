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
  const { isLoggedIn, currentPage } = useApp();

  if (!isLoggedIn) return <Login />;

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
