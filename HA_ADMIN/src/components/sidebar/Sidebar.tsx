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
  { key: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
  { key: 'accounts', label: 'Tài khoản', icon: Users },
  { key: 'poi', label: 'Điểm tham quan', icon: MapPin },
  { key: 'audio', label: 'Thuyết minh', icon: Headphones },
  { key: 'merchants', label: 'Duyệt gian hàng', icon: Store, badge: 'Mới' },
  { key: 'history', label: 'Nhật ký nghe', icon: Clock },
  { key: 'reports', label: 'Báo cáo', icon: BarChart3 },
  { key: 'settings', label: 'Cấu hình', icon: Settings },
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
        <nav className="flex-1 overflow-y-auto scrollbar-thin py-4 px-3 space-y-0.5">
          {!sidebarCollapsed && (
            <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#7ea5c2]/70">
              Menu
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
                  'group relative w-full flex items-center justify-between px-3 py-2 text-[13px] leading-5 transition-colors rounded-lg',
                  active
                    ? 'text-white bg-[#286b7b] font-semibold shadow-sm'
                    : 'text-slate-300/90 font-medium hover:bg-[#204a6b] hover:text-white'
                )}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon className={classNames('w-[18px] h-[18px] flex-shrink-0 transition-colors', active ? 'text-white' : 'text-slate-400 group-hover:text-slate-200')} />
                  {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                </div>

                {!sidebarCollapsed && item.badge && !active && (
                  <span className="px-1.5 py-[3px] rounded-full text-[9px] leading-none font-bold uppercase tracking-wide bg-[#a4db77] text-[#142e44]">
                    {item.badge}
                  </span>
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
