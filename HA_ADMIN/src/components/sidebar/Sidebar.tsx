import { useApp } from '@/hooks/useApp';
import { classNames } from '@/utils/helpers';
import {
  LayoutDashboard, MapPin, Headphones, Clock,
  BarChart3, Map, FileText, Settings,
  ChevronLeft, ChevronRight, Volume2,
} from 'lucide-react';

type PageKey = 'dashboard' | 'poi' | 'audio' | 'history' | 'analytics' | 'heatmap' | 'reports' | 'settings';

interface NavItem {
  key: PageKey;
  label: string;
  icon: typeof LayoutDashboard;
}

const mainItems: NavItem[] = [
  { key: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
];

const managementItems: NavItem[] = [
  { key: 'poi', label: 'Quản lý điểm tham quan', icon: MapPin },
  { key: 'audio', label: 'Quản lý nội dung thuyết minh', icon: Headphones },
  { key: 'history', label: 'Lịch sử nghe', icon: Clock },
];

const analyticsItems: NavItem[] = [
  { key: 'analytics', label: 'Thống kê & phân tích', icon: BarChart3 },
  { key: 'heatmap', label: 'Bản đồ nhiệt', icon: Map },
  { key: 'reports', label: 'Báo cáo', icon: FileText },
];

const systemItems: NavItem[] = [
  { key: 'settings', label: 'Cài đặt hệ thống', icon: Settings },
];

function NavSection({ title, items, collapsed }: { title: string; items: NavItem[]; collapsed: boolean }) {
  const { currentPage, setCurrentPage, setMobileSidebarOpen } = useApp();

  return (
    <div className="mb-2">
      {!collapsed && (
        <p className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-brown-400">{title}</p>
      )}
      {collapsed && <div className="my-2 border-t border-brown-100 mx-3" />}
      {items.map(item => {
        const Icon = item.icon;
        const active = currentPage === item.key;
        return (
          <button
            key={item.key}
            onClick={() => { setCurrentPage(item.key); setMobileSidebarOpen(false); }}
            className={classNames(
              'group relative w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-all rounded-lg mx-0',
              active
                ? 'text-primary-700 bg-primary-50'
                : 'text-brown-600 hover:bg-brown-50 hover:text-brown-800'
            )}
            title={collapsed ? item.label : undefined}
          >
            {active && <span className="absolute left-0 top-0 bottom-0 w-1 bg-primary-600 rounded-r" />}
            <Icon className={classNames('w-5 h-5 flex-shrink-0', active ? 'text-primary-600' : 'text-brown-400')} />
            {!collapsed && <span className="truncate">{item.label}</span>}
          </button>
        );
      })}
    </div>
  );
}

export default function Sidebar() {
  const { sidebarCollapsed, setSidebarCollapsed, mobileSidebarOpen, setMobileSidebarOpen } = useApp();

  return (
    <>
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setMobileSidebarOpen(false)} />
      )}
      <aside
        className={classNames(
          'fixed lg:sticky top-0 left-0 z-40 h-screen bg-white border-r border-brown-100 flex flex-col transition-all duration-300',
          sidebarCollapsed ? 'w-20' : 'w-64',
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className={classNames('flex items-center gap-3 px-4 h-16 border-b border-brown-100 flex-shrink-0', sidebarCollapsed && 'justify-center')}>
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center flex-shrink-0">
            <Volume2 className="w-5 h-5 text-white" />
          </div>
          {!sidebarCollapsed && (
            <div className="min-w-0">
              <p className="text-sm font-bold text-brown-900 truncate leading-tight">HỘI AN</p>
              <p className="text-[11px] text-primary-600 leading-tight">AUDIO GUIDE</p>
              <p className="text-[10px] text-brown-400 uppercase tracking-wider">Admin Portal</p>
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto scrollbar-thin py-4 px-3">
          <NavSection title="Tổng quan" items={mainItems} collapsed={sidebarCollapsed} />
          <NavSection title="Quản lý" items={managementItems} collapsed={sidebarCollapsed} />
          <NavSection title="Phân tích" items={analyticsItems} collapsed={sidebarCollapsed} />
          <NavSection title="Hệ thống" items={systemItems} collapsed={sidebarCollapsed} />
        </nav>

        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="hidden lg:flex items-center justify-center gap-2 px-4 py-3 border-t border-brown-100 text-brown-400 hover:text-brown-700 hover:bg-brown-50 transition-colors text-xs"
        >
          {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <><ChevronLeft className="w-4 h-4" /> Thu gọn</>}
        </button>
      </aside>
    </>
  );
}
