import { Menu } from 'lucide-react';
import { useApp } from '@/hooks/useApp';
import SearchDropdown from './SearchDropdown';
import NotificationDropdown from './NotificationDropdown';
import ProfileDropdown from './ProfileDropdown';

const pageNames: Record<string, string> = {
  dashboard: 'Tổng quan',
  'my-poi': 'POI của tôi',
  'submit-poi': 'Gửi POI mới',
  'edit-poi': 'Chỉnh sửa POI',
  audio: 'Nội dung audio',
  stats: 'Thống kê lượt nghe',
  account: 'Tài khoản của tôi',
  'approval-status': 'Trạng thái duyệt',
};

interface TopbarProps {
  onProfile: () => void;
}

export default function Topbar({ onProfile }: TopbarProps) {
  const { currentPage, setMobileSidebarOpen } = useApp();

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-brown-100 h-16 flex items-center justify-between px-4 lg:px-6 gap-4">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileSidebarOpen(true)}
          className="lg:hidden p-2 rounded-lg hover:bg-brown-50 transition-colors text-brown-600"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden sm:flex items-center gap-2 text-sm">
          <span className="text-brown-400">Trang chủ</span>
          <span className="text-brown-300">/</span>
          <span className="font-semibold text-brown-800">{pageNames[currentPage]}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <div className="hidden md:block w-48 lg:w-72">
          <SearchDropdown />
        </div>
        <NotificationDropdown />
        <ProfileDropdown onProfile={onProfile} />
      </div>
    </header>
  );
}
