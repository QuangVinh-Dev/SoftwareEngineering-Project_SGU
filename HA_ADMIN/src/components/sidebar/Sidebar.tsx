import { useApp } from '@/hooks/useApp';
import { classNames } from '@/utils/helpers';
import {
  LayoutDashboard, Users, MapPin, Headphones, Store, Clock,
  BarChart3, Settings, ChevronLeft, ChevronRight, Volume2
} from 'lucide-react';

type PageKey = 'dashboard' | 'accounts' | 'poi' | 'audio' | 'merchants' | 'history' | 'reports' | 'settings';

interface NavItem {
  key: PageKey;
  label: string;
  icon: typeof LayoutDashboard;
  badge?: string;
}

const navItems: NavItem[] = [
  { key: 'dashboard', label: 'Tổng quan hệ thống', icon: LayoutDashboard },
  { key: 'accounts', label: 'Tài khoản quản trị', icon: Users },
  { key: 'poi', label: 'Điểm tham quan di sản', icon: MapPin },
  { key: 'audio', label: 'Thuyết minh & Bản dịch', icon: Headphones },
  { key: 'merchants', label: 'Duyệt hồ sơ gian hàng', icon: Store, badge: 'Mới' },
  { key: 'history', label: 'Nhật ký nghe du khách', icon: Clock },
  { key: 'reports', label: 'Báo cáo & Thống kê', icon: BarChart3 },
  { key: 'settings', label: 'Cấu hình hệ thống', icon: Settings },
];

export default function Sidebar() {
  const { currentPage, setCurrentPage, sidebarCollapsed, setSidebarCollapsed, mobileSidebarOpen, setMobileSidebarOpen, authUser } = useApp();
  const displayedItems = navItems;

  return (
    <>
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setMobileSidebarOpen(false)} />
      )}
      <aside
        className={classNames(
          'fixed lg:sticky top-0 left-0 z-40 h-screen bg-[#183a54] border-r border-[#142e44] text-white flex flex-col transition-all duration-300 shadow-xl',
          sidebarCollapsed ? 'w-20' : 'w-64',
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Brand Header */}
        <div className={classNames('flex items-center gap-3 px-4 h-16 border-b border-[#142e44] flex-shrink-0 bg-[#142e44]/40', sidebarCollapsed && 'justify-center')}>
          <div className="w-10 h-10 rounded-xl bg-[#286b7b] flex items-center justify-center flex-shrink-0 shadow-md">
            <Volume2 className="w-5 h-5 text-white" />
          </div>
          {!sidebarCollapsed && (
            <div className="min-w-0">
              <p className="text-sm font-extrabold text-white truncate tracking-tight">HỘI AN HERITAGE</p>
              <p className="text-[11px] text-[#a4db77] font-bold uppercase tracking-wider">Cổng Quản Trị Viên</p>
            </div>
          )}
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto scrollbar-thin py-4 px-3 space-y-1">
          {!sidebarCollapsed && (
            <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-[#7ea5c2]">
              Menu Điều Hành
            </p>
          )}

          {displayedItems.map(item => {
            const Icon = item.icon;
            const active = currentPage === item.key;
            return (
              <button
                key={item.key}
                onClick={() => { setCurrentPage(item.key); setMobileSidebarOpen(false); }}
                className={classNames(
                  'group relative w-full flex items-center justify-between px-3.5 py-2.5 text-sm font-medium transition-all rounded-xl',
                  active
                    ? 'text-white bg-[#286b7b] font-semibold shadow-md'
                    : 'text-slate-300 hover:bg-[#204a6b] hover:text-white'
                )}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className={classNames('w-5 h-5 flex-shrink-0 transition-colors', active ? 'text-white' : 'text-slate-400 group-hover:text-slate-200')} />
                  {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                </div>

                {!sidebarCollapsed && (
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {item.badge && !active && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#a4db77] text-[#142e44]">
                        {item.badge}
                      </span>
                    )}
                    <ChevronRight className={classNames('w-4 h-4 transition-transform duration-200', active ? 'text-white translate-x-0.5' : 'text-slate-500 group-hover:text-slate-300 group-hover:translate-x-0.5')} />
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer Collapse Button */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="hidden lg:flex items-center justify-center gap-2 px-4 py-3 border-t border-[#142e44] text-[#8ebbd7] hover:text-white hover:bg-[#204a6b] transition-colors text-xs font-medium"
        >
          {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <><ChevronLeft className="w-4 h-4" /> Thu gọn menu</>}
        </button>
      </aside>
    </>
  );
}
