import { useState, useRef, useEffect } from 'react';
import { ChevronDown, User, FileCheck, LogOut } from 'lucide-react';
import { useApp } from '@/hooks/useApp';
import { stallOwnerProfile } from '@/data/mockData';
import ConfirmDialog from '@/components/modals/ConfirmDialog';

interface ProfileDropdownProps {
  onProfile: () => void;
}

export default function ProfileDropdown({ onProfile }: ProfileDropdownProps) {
  const [open, setOpen] = useState(false);
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { setIsLoggedIn, setCurrentPage } = useApp();

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const initials = stallOwnerProfile.name.split(' ').slice(-1)[0]?.charAt(0).toUpperCase() || 'CG';

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 p-1 pr-2 rounded-lg hover:bg-brown-50 transition-colors"
      >
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-sm font-semibold">
          {initials}
        </div>
        <div className="hidden sm:block text-left">
          <p className="text-sm font-semibold text-brown-800 leading-tight">Chủ gian hàng</p>
          <p className="text-[11px] text-brown-400 leading-tight">{stallOwnerProfile.stallName}</p>
        </div>
        <ChevronDown className={`w-4 h-4 text-brown-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full mt-2 right-0 w-64 bg-white rounded-xl shadow-xl border border-brown-100 z-50 animate-scale-in overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-brown-100">
            <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-sm font-semibold">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-brown-900 truncate">{stallOwnerProfile.name}</p>
              <p className="text-xs text-brown-400">{stallOwnerProfile.email}</p>
            </div>
          </div>

          <div className="py-1">
            <button onClick={() => { onProfile(); setOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-brown-700 hover:bg-brown-50 transition-colors">
              <User className="w-4 h-4 text-brown-400" /> Tài khoản của tôi
            </button>
            <button onClick={() => { setCurrentPage('approval-status'); setOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-brown-700 hover:bg-brown-50 transition-colors">
              <FileCheck className="w-4 h-4 text-brown-400" /> Trạng thái tài khoản
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
        title="Đăng xuất"
        message="Bạn có chắc chắn muốn đăng xuất không?"
        confirmLabel="Đăng xuất"
        cancelLabel="Hủy"
        variant="danger"
      />
    </div>
  );
}
