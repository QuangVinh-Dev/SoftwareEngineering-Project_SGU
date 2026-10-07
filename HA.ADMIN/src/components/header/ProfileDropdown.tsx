import { useState, useRef, useEffect } from 'react';
import { ChevronDown, User, Lock, Settings, Clock, LogOut } from 'lucide-react';
import { useApp } from '@/hooks/useApp';
import ConfirmDialog from '@/components/modals/ConfirmDialog';

interface ProfileDropdownProps {
  onProfile: () => void;
  onChangePassword: () => void;
  onAccountSettings: () => void;
  onRecentActivity: () => void;
}

export default function ProfileDropdown({ onProfile, onChangePassword, onAccountSettings, onRecentActivity }: ProfileDropdownProps) {
  const [open, setOpen] = useState(false);
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { setIsLoggedIn } = useApp();

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 p-1 pr-2 rounded-lg hover:bg-brown-50 transition-colors"
      >
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-sm font-semibold">
          AD
        </div>
        <div className="hidden sm:block text-left">
          <p className="text-sm font-semibold text-brown-800 leading-tight">Administrator</p>
          <p className="text-[11px] text-brown-400 leading-tight">Admin</p>
        </div>
        <ChevronDown className={`w-4 h-4 text-brown-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full mt-2 right-0 w-64 bg-white rounded-xl shadow-xl border border-brown-100 z-50 animate-scale-in overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-brown-100">
            <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-sm font-semibold">
              AD
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-brown-900 truncate">Administrator</p>
              <p className="text-xs text-brown-400">admin@hoianaudioguide.vn</p>
            </div>
          </div>

          <div className="py-1">
            <button onClick={() => { onProfile(); setOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-brown-700 hover:bg-brown-50 transition-colors">
              <User className="w-4 h-4 text-brown-400" /> Hồ sơ cá nhân
            </button>
            <button onClick={() => { onChangePassword(); setOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-brown-700 hover:bg-brown-50 transition-colors">
              <Lock className="w-4 h-4 text-brown-400" /> Đổi mật khẩu
            </button>
            <button onClick={() => { onAccountSettings(); setOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-brown-700 hover:bg-brown-50 transition-colors">
              <Settings className="w-4 h-4 text-brown-400" /> Cài đặt tài khoản
            </button>
            <button onClick={() => { onRecentActivity(); setOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-brown-700 hover:bg-brown-50 transition-colors">
              <Clock className="w-4 h-4 text-brown-400" /> Hoạt động gần đây
            </button>
          </div>

          <div className="border-t border-brown-100 py-1">
            <button onClick={() => { setLogoutConfirm(true); setOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
              <LogOut className="w-4 h-4" /> Đăng xuất
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={logoutConfirm}
        onClose={() => setLogoutConfirm(false)}
        onConfirm={() => setIsLoggedIn(false)}
        title="Logout"
        message="Are you sure you want to logout?"
        confirmLabel="Logout"
        cancelLabel="Cancel"
        variant="danger"
      />
    </div>
  );
}
