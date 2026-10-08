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
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
];

const managementItems: NavItem[] = [
  { key: 'poi', label: 'POI Management', icon: MapPin },
  { key: 'audio', label: 'Audio Content', icon: Headphones },
  { key: 'history', label: 'Listening History', icon: Clock },
];

const analyticsItems: NavItem[] = [
  { key: 'analytics', label: 'Statistics & Analytics', icon: BarChart3 },
  { key: 'heatmap', label: 'Heatmap', icon: Map },
  { key: 'reports', label: 'Reports', icon: FileText },
];

const systemItems: NavItem[] = [
  { key: 'settings', label: 'System Settings', icon: Settings },
];

function NavSection({ title, items, collapsed }: { title: string; items: NavItem[]; collapsed: boolean }) {
  const { currentPage, setCurrentPage, setMobileSidebarOpen } = useApp();

  return (
    <div className="mb-2">
      {!collapsed && (
        <p className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-brown-300">{title}</p>
      )}
      {collapsed && <div className="my-2 border-t border-brown-700/40 mx-3" />}
      {items.map(item => {
        const Icon = item.icon;
        const active = currentPage === item.key;
        return (
          <button
            key={item.key}
            onClick={() => { setCurrentPage(item.key); setMobileSidebarOpen(false); }}
            className={classNames(
              'group relative w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-all',
              active
                ? 'text-white bg-primary-700'
                : 'text-brown-100 hover:bg-brown-800/60 hover:text-white'
            )}
            title={collapsed ? item.label : undefined}
          >
            {active && <span className="absolute left-0 top-0 bottom-0 w-1 bg-gold-400 rounded-r" />}
            <Icon className={classNames('w-5 h-5 flex-shrink-0', active ? 'text-gold-300' : '')} />
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
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setMobileSidebarOpen(false)} />
      )}
      <aside
        className={classNames(
          'fixed lg:sticky top-0 left-0 z-40 h-screen bg-brown-900 flex flex-col transition-all duration-300',
          sidebarCollapsed ? 'w-20' : 'w-64',
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className={classNames('flex items-center gap-3 px-4 h-16 border-b border-brown-800 flex-shrink-0', sidebarCollapsed && 'justify-center')}>
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-gold-500 flex items-center justify-center flex-shrink-0">
            <Volume2 className="w-5 h-5 text-white" />
          </div>
          {!sidebarCollapsed && (
            <div className="min-w-0">
              <p className="text-sm font-bold text-white truncate leading-tight">HOI AN</p>
              <p className="text-[11px] text-gold-300 leading-tight">AUDIO GUIDE</p>
              <p className="text-[10px] text-brown-300 uppercase tracking-wider">Admin Portal</p>
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto scrollbar-thin py-4">
          <NavSection title="Main" items={mainItems} collapsed={sidebarCollapsed} />
          <NavSection title="Management" items={managementItems} collapsed={sidebarCollapsed} />
          <NavSection title="Analytics" items={analyticsItems} collapsed={sidebarCollapsed} />
          <NavSection title="System" items={systemItems} collapsed={sidebarCollapsed} />
        </nav>

        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="hidden lg:flex items-center justify-center gap-2 px-4 py-3 border-t border-brown-800 text-brown-200 hover:text-white hover:bg-brown-800/60 transition-colors text-xs"
        >
          {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <><ChevronLeft className="w-4 h-4" /> Collapse</>}
        </button>
      </aside>
    </>
  );
}
