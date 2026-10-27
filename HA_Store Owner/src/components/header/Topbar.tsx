import { Menu, ChevronRight } from 'lucide-react';
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
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-brown-100 bg-white/90 px-4 backdrop-blur-md lg:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          onClick={() => setMobileSidebarOpen(true)}
          className="rounded-md p-2 text-brown-600 transition-colors hover:bg-brown-50 lg:hidden"
          aria-label="Mở menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="hidden min-w-0 items-center gap-2 text-sm sm:flex">
          <span className="text-brown-400">Trang chủ</span>
          <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-brown-300" />
          <span className="truncate font-semibold text-brown-800">{pageNames[currentPage]}</span>
        </div>
        <span className="hidden items-center gap-1.5 rounded-md border border-violet-100 bg-violet-50 px-2.5 py-1 text-[11px] font-medium text-[#7C3AED] md:inline-flex">
          <span className="h-1.5 w-1.5 rounded-sm bg-[#7C3AED]" />
          Chủ gian hàng
        </span>
      </div>
      <div className="flex flex-shrink-0 items-center gap-2 sm:gap-3">
        <div className="hidden w-48 md:block lg:w-72">
          <SearchDropdown />
        </div>
        <NotificationDropdown />
        <ProfileDropdown onProfile={onProfile} />
      </div>
    </header>
  );
}