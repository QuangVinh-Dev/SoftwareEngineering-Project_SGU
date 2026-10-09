import { useState, useRef, useEffect } from 'react';
import { Bell, MapPin, Headphones, Shield, FileCheck } from 'lucide-react';
import { notifications as initialNotifs } from '@/data/mockData';
import { useApp } from '@/hooks/useApp';

const typeIcons = {
  poi: MapPin,
  audio: Headphones,
  approval: FileCheck,
  system: Shield,
};

const typeColors = {
  poi: 'bg-primary-100 text-primary-600',
  audio: 'bg-blue-100 text-blue-600',
  approval: 'bg-green-100 text-green-600',
  system: 'bg-brown-200 text-brown-600',
};

export default function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState(initialNotifs);
  const ref = useRef<HTMLDivElement>(null);
  const { setCurrentPage } = useApp();

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const unreadCount = notifs.filter(n => !n.read).length;

  const markAllRead = () => setNotifs(prev => prev.map(n => ({ ...n, read: true })));
  const markRead = (id: number) => {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    const notif = notifs.find(n => n.id === id);
    if (notif?.link) {
      setCurrentPage(notif.link as never);
      setOpen(false);
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-brown-50 transition-colors text-brown-600"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute top-full mt-2 right-0 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-brown-100 z-50 animate-scale-in overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-brown-100">
            <h3 className="text-sm font-semibold text-brown-900">Thông báo</h3>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                Đánh dấu tất cả đã đọc
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto scrollbar-thin">
            {notifs.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-brown-400">Không có thông báo</div>
            )}
            {notifs.map(n => {
              const Icon = typeIcons[n.type];
              return (
                <button
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  className={`w-full flex gap-3 px-4 py-3 hover:bg-brown-50 transition-colors text-left border-b border-brown-50 ${!n.read ? 'bg-primary-50/40' : ''}`}
                >
                  <div className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${typeColors[n.type]}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-brown-900">{n.title}</p>
                    <p className="text-xs text-brown-500 mt-0.5">{n.message}</p>
                    <p className="text-[11px] text-brown-400 mt-1">{n.time}</p>
                  </div>
                  {!n.read && <span className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-2" />}
                </button>
              );
            })}
          </div>

          {notifs.length > 0 && (
            <div className="px-4 py-2.5 border-t border-brown-100 text-center">
              <button onClick={markAllRead} className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                Xem tất cả thông báo
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
