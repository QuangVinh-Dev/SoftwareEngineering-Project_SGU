import { useState, useRef, useEffect } from 'react';
import { ChevronDown, User, FileCheck, LogOut } from 'lucide-react';
import { useApp } from '@/hooks/useApp';
import ConfirmDialog from '@/components/modals/ConfirmDialog';

interface ProfileDropdownProps {
  onProfile: () => void;
}

export default function ProfileDropdown({ onProfile }: ProfileDropdownProps) {
  const [open, setOpen] = useState(false);
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { signOut, setCurrentPage, authUser } = useApp();

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const displayName = authUser?.fullName || authUser?.stallName || authUser?.username || 'Chủ gian hàng';
  const stallName = authUser?.stallName || 'Gian hàng Hội An';
  const initials = displayName.split(' ').slice(-1)[0]?.charAt(0).toUpperCase() || 'GH';

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2.5 p-1.5 pr-2.5 rounded-xl hover:bg-slate-100 transition-colors"
      >
        <div className="w-9 h-9 rounded-xl bg-[#286b7b] flex items-center justify-center text-white text-xs font-bold shadow-sm">
          {initials}
        </div>
        <div className="hidden sm:block text-left min-w-0 max-w-[140px]">
          <p className="text-xs font-bold text-slate-800 leading-tight truncate">{displayName}</p>
          <p className="text-[11px] text-[#286b7b] font-medium leading-tight truncate">{stallName}</p>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full mt-2 right-0 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 animate-scale-in overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 bg-slate-50">
            <div className="w-10 h-10 rounded-xl bg-[#286b7b] flex items-center justify-center text-white text-xs font-bold shadow-sm flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">{displayName}</p>
              <p className="text-[11px] text-slate-400 truncate">{authUser?.email || authUser?.username}</p>
            </div>
          </div>

          <div className="py-1.5">
            <button
              onClick={() => { onProfile(); setOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#286b7b] transition-colors"
            >
              <User className="w-4 h-4 text-slate-500" /> Hồ sơ gian hàng
            </button>
            <button
              onClick={() => { setCurrentPage('approval-status'); setOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#286b7b] transition-colors"
            >
              <FileCheck className="w-4 h-4 text-slate-500" /> Trạng thái phê duyệt
            </button>
          </div>

          <div className="border-t border-slate-100 py-1.5">
            <button
              onClick={() => { setLogoutConfirm(true); setOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" /> Đăng xuất
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={logoutConfirm}
        onClose={() => setLogoutConfirm(false)}
        onConfirm={signOut}
        title="Đăng xuất"
        message="Bạn có chắc chắn muốn đăng xuất khỏi tài khoản gian hàng không?"
        confirmLabel="Đăng xuất"
        cancelLabel="Hủy"
        variant="danger"
      />
    </div>
  );
}
