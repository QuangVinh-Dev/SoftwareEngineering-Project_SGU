import { useState, type ReactNode } from 'react';
import { useApp } from '@/hooks/useApp';
import Sidebar from '@/components/sidebar/Sidebar';
import Topbar from '@/components/header/Topbar';
import ProfileModal from '@/components/modals/ProfileModal';

export default function Layout({ children }: { children: ReactNode }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const { sidebarCollapsed } = useApp();

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <Sidebar />
      <div className={`flex min-w-0 flex-1 flex-col transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-0' : 'lg:ml-0'}`}>
        <Topbar onProfile={() => setProfileOpen(true)} />
        <main className="flex-1 p-4 lg:p-6 overflow-x-hidden">
          {children}
        </main>
      </div>
      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
    </div>
  );
}
