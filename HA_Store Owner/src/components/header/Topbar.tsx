import { Menu, ChevronRight, Store, Bell, User } from 'lucide-react';
import { useApp } from '@/hooks/useApp';
import ProfileDropdown from './ProfileDropdown';

const pageNames: Record<string, string> = {
  dashboard: 'Tổng quan & Thống kê lượt nghe',
  'my-poi': 'Điểm tham quan (POI) của gian hàng',
  'edit-poi': 'Chỉnh sửa & Gửi duyệt lại POI',
  stats: 'Tổng quan & Thống kê lượt nghe',
  account: 'Hồ sơ gian hàng',
  'approval-status': 'Theo dõi trạng thái phê duyệt',
};

interface TopbarProps {
  onProfile: () => void;
}

export default function Topbar({ onProfile }: TopbarProps) {
  const { currentPage, setMobileSidebarOpen, authUser } = useApp();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur-md lg:px-6 shadow-sm">
      <div className="flex min-w-0 items-center gap-3">
        <button
          onClick={() => setMobileSidebarOpen(true)}
          className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-purple-50 hover:text-primary-700 lg:hidden"
          aria-label="Mở menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="hidden min-w-0 items-center gap-2 text-sm sm:flex">
          <span className="text-slate-400 font-medium">Cổng Chủ Gian Hàng</span>
          <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-slate-300" />
          <span className="truncate font-bold text-slate-800 tracking-tight">
            {pageNames[currentPage] || 'Bảng điều khiển'}
          </span>
        </div>
      </div>

      <div className="flex flex-shrink-0 items-center gap-2 sm:gap-3">
        <ProfileDropdown onProfile={onProfile} />
      </div>
    </header>
  );
}
