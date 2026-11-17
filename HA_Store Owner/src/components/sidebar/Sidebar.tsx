import { useApp } from '@/hooks/useApp';
import { classNames } from '@/utils/helpers';
import {
  LayoutDashboard, User, FileCheck, MapPin, Edit3,
  BarChart3, ChevronLeft, ChevronRight, Store, Sparkles
} from 'lucide-react';

export type PageKey = 'dashboard' | 'my-poi' | 'edit-poi' | 'stats' | 'account' | 'approval-status';

interface NavItem {
  key: PageKey;
  label: string;
  icon: typeof LayoutDashboard;
  badge?: string;
}

const navSections: { title: string; items: NavItem[] }[] = [
  {
    title: 'Tổng quan & Thống kê',
    items: [
      { key: 'dashboard', label: 'Tổng quan & Thống kê', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Điểm tham quan (POI)',
    items: [
      { key: 'my-poi', label: 'POI của gian hàng', icon: MapPin },
      { key: 'edit-poi', label: 'Chỉnh sửa & Gửi duyệt', icon: Edit3 },
    ],
  },
  {
    title: 'Hồ sơ & Xét duyệt',
    items: [
      { key: 'approval-status', label: 'Trạng thái xét duyệt', icon: FileCheck },
      { key: 'account', label: 'Hồ sơ gian hàng', icon: User },
    ],
  },
];

export default function Sidebar() {
  const { currentPage, setCurrentPage, sidebarCollapsed, setSidebarCollapsed, mobileSidebarOpen, setMobileSidebarOpen, authUser } = useApp();

  return (
    <>
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setMobileSidebarOpen(false)} />
      )}
      <aside
        className={classNames(
          'fixed lg:sticky top-0 left-0 z-40 h-screen bg-[#2e1065] border-r border-[#3b0764] text-white flex flex-col transition-all duration-300 shadow-2xl',
          sidebarCollapsed ? 'w-20' : 'w-64',
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Brand Header */}
        <div className={classNames('flex items-center gap-3 px-4 h-16 border-b border-purple-900/60 flex-shrink-0 bg-[#240c52]', sidebarCollapsed && 'justify-center')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#9333ea] flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-950/40 border border-purple-400/30">
            <Store className="w-5 h-5 text-white" />
          </div>
          {!sidebarCollapsed && (
            <div className="min-w-0">
              <p className="text-sm font-extrabold text-white truncate tracking-tight flex items-center gap-1.5">
                HỘI AN HERITAGE
              </p>
              <p className="text-[11px] text-[#c084fc] font-bold uppercase tracking-wider flex items-center gap-1">
                <span>Chủ Gian Hàng</span>
                <Sparkles className="w-3 h-3 text-amber-300" />
              </p>
            </div>
          )}
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto scrollbar-thin py-4 px-3 space-y-4">
          {navSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              {!sidebarCollapsed && (
                <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-purple-300/60">
                  {section.title}
                </p>
              )}
              {sidebarCollapsed && sIdx > 0 && (
                <div className="my-2 border-t border-purple-900/50 mx-2" />
              )}
              {section.items.map(item => {
                const Icon = item.icon;
                const active = currentPage === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => { setCurrentPage(item.key); setMobileSidebarOpen(false); }}
                    className={classNames(
                      'group relative w-full flex items-center justify-between px-3 py-2.5 text-[13px] leading-5 transition-all rounded-xl',
                      active
                        ? 'text-white bg-gradient-to-r from-[#7c3aed] to-[#8b5cf6] font-semibold shadow-md shadow-purple-900/40 border border-purple-400/20'
                        : 'text-purple-200/80 font-medium hover:bg-[#3b127e] hover:text-white'
                    )}
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon className={classNames(
                        'w-5 h-5 flex-shrink-0 transition-colors',
                        active ? 'text-white' : 'text-purple-300/70 group-hover:text-purple-200'
                      )} />
                      {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                    </div>

                    {!sidebarCollapsed && item.badge && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#c084fc]/20 text-[#e9d5ff] border border-[#c084fc]/30">
                        {item.badge}
                      </span>
                    )}

                    {sidebarCollapsed && active && (
                      <span className="absolute right-1 top-2.5 bottom-2.5 w-1 bg-purple-400 rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User Card & Collapse Footer */}
        <div className="border-t border-purple-900/60 p-3 bg-[#240c52]/80 flex-shrink-0">
          {!sidebarCollapsed ? (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-purple-600/40 border border-purple-400/30 flex items-center justify-center font-bold text-white text-xs">
                  {authUser?.username ? authUser.username.charAt(0).toUpperCase() : 'G'}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">{authUser?.fullName || authUser?.username || 'Chủ gian hàng'}</p>
                  <p className="text-[10px] text-purple-300/70 truncate">ID Gian hàng: #{authUser?.merchantId || '01'}</p>
                </div>
              </div>
              <button
                onClick={() => setSidebarCollapsed(true)}
                className="p-1.5 rounded-lg text-purple-300 hover:text-white hover:bg-purple-800/40 transition-colors"
                title="Thu gọn sidebar"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex justify-center">
              <button
                onClick={() => setSidebarCollapsed(false)}
                className="p-1.5 rounded-lg text-purple-300 hover:text-white hover:bg-purple-800/40 transition-colors"
                title="Mở rộng sidebar"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
