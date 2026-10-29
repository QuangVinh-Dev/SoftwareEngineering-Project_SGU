import { Menu } from 'lucide-react';
import { useApp } from '@/hooks/useApp';
import ProfileDropdown from './ProfileDropdown';

const pageNames: Record<string, string> = {
  dashboard: 'Tổng quan',
  accounts: 'Tài khoản quản trị',
  poi: 'Điểm tham quan',
  audio: 'Thuyết minh',
  merchants: 'Duyệt gian hàng',
  history: 'Nhật ký nghe',
  reports: 'Báo cáo',
  settings: 'Cấu hình',
};

interface TopbarProps {
  onProfile: () => void;
  onChangePassword: () => void;
  onAccountSettings: () => void;
  onRecentActivity: () => void;
}

export default function Topbar({ onProfile, onChangePassword, onAccountSettings, onRecentActivity }: TopbarProps) {
  const { currentPage, setMobileSidebarOpen } = useApp();

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-brown-100 h-16 flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileSidebarOpen(true)}
          className="lg:hidden p-2 rounded-lg hover:bg-brown-50 transition-colors text-brown-600"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-brown-400 font-medium">Cổng Quản Trị</span>
          <span className="text-brown-300">/</span>
          <span className="font-bold text-brown-900 tracking-tight">{pageNames[currentPage] || 'Bảng điều khiển'}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <ProfileDropdown
          onProfile={onProfile}
          onChangePassword={onChangePassword}
          onAccountSettings={onAccountSettings}
          onRecentActivity={onRecentActivity}
        />
      </div>
    </header>
  );
}
